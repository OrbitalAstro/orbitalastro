"""FastAPI endpoints that expose the pure-Python natal engine."""

from __future__ import annotations

import logging
import time
from datetime import date, datetime, time as dtime, timedelta, timezone
from math import pi
from typing import Dict, List, Optional, Union

from fastapi import FastAPI, HTTPException, Request, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from astro.aspects import AspectConfig, detect_patterns, find_aspects
from astro.ephemeris_catalog import catalog
from astro.ephemeris_loader import BODY_ORDER
from astro.swisseph_positions import get_positions_from_swisseph
from astro.geodata import list_supported_cities, lookup_city
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

# CORS configuration - allow all origins for Vercel deployments
# In production, we allow all origins since we're behind Vercel's protection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (Vercel frontend URLs are dynamic)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handler to ensure CORS headers are added to all error responses
# Note: This matches the CORS middleware configuration (allow_origins=["*"])
# When allow_origins=["*"] with allow_credentials=True, FastAPI mirrors the request origin
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception", exc_info=exc)
    # Mirror the request origin to match FastAPI CORS middleware behavior
    # Cross-origin requests always include an Origin header
    origin = request.headers.get("origin")
    cors_headers = {}
    
    # Only add CORS headers for cross-origin requests (when Origin header is present)
    # This matches the middleware behavior when allow_origins=["*"] with credentials
    if origin:
        cors_headers = {
            "Access-Control-Allow-Origin": origin,  # Mirror the request origin
            "Access-Control-Allow-Credentials": "true",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        }
    
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
        headers=cors_headers,
    )


@app.middleware("http")
async def telemetry_middleware(request: Request, call_next):
    telemetry.record_request()
    start = time.perf_counter()
    try:
        response = await call_next(request)
        return response
    except HTTPException as exc:
        telemetry.record_error()
        logger.exception("Request failed", exc_info=exc)
        # Re-raise HTTPException so FastAPI can handle it with CORS headers
        raise
    except Exception as exc:
        telemetry.record_error()
        logger.exception("Request failed", exc_info=exc)
        # Convert to HTTPException so CORS middleware can add headers
        raise HTTPException(status_code=500, detail=str(exc))
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
        # If specific coordinates are provided, we can skip the strict city lookup
        if request.latitude is not None and request.longitude is not None:
            return None

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
        # Map invalid timezone names to valid ones
        timezone_map = {
            "America/Montreal": "America/Toronto",  # Montreal uses Toronto timezone
        }
        if tz_key in timezone_map:
            tz_key = timezone_map[tz_key]
        try:
            return ZoneInfo(tz_key)
        except ZoneInfoNotFoundError:
            raise HTTPException(status_code=400, detail=f"Unknown timezone name: {tz_key}")
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
    # Defensive: ensure we have exactly 12 cusps
    if len(cusps) != 12:
        logger.error(f"Invalid cusp list length: {len(cusps)}, expected 12. Cusps: {cusps}")
        raise ValueError(f"Invalid cusp list: expected 12 cusps, got {len(cusps)}")
    
    # Normalize longitude to [0, 360)
    lon_norm = longitude % 360.0
    
    # Normalize all cusps to [0, 360)
    cusps_norm = [c % 360.0 for c in cusps]
    
    # Find which house contains this longitude by checking each house interval
    # Houses are defined by the interval from cusp[i] to cusp[i+1]
    for index in range(12):
        start = cusps_norm[index]
        end = cusps_norm[(index + 1) % 12]
        
        # Check if longitude is in this interval
        if start <= end:
            # Normal case: no wrap-around (e.g., 100° to 150°)
            if start <= lon_norm < end:
                return index + 1
        else:
            # Wrap-around case: start > end (e.g., 350° to 10°)
            if lon_norm >= start or lon_norm < end:
                return index + 1
    
    # Fallback: if we somehow didn't find a match, check if exactly on a cusp
    for index in range(12):
        if abs(lon_norm - cusps_norm[index]) < 0.0001:
            return index + 1
    
    # Last resort: return house 12 (should never reach here)
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

    # Calculate positions directly using Swiss Ephemeris
    positions = get_positions_from_swisseph(utc_dt, jd)
    if use_topocentric_moon and "moon" in positions:
        positions["moon"] = get_moon_with_parallax(utc_dt, latitude, longitude, True)

    # compute_houses now returns (cusps, ascendant, midheaven)
    # All values are calculated by Swiss Ephemeris exclusively
    cusps_tuple = compute_houses(house_system, jd, latitude, longitude, None, None)
    if isinstance(cusps_tuple, tuple) and len(cusps_tuple) == 3:
        cusps, asc, mc = cusps_tuple
    else:
        raise ValueError(f"Invalid return format from compute_houses: expected tuple of 3, got {type(cusps_tuple)}")
    if not isinstance(cusps, list) or len(cusps) != 12:
        raise ValueError(f"Invalid cusp list for house system '{house_system}': {type(cusps).__name__} len={getattr(cusps, '__len__', lambda: 'n/a')()}")
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
    logger.info(f"Received natal chart request: birth_date={request.birth_date}, birth_time={request.birth_time}, latitude={request.latitude}, longitude={request.longitude}, timezone={request.timezone}")
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
        logger.error(f"FileNotFoundError in natal chart calculation: {exc}")
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        logger.exception(f"Error in natal chart calculation: {exc}")
        raise HTTPException(status_code=500, detail=f"Error calculating chart: {str(exc)}")

    ephemeris = chart["positions"]
    asc_deg = chart["ascendant"]
    mc_deg = chart["midheaven"]
    cusps = chart["cusps"]
    gmst_hours = chart["gmst_hours"]
    lst_rad = chart["lst_radians"]
    lst_hours = chart["lst_hours"]
    mean_eps = chart["mean_obliquity"]
    utc_dt = chart["utc_dt"]
    jd = chart["jd"]

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

