"""FastAPI endpoints for progression calculations."""

from __future__ import annotations

from datetime import date, datetime
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from astro.progressions import compute_progressed_chart, compute_progressed_to_natal_aspects
from astro.aspects import AspectConfig, find_aspects, detect_patterns
from astro.master_prompt_builder import build_natal_reading_prompt
from api.schemas import NarrativeConfig

router = APIRouter(prefix="/api", tags=["progressions"])




class ProgressionRequest(BaseModel):
    birth_datetime: str = Field(..., description="Birth datetime in UTC (ISO format)")
    progressed_date: str = Field(..., description="Date for progression (ISO format)")
    latitude: float = Field(..., description="Birth latitude")
    longitude: float = Field(..., description="Birth longitude")
    house_system: Optional[str] = Field("placidus", description="House system")
    include_aspects: Optional[bool] = Field(True, description="Include progressed-to-natal aspects")
    include_patterns: Optional[bool] = Field(False, description="Include aspect patterns")
    narrative: Optional[NarrativeConfig] = Field(None, description="Narrative configuration")


class ProgressionResponse(BaseModel):
    progressed_datetime_utc: str
    age_years: float
    planets: Dict[str, float]
    ascendant: float
    midheaven: float
    houses: Dict[str, float]
    house_system: str
    progressed_to_natal_aspects: Optional[List[Dict]] = None
    patterns: Optional[Dict] = None
    narrative_seed: Optional[str] = None


@router.post("/progressions", response_model=ProgressionResponse)
async def calculate_progressions(request: ProgressionRequest):
    """Compute progressed chart for a given date."""
    try:
        # Parse birth_datetime - handle with or without timezone
        birth_datetime_str = request.birth_datetime
        if "Z" in birth_datetime_str:
            birth_datetime_str = birth_datetime_str.replace("Z", "+00:00")
        elif "+" not in birth_datetime_str and birth_datetime_str.count(":") >= 2:
            # If no timezone, assume UTC
            birth_datetime_str = birth_datetime_str + "+00:00"
        birth_datetime = datetime.fromisoformat(birth_datetime_str)
        if birth_datetime.tzinfo is None:
            # If still no timezone, assume UTC
            from datetime import timezone
            birth_datetime = birth_datetime.replace(tzinfo=timezone.utc)
        
        progressed_date = date.fromisoformat(request.progressed_date)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {e}")

    try:
        progressed_data = compute_progressed_chart(
            birth_datetime,
            progressed_date,
            request.latitude,
            request.longitude,
            request.house_system or "placidus",
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error computing progressions: {str(e)}")

    # Compute aspects if requested
    aspects_list = None
    patterns_dict = None
    if request.include_aspects:
        # Get natal positions (would need to be passed in or computed)
        # For now, compute aspects within progressed chart
        config = AspectConfig()
        all_positions = progressed_data["planets"].copy()
        all_positions["ascendant"] = progressed_data["ascendant"]
        all_positions["midheaven"] = progressed_data["midheaven"]
        
        progressed_dt = datetime.fromisoformat(progressed_data["progressed_datetime_utc"].replace("Z", "+00:00"))
        aspects = find_aspects(all_positions, config, progressed_dt)
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

    # Generate narrative seed if requested
    narrative_seed = None
    if request.narrative:
        narrative_config = {
            "tone": request.narrative.tone or "mythic",
            "depth": request.narrative.depth or "standard",
            "focus": request.narrative.focus or [],
        }
        natal_dict = {
            "planets": progressed_data["planets"],
            "ascendant": progressed_data["ascendant"],
            "midheaven": progressed_data["midheaven"],
            "houses": progressed_data["houses"],
        }
        narrative_seed = build_natal_reading_prompt(
            natal_dict,
            aspects=aspects_list,
            patterns=patterns_dict,
            narrative_config=narrative_config,
        )

    return ProgressionResponse(
        progressed_datetime_utc=progressed_data["progressed_datetime_utc"],
        age_years=progressed_data["age_years"],
        planets=progressed_data["planets"],
        ascendant=progressed_data["ascendant"],
        midheaven=progressed_data["midheaven"],
        houses=progressed_data["houses"],
        house_system=progressed_data["house_system"],
        progressed_to_natal_aspects=aspects_list,
        patterns=patterns_dict,
        narrative_seed=narrative_seed,
    )

