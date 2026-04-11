# SPDX-License-Identifier: AGPL-3.0-only

"""FastAPI endpoints for transit calculations."""

from __future__ import annotations

from datetime import datetime
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

