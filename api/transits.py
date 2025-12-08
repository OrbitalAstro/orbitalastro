"""FastAPI endpoints for transit calculations."""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from astro.aspects import AspectConfig, Aspect
from astro.transits import compute_transits, compute_transits_to_angles

router = APIRouter(prefix="/api", tags=["transits"])


class TransitRequest(BaseModel):
    natal_positions: Dict[str, float] = Field(..., description="Natal planetary positions (body -> longitude)")
    natal_asc: Optional[float] = Field(None, description="Natal ascendant longitude")
    natal_mc: Optional[float] = Field(None, description="Natal midheaven longitude")
    target_date: str = Field(..., description="Target date for transits (ISO format)")
    include_angles: Optional[bool] = Field(True, description="Include transits to angles")


class TransitResponse(BaseModel):
    target_date: str
    transits: List[Dict]
    transits_to_angles: Optional[List[Dict]] = None


@router.post("/transits", response_model=TransitResponse)
async def calculate_transits(request: TransitRequest):
    """Compute transits for a given date."""
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

    return TransitResponse(
        target_date=request.target_date,
        transits=transits_list,
        transits_to_angles=transits_to_angles_list,
    )

