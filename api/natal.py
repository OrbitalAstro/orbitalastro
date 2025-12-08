"""FastAPI endpoints that expose the pure-Python natal engine."""

from __future__ import annotations

import logging
import time
from datetime import date, datetime, time as dtime, timedelta, timezone
from math import pi
from typing import Dict, List, Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from astro.aspects import AspectConfig, detect_patterns, find_aspects
from astro.ephemeris_catalog import catalog
from astro.ephemeris_loader import BODY_ORDER, EphemerisRepository
from astro.geodata import list_supported_cities, lookup_city
from astro.houses import compute_asc_mc
from astro.houses_multi import compute_houses
from astro.julian import datetime_to_julian_day
from astro.objects_extra import compute_arabic_parts
from astro.obliquity import mean_obliquity
from astro.parallax import get_moon_with_parallax
from astro.rectification import rectify_birth_time
from astro.sidereal import gmst_from_jd, lst_from_jd_and_longitude
from astro.telemetry import telemetry

logger = logging.getLogger("orbitalastro")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

SIGN_NAMES = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
]


class NarrativeConfig(BaseModel):
    tone: Optional[str] = Field(
        "mythic", description="Tone: mythic, psychological, coaching, cinematic, soft_therapeutic"
    )
    depth: Optional[str] = Field("standard", description="Depth: short, standard, long")
    focus: Optional[List[str]] = Field(
        default_factory=list, description="Focus domains: career, relationships, family, spirituality, creativity, healing"
    )


class RectifyEventModel(BaseModel):
    type: str
    datetime_local: str
    weight: Optional[float] = 1.0


class RectifyRequest(BaseModel):
    birth_date: date
    approx_time: str
    timezone: str
    latitude_deg: float
    longitude_deg: float
    time_window_hours: Optional[float] = 4.0
    events: Optional[List[RectifyEventModel]] = Field(default_factory=list)


class NatalRequest(BaseModel):
    birth_date: date
    birth_time: str = Field("12:00:00", description="Local time as HH:MM or HH:MM:SS")
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    timezone: Optional[str] = Field(None, description="IANA timezone name")
    timezone_offset_minutes: Optional[int] = Field(
        None, description="Fallback UTC offset in minutes (east positive)"
    )
    birth_city: Optional[str] = Field(None, description="City name or alias")
    house_system: Optional[str] = Field("placidus", description="House system: placidus, whole_sign, equal, koch, porphyry, regiomontanus, campanus, alcabitius, meridian, topocentric")
    include_extra_objects: Optional[bool] = Field(False, description="Include extra objects (Lilith, asteroids, etc.)")
    use_topocentric_moon: Optional[bool] = Field(False, description="Use topocentric Moon parallax correction")
    include_aspects: Optional[bool] = Field(True, description="Include aspect calculations")
    narrative: Optional[NarrativeConfig] = Field(None, description="Narrative personalization config")

    @field_validator("birth_time")
    def _validate_time_format(cls, value: str) -> str:
        for fmt in ("%H:%M:%S", "%H:%M"):
            try:
                datetime.strptime(value, fmt)
                return value
            except ValueError:
                continue
        raise ValueError("birth_time must follow HH:MM or HH:MM:SS")


class PlanetInfo(BaseModel):
    longitude: float
    sign: str
    house: int


class AspectInfo(BaseModel):
    body1: str
    body2: str
    aspect: str
    orb_deg: float
    applying: bool
    exact: bool


class NatalResponse(BaseModel):
    input: Dict
    julian_day: float
    gmst_hours: float
    lst_hours: float
    lst_radians: float
    mean_obliquity_radians: float
    ascendant: float
    midheaven: float
    houses: Dict[str, float]
    house_system: str
    planets: Dict[str, PlanetInfo]
    aspects: Optional[List[AspectInfo]] = None
    patterns: Optional[Dict] = None
    extra_objects: Optional[Dict] = None