# --- Legacy Endpoints for GPT Compatibility ---

@app.get("/houses")
async def get_houses(
    date: str,
    time: str = "12:00:00",
    latitude: float = Query(..., description="Latitude in degrees"),
    longitude: float = Query(..., description="Longitude in degrees"),
    system: str = "P",
):
    """Legacy endpoint for GPT: Get 12 house cusps."""
    try:
        birth_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    # Map legacy system codes to full names
    system_map = {
        "P": "placidus",
        "W": "whole_sign",
        "E": "equal",
        "K": "koch",
        "R": "regiomontanus",
        "C": "campanus",
        "M": "meridian",
        "T": "topocentric"
    }
    house_system = system_map.get(system, "placidus")

    # Build request for core logic
    # Defaulting to UTC if no timezone info provided, which is standard for simple ephemeris
    local_dt = datetime.combine(birth_date, _parse_local_time(time)).replace(tzinfo=timezone.utc)
    
    chart = _build_chart_components(
        local_dt,
        latitude,
        longitude,
        house_system,
    )
    
    # Format for legacy response (list of objects)
    houses_list = []
    cusps = chart["cusps"]
    for i, cusp in enumerate(cusps):
        houses_list.append({
            "house_number": i + 1,
            "longitude": round(cusp, 4)
        })
        
    return houses_list

@app.get("/planets")
async def get_planets(
    date: str,
    time: str = "12:00:00",
    planets: Optional[str] = None
):
    """Legacy endpoint for GPT: Get planetary positions."""
    try:
        birth_date = datetime.strptime(date, "%Y-%m-%d").date()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    
    # Default to UTC
    local_dt = datetime.combine(birth_date, _parse_local_time(time)).replace(tzinfo=timezone.utc)
    utc_dt = local_dt  # Assuming input is UTC for simple calc
    
    simple_jd = datetime_to_julian_day(utc_dt)
    ephemeris = get_positions_from_swisseph(utc_dt, simple_jd)
    
    target_bodies = BODY_ORDER
    if planets:
        requested = [p.strip().lower() for p in planets.split(",")]
        target_bodies = [b for b in requested if b in ephemeris]
        
    results = []
    for body in target_bodies:
        if body in ephemeris:
            # We don't have speed/lat in cached ephemeris currently, only longitude
            # For GPT legacy, we return what we have
            results.append({
                "planet": body.capitalize(),
                "longitude": round(ephemeris[body], 4),
                "latitude": 0.0, # Placeholder
                "distance": 1.0, # Placeholder
                "speed_longitude": 0.0 # Placeholder
            })
            
    return results

@app.get("/all")
async def get_all_data(
    date: str,
    time: str = "12:00:00",
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    system: str = "P",
    orb_tolerance: float = 1.0
):
    """Legacy endpoint for GPT: Get all data."""
    # This is a wrapper around the components
    houses_data = []
    if latitude is not None and longitude is not None:
        houses_data = await get_houses(date, time, latitude, longitude, system)
        
    planets_data = await get_planets(date, time)
    
    # Simplified aspects for legacy
    aspects_data = []
    
    return {
        "date": date,
        "time": time,
        "julian_day": 0.0, # Placeholder
        "planets": planets_data,
        "houses": houses_data,
        "aspects": aspects_data
    }
