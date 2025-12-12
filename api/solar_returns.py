"""FastAPI endpoints for solar return calculations."""

from __future__ import annotations

from datetime import date, datetime
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from astro.solar_returns import compute_solar_return_chart, find_solar_return
from astro.aspects import AspectConfig, find_aspects, detect_patterns
from astro.master_prompt_builder import build_natal_reading_prompt
from astro.chart_utils import build_chart_payload_for_narrative
from api.schemas import NarrativeConfig

router = APIRouter(prefix="/api", tags=["solar-returns"])




class SolarReturnRequest(BaseModel):
    birth_date: str = Field(..., description="Birth date (ISO format)")
    natal_sun_longitude: float = Field(..., description="Natal Sun longitude in degrees")
    target_year: int = Field(..., description="Year for solar return")
    latitude: float = Field(..., description="Latitude for return chart")
    longitude: float = Field(..., description="Longitude for return chart")
    house_system: Optional[str] = Field("placidus", description="House system")
    include_aspects: Optional[bool] = Field(True, description="Include aspects")
    include_patterns: Optional[bool] = Field(False, description="Include aspect patterns")
    narrative: Optional[NarrativeConfig] = Field(None, description="Narrative configuration")


class SolarReturnResponse(BaseModel):
    return_datetime_utc: str
    planets: Dict[str, float]
    ascendant: float
    midheaven: float
    houses: Dict[str, float]
    house_system: str
    sun_exactness_deg: float
    natal_sun_longitude: float
    return_sun_longitude: float
    aspects: Optional[List[Dict]] = None
    patterns: Optional[Dict] = None
    narrative_seed: Optional[str] = None


@router.post("/solar-return", response_model=SolarReturnResponse)
async def calculate_solar_return(request: SolarReturnRequest):
    """Find and compute solar return chart."""
    try:
        birth_date = date.fromisoformat(request.birth_date)
        birth_datetime = datetime.combine(birth_date, datetime.min.time())
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format (YYYY-MM-DD).")

    return_datetime, return_chart = find_solar_return(
        request.natal_sun_longitude,
        birth_datetime,
        request.target_year,
        request.latitude,
        request.longitude,
    )

    # Compute aspects if requested
    aspects_list = None
    patterns_dict = None
    if request.include_aspects:
        config = AspectConfig()
        all_positions = return_chart["planets"].copy()
        all_positions["ascendant"] = return_chart["ascendant"]
        all_positions["midheaven"] = return_chart["midheaven"]
        
        return_dt = datetime.fromisoformat(return_chart["return_datetime_utc"].replace("Z", "+00:00"))
        aspects = find_aspects(all_positions, config, return_dt)
        aspects_list = [
            {
                "body1": a.body1,
                "body2": a.body2,
                "aspect": a.aspect,
                "orb_deg": a.orb_deg,
                "applying": a.applying,
            }
            for a in aspects
        ]
        
        if request.include_patterns:
            patterns_dict = detect_patterns(aspects)

    return_houses = return_chart["houses"]
    return_cusps = [return_houses.get(str(i + 1), 0.0) for i in range(12)]

    narrative_seed = None
    if request.narrative:
        narrative_config = {
            "tone": request.narrative.tone or "mythic",
            "depth": request.narrative.depth or "standard",
            "focus": request.narrative.focus or [],
        }
        chart_payload = build_chart_payload_for_narrative(
            return_chart["planets"],
            return_chart["ascendant"],
            return_chart["midheaven"],
            return_cusps,
            return_houses,
            return_chart["house_system"],
        )
        narrative_seed = build_natal_reading_prompt(
            chart_payload,
            aspects=aspects_list,
            patterns=patterns_dict or {},
            narrative_config=narrative_config,
            chart_context="solar_return",
        )

    return SolarReturnResponse(
        return_datetime_utc=return_chart["return_datetime_utc"],
        planets=return_chart["planets"],
        ascendant=return_chart["ascendant"],
        midheaven=return_chart["midheaven"],
        houses=return_chart["houses"],
        house_system=return_chart["house_system"],
        sun_exactness_deg=return_chart["sun_exactness_deg"],
        natal_sun_longitude=return_chart["natal_sun_longitude"],
        return_sun_longitude=return_chart["return_sun_longitude"],
        aspects=aspects_list,
        patterns=patterns_dict,
        narrative_seed=narrative_seed,
    )
