# SPDX-License-Identifier: AGPL-3.0-only

"""FastAPI endpoints for transit calculations."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from astro.aspects import AspectConfig, Aspect, find_aspects, detect_patterns
from astro.transits import compute_transits, compute_transits_to_angles
from astro.houses_multi import compute_houses
from astro.julian import datetime_to_julian_day
from astro.swisseph_positions import get_positions_from_swisseph
from astro.julian import datetime_to_julian_day
from astro.master_prompt_builder import build_natal_reading_prompt
from astro.chart_utils import build_chart_payload_for_narrative
from astro.transit_exact_search import find_next_exacts_for_hints
from astro.lunar_events import next_lunar_event_utc, normalize_moon_sign_token
from api.schemas import NarrativeConfig

router = APIRouter(prefix="/api", tags=["transits"])


class TransitRequest(BaseModel):
    natal_positions: Dict[str, float] = Field(..., description="Natal planetary positions (body -> longitude)")
    natal_asc: Optional[float] = Field(None, description="Natal ascendant longitude")
    natal_mc: Optional[float] = Field(None, description="Natal midheaven longitude")
    target_date: str = Field(..., description="Target date for transits (ISO format)")
    latitude: Optional[float] = Field(None, description="Latitude for transit chart (optional)")
    longitude: Optional[float] = Field(None, description="Longitude for transit chart (optional)")
    house_system: Optional[str] = Field("placidus", description="House system for transit chart")
    include_angles: Optional[bool] = Field(True, description="Include transits to angles")
    include_patterns: Optional[bool] = Field(False, description="Include aspect patterns")
    narrative: Optional[NarrativeConfig] = Field(None, description="Narrative configuration")


class TransitExactHintModel(BaseModel):
    transiting_body: str
    natal_body: str
    aspect: str


class NextExactTimesRequest(BaseModel):
    natal_positions: Dict[str, float] = Field(..., description="Longitudes thème (clé = nom de corps, ex. sun)")
    natal_asc: Optional[float] = Field(None, description="Longitude ascendant natal")
    natal_mc: Optional[float] = Field(None, description="Longitude milieu du ciel natal")
    from_date: str = Field(..., description="Instant de départ, ISO 8601 (UTC)")
    hints: List[TransitExactHintModel] = Field(..., description="Aspects transits à affiner dans le temps")
    horizon_days: int = Field(540, ge=1, le=2500)


class NextExactHit(BaseModel):
    transiting_body: str
    natal_body: str
    aspect: str
    exact_utc: str
    min_orb_deg: float


class NextExactTimesResponse(BaseModel):
    exacts: List[NextExactHit]


class NextLunarEventRequest(BaseModel):
    from_date: str = Field(..., description="Instant de départ, ISO 8601 (UTC ou offset)")
    event: str = Field("full_moon", description="full_moon ou new_moon")
    moon_sign: Optional[str] = Field(
        None,
        description="Signe de la Lune souhaité (ex. scorpio, scorpion) ; optionnel",
    )
    max_moons_to_scan: int = Field(36, ge=1, le=48)


class NextLunarEventHitModel(BaseModel):
    exact_utc: str
    event: str
    moon_longitude_deg: float
    sun_longitude_deg: float
    moon_sign_en: str
    moon_sign_fr: str
    sun_sign_fr: str


class NextLunarEventResponse(BaseModel):
    hit: Optional[NextLunarEventHitModel] = None
    scanned: List[NextLunarEventHitModel] = Field(default_factory=list)
    lines_fr: List[str] = Field(default_factory=list)


class TransitResponse(BaseModel):
    target_date: str
    transits: List[Dict]
    transits_to_angles: Optional[List[Dict]] = None
    # Structured chart data
    planets: Optional[Dict[str, float]] = None
    ascendant: Optional[float] = None
    midheaven: Optional[float] = None
    houses: Optional[Dict[str, float]] = None
    house_system: Optional[str] = None
    # Patterns and narrative
    patterns: Optional[Dict] = None
    narrative_seed: Optional[str] = None


@router.post("/transits", response_model=TransitResponse)
async def calculate_transits(request: TransitRequest):
    """Compute transits for a given date with optional chart data and narrative."""
    try:
        target_datetime = datetime.fromisoformat(request.target_date.replace("Z", "+00:00"))
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format.")

    config = AspectConfig()
    transits = compute_transits(request.natal_positions, target_datetime, config)

    transits_list = [
        {
            "transiting_body": t.body1.replace("transit_", ""),
            "natal_body": t.body2.replace("natal_", ""),
            "aspect": t.aspect,
            "orb_deg": t.orb_deg,
            "applying": t.applying,
            "exact": t.exact,
        }
        for t in transits
    ]

    transits_to_angles_list = None
    if request.include_angles and request.natal_asc is not None and request.natal_mc is not None:
        transits_to_angles_list = compute_transits_to_angles(
            request.natal_asc, request.natal_mc, target_datetime, config
        )

    # Get transit chart data if latitude/longitude provided
    transit_jd = datetime_to_julian_day(target_datetime)
    transit_planets = get_positions_from_swisseph(target_datetime, transit_jd)
    transit_asc = None
    transit_mc = None
    transit_cusps = None
    transit_houses = None
    house_system = request.house_system or "placidus"
    if request.latitude is not None and request.longitude is not None:
        # compute_houses now returns (cusps, ascendant, midheaven)
        # All values are calculated by Swiss Ephemeris exclusively
        cusps_tuple = compute_houses(
            house_system,
            transit_jd,
            request.latitude,
            request.longitude,
            None,
            None,
        )
        if isinstance(cusps_tuple, tuple) and len(cusps_tuple) == 3:
            transit_cusps, transit_asc, transit_mc = cusps_tuple
        else:
            raise ValueError(f"Invalid return format from compute_houses: expected tuple of 3, got {type(cusps_tuple)}")
        transit_houses = {str(i + 1): cusp for i, cusp in enumerate(transit_cusps)}
    else:
        transit_houses = {}

    # Detect patterns if requested
    patterns_dict = None
    if request.include_patterns and transits:
        # Use the transit aspects directly for pattern detection
        patterns_dict = detect_patterns(transits)

    # Generate narrative seed if requested
    narrative_seed = None
    if request.narrative:
        narrative_config = {
            "tone": request.narrative.tone or "mythic",
            "depth": request.narrative.depth or "standard",
            "focus": request.narrative.focus or [],
        }
        chart_context_payload = build_chart_payload_for_narrative(
            transit_planets,
            transit_asc,
            transit_mc,
            transit_cusps,
            transit_houses,
            house_system,
        )
        transits_for_narrative = [
            {
                "transiting_body": t.body1.replace("transit_", ""),
                "natal_body": t.body2.replace("natal_", ""),
                "aspect": t.aspect,
                "orb_deg": t.orb_deg,
                "applying": t.applying,
                "exact": t.exact,
            }
            for t in transits
        ]
        narrative_seed = build_natal_reading_prompt(
            chart_context_payload,
            aspects=None,
            transits=transits_for_narrative,
            patterns=patterns_dict or {},
            narrative_config=narrative_config,
            chart_context="transit",
        )

    return TransitResponse(
        target_date=request.target_date,
        transits=transits_list,
        transits_to_angles=transits_to_angles_list,
        planets=transit_planets,
        ascendant=transit_asc,
        midheaven=transit_mc,
        houses=transit_houses,
        house_system=house_system if transit_houses else None,
        patterns=patterns_dict,
        narrative_seed=narrative_seed,
    )


def _parse_iso_utc(value: str) -> datetime:
    s = value.strip()
    if s.endswith("Z"):
        s = s[:-1] + "+00:00"
    dt = datetime.fromisoformat(s)
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


@router.post("/transits/next-exact-times", response_model=NextExactTimesResponse)
async def next_exact_times(request: NextExactTimesRequest):
    """
    Prochains passages où l'orbe d'un transit donné est minimale (proche de l'exact),
    par recherche sur l'éphéméride Swiss Ephemeris.
    """
    try:
        from_dt = _parse_iso_utc(request.from_date)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="from_date invalide (ISO 8601 attendu)")

    angle_longitudes: Optional[Dict[str, float]] = None
    if request.natal_asc is not None:
        a = float(request.natal_asc)
        angle_longitudes = {
            "asc": a,
            "dsc": (a + 180.0) % 360.0,
        }
        if request.natal_mc is not None:
            m = float(request.natal_mc)
            angle_longitudes["mc"] = m
            angle_longitudes["ic"] = (m + 180.0) % 360.0

    hints_plain = [h.model_dump() for h in request.hints]
    raw_exacts = find_next_exacts_for_hints(
        hints_plain,
        request.natal_positions,
        angle_longitudes,
        from_dt,
        horizon_days=request.horizon_days,
        config=AspectConfig(),
    )
    exacts = [NextExactHit(**x) for x in raw_exacts]
    return NextExactTimesResponse(exacts=exacts)


@router.post("/transits/next-lunar-event", response_model=NextLunarEventResponse)
async def next_lunar_event(request: NextLunarEventRequest):
    """
    Prochaine pleine lune ou nouvelle lune après `from_date`, avec option de filtre
    sur le signe de la Lune (calcul Soleil–Lune, Swiss Ephemeris).
    """
    try:
        from_dt = _parse_iso_utc(request.from_date)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="from_date invalide (ISO 8601 attendu)")

    ev = (request.event or "full_moon").strip().lower()
    if ev not in ("full_moon", "new_moon"):
        raise HTTPException(status_code=400, detail="event doit être full_moon ou new_moon")

    wanted = normalize_moon_sign_token(request.moon_sign) if request.moon_sign else None
    hit, scanned = next_lunar_event_utc(
        from_dt,
        ev,
        moon_sign_en=wanted,
        max_moons_to_scan=request.max_moons_to_scan,
    )

    def fmt(h) -> str:
        iso = h.exact_utc.replace(microsecond=0).isoformat().replace("+00:00", "Z")
        label = "Pleine lune" if h.event == "full_moon" else "Nouvelle lune"
        return (
            f"- {label} : {iso} (UTC) · Lune ~{h.moon_longitude_deg:.2f}° ({h.moon_sign_fr}) · "
            f"Soleil ~{h.sun_longitude_deg:.2f}° ({h.sun_sign_fr})"
        )

    lines_fr: List[str] = []
    if hit:
        lines_fr.append(fmt(hit))
    elif scanned:
        lines_fr.append(
            "Aucune lunaison du type demandé avec filtre de signe dans l’horizon scanné ; "
            "prochaines occurrences (sans filtre de signe sur la liste) :"
        )
        for h in scanned[:8]:
            lines_fr.append(fmt(h))

    hit_model = (
        NextLunarEventHitModel(
            exact_utc=hit.exact_utc.replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            event=hit.event,
            moon_longitude_deg=round(hit.moon_longitude_deg, 4),
            sun_longitude_deg=round(hit.sun_longitude_deg, 4),
            moon_sign_en=hit.moon_sign_en,
            moon_sign_fr=hit.moon_sign_fr,
            sun_sign_fr=hit.sun_sign_fr,
        )
        if hit
        else None
    )
    scanned_models = [
        NextLunarEventHitModel(
            exact_utc=h.exact_utc.replace(microsecond=0).isoformat().replace("+00:00", "Z"),
            event=h.event,
            moon_longitude_deg=round(h.moon_longitude_deg, 4),
            sun_longitude_deg=round(h.sun_longitude_deg, 4),
            moon_sign_en=h.moon_sign_en,
            moon_sign_fr=h.moon_sign_fr,
            sun_sign_fr=h.sun_sign_fr,
        )
        for h in scanned
    ]
    return NextLunarEventResponse(hit=hit_model, scanned=scanned_models, lines_fr=lines_fr)