app = FastAPI(
    title="OrbitalAstro Natal API",
    description="Compute natal charts from precomputed ephemeris caches and pure Python math.",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def telemetry_middleware(request: Request, call_next):
    telemetry.record_request()
    start = time.perf_counter()
    try:
        response = await call_next(request)
        return response
    except Exception as exc:
        telemetry.record_error()
        logger.exception("Request failed", exc_info=exc)
        raise
    finally:
        telemetry.record_latency(time.perf_counter() - start)


@app.on_event("startup")
async def startup_event():
    logger.info("Ephemeris catalog loaded years: %s", catalog.available_years())


@app.get("/")
async def root() -> Dict[str, str]:
    return {
        "message": "Use POST /natal to compute a natal chart with precomputed ephemeris.",
        "status": "ready",
    }


@app.get("/cities")
async def supported_cities():
    return {"supported_cities": list_supported_cities()}


@app.get("/metrics")
async def metrics():
    return telemetry.snapshot()


def _resolve_city(request: NatalRequest) -> Optional[Dict]:
    if not request.birth_city:
        return None
    city = lookup_city(request.birth_city)
    if city is None:
        raise HTTPException(
            status_code=404,
            detail=f"Unknown city '{request.birth_city}'. Available: {list_supported_cities()}",
        )
    return city


def _parse_local_time(value: str) -> dtime:
    for fmt in ("%H:%M:%S", "%H:%M"):
        try:
            return datetime.strptime(value, fmt).time()
        except ValueError:
            continue
    raise HTTPException(status_code=400, detail="birth_time must use HH:MM or HH:MM:SS")


def _determine_timezone(request: NatalRequest, city_data: Optional[Dict]) -> timezone:
    tz_key = (request.timezone or "").strip()
    if tz_key:
        if tz_key in {"UTC", "Etc/UTC"}:
            return timezone.utc
        try:
            return ZoneInfo(tz_key)
        except ZoneInfoNotFoundError:
            raise HTTPException(status_code=400, detail="Unknown timezone name")
    if city_data and city_data.get("timezone"):
        try:
            return ZoneInfo(city_data["timezone"])
        except ZoneInfoNotFoundError:
            logger.warning("Missing zoneinfo for %s", city_data["timezone"])
            return timezone.utc
    if request.timezone_offset_minutes is not None:
        return timezone(timedelta(minutes=request.timezone_offset_minutes))
    raise HTTPException(status_code=400, detail="Provide timezone or timezone_offset_minutes")


def _ensure_latlon(request: NatalRequest, city_data: Optional[Dict]) -> Dict[str, float]:
    lat = request.latitude
    lon = request.longitude
    if lat is None or lon is None:
        if city_data:
            lat = lat if lat is not None else city_data.get("latitude")
            lon = lon if lon is not None else city_data.get("longitude")
    if lat is None or lon is None:
        raise HTTPException(status_code=400, detail="Latitude and longitude are required")
    return {"latitude": lat, "longitude": lon}


def _house_number_for_longitude(longitude: float, cusps: List[float]) -> int:
    for index in range(12):
        start = cusps[index]
        end = cusps[(index + 1) % 12]
        if start <= end:
            if start <= longitude < end:
                return index + 1
        else:
            if longitude >= start or longitude < end:
                return index + 1
    return 12


def _build_chart_components(
    local_dt: datetime,
    latitude: float,
    longitude: float,
    house_system: str,
    use_topocentric_moon: bool = False,
):
    utc_dt = local_dt.astimezone(timezone.utc)
    jd = datetime_to_julian_day(utc_dt)

    positions = EphemerisRepository.get_positions(utc_dt)
    if use_topocentric_moon and "moon" in positions:
        positions["moon"] = get_moon_with_parallax(utc_dt, latitude, longitude, True)

    asc, mc = compute_asc_mc(jd, latitude, longitude)
    cusps = compute_houses(house_system, jd, latitude, longitude, asc, mc)
    gmst_hours = gmst_from_jd(jd)
    lst_rad = lst_from_jd_and_longitude(jd, longitude)
    lst_hours = (lst_rad * 12.0) / pi
    mean_eps = mean_obliquity(jd)

    return {
        "utc_dt": utc_dt,
        "jd": jd,
        "positions": positions,
        "ascendant": asc,
        "midheaven": mc,
        "houses": {str(i + 1): cusp for i, cusp in enumerate(cusps)},
        "cusps": cusps,
        "gmst_hours": gmst_hours,
        "lst_hours": lst_hours,
        "lst_radians": lst_rad,
        "mean_obliquity": mean_eps,
    }


@app.post("/natal", response_model=NatalResponse)
async def natal_chart(request: NatalRequest):
    city_data = _resolve_city(request)
    location = _ensure_latlon(request, city_data)
    tz = _determine_timezone(request, city_data)
    local_time = _parse_local_time(request.birth_time)
    local_dt = datetime.combine(request.birth_date, local_time, tzinfo=tz)
    house_system = request.house_system or "placidus"

    try:
        chart = _build_chart_components(
            local_dt,
            location["latitude"],
            location["longitude"],
            house_system,
            request.use_topocentric_moon,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    ephemeris = chart["positions"]
    asc_deg = chart["ascendant"]
    mc_deg = chart["midheaven"]
    cusps = chart["cusps"]
    gmst_hours = chart["gmst_hours"]
    lst_rad = chart["lst_radians"]
    lst_hours = chart["lst_hours"]
    mean_eps = chart["mean_obliquity"]
    utc_dt = chart["utc_dt"]

    planets: Dict[str, PlanetInfo] = {}
    for body in BODY_ORDER:
        if body not in ephemeris:
            continue
        longitude = ephemeris[body]
        sign_index = int(longitude // 30) % 12
        house_number = _house_number_for_longitude(longitude, cusps)
        planets[body] = PlanetInfo(
            longitude=longitude,
            sign=SIGN_NAMES[sign_index],
            house=house_number,
        )

    houses = chart["houses"]

    # Compute aspects if requested
    aspects_list = None
    patterns_dict = None
    if request.include_aspects:
        aspect_config = AspectConfig()
        aspects_list = find_aspects(ephemeris, aspect_config, utc_dt)
        patterns_dict = detect_patterns(aspects_list, ephemeris)

    # Compute extra objects if requested
    extra_objects_dict = None
    if request.include_extra_objects:
        # Determine if day chart (Sun in houses 7-12)
        sun_house = planets.get("sun", PlanetInfo(longitude=0, sign="Aries", house=1)).house
        is_day_chart = sun_house >= 7
        extra_objects_dict = compute_arabic_parts(
            ephemeris.get("sun", 0.0),
            ephemeris.get("moon", 0.0),
            asc_deg,
            mc_deg,
            is_day_chart,
            include_vertex=True,
        )

    response = NatalResponse(
        input={
            "birth_date": request.birth_date.isoformat(),
            "birth_time": request.birth_time,
            "birth_city": request.birth_city,
            "latitude": location["latitude"],
            "longitude": location["longitude"],
            "timezone": tz.tzname(utc_dt),
            "house_system": house_system,
        },
        julian_day=jd,
        gmst_hours=gmst_hours,
        lst_hours=lst_hours,
        lst_radians=lst_rad,
        mean_obliquity_radians=mean_eps,
        ascendant=asc_deg,
        midheaven=mc_deg,
        houses=houses,
        house_system=house_system,
        planets=planets,
        aspects=[AspectInfo(
            body1=a.body1,
            body2=a.body2,
            aspect=a.aspect,
            orb_deg=a.orb_deg,
            applying=a.applying,
            exact=a.exact,
        ) for a in aspects_list] if aspects_list else None,
        patterns=patterns_dict,
        extra_objects=extra_objects_dict,
    )
    return response
