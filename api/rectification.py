"""FastAPI endpoints for birth-time rectification."""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from astro.rectification import RectificationEvent, rectify_birth_time

router = APIRouter(prefix="/api", tags=["rectification"])


class RectificationEventModel(BaseModel):
    type: str = Field(..., description="Event type (e.g., career_change, marriage, relocation)")
    datetime_local: str = Field(..., description="Event datetime in local time (ISO format)")
    weight: float = Field(1.0, description="Event weight for scoring")


class RectificationRequest(BaseModel):
    birth_date: str = Field(..., description="Birth date (ISO format)")
    approx_time: str = Field(..., description="Approximate birth time (HH:MM or HH:MM:SS)")
    timezone: str = Field(..., description="IANA timezone name")
    latitude_deg: float = Field(..., description="Birth latitude")
    longitude_deg: float = Field(..., description="Birth longitude")
    time_window_hours: float = Field(4.0, description="Time window in hours (±)")
    events: List[RectificationEventModel] = Field(..., description="Life events for rectification")
    top_n: Optional[int] = Field(3, description="Number of top candidates to return")
    step_minutes: Optional[int] = Field(5, description="Step size in minutes for candidate generation")


class CandidateTimeModel(BaseModel):
    birth_time: str
    ascendant: float
    midheaven: float
    score: float
    diagnostics: Dict


class RectificationResponse(BaseModel):
    candidates: List[CandidateTimeModel]
    summary: Optional[str] = None
    narrative_summary: Optional[str] = None


@router.post("/rectify-birth-time", response_model=RectificationResponse)
async def rectify(request: RectificationRequest):
    """Rectify birth time using life events."""
    try:
        birth_date = datetime.fromisoformat(request.birth_date).date()
        approx_time_str = request.approx_time
        if "T" not in approx_time_str:
            # Assume it's just time, combine with birth date
            approx_time = datetime.combine(birth_date, datetime.strptime(approx_time_str, "%H:%M").time())
        else:
            approx_time = datetime.fromisoformat(approx_time_str)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date/time format: {e}")

    # Convert events
    events = []
    for event_model in request.events:
        try:
            event_dt = datetime.fromisoformat(event_model.datetime_local)
            events.append(
                RectificationEvent(
                    type=event_model.type,
                    datetime_local=event_dt,
                    weight=event_model.weight,
                )
            )
        except ValueError:
            raise HTTPException(status_code=400, detail=f"Invalid event datetime: {event_model.datetime_local}")

    candidates = rectify_birth_time(
        birth_date,
        approx_time,
        request.timezone,
        request.latitude_deg,
        request.longitude_deg,
        request.time_window_hours,
        events,
        request.top_n or 3,
        request.step_minutes or 5,
    )

    # Generate summary and narrative
    summary = f"Found {len(candidates)} candidate birth times based on {len(events)} life events."
    if candidates:
        best = candidates[0]
        summary += f" Top candidate: {best.birth_time.strftime('%H:%M:%S')} (score: {best.score:.2f})"
    
    narrative_summary = None
    if candidates:
        best = candidates[0]
        narrative_summary = f"""
Based on the life events provided, the most likely birth time is {best.birth_time.strftime('%H:%M:%S')}.

This time produces an Ascendant of {best.ascendant:.2f}° and Midheaven of {best.midheaven:.2f}°, 
which aligns best with the significant events in your life.

The rectification process analyzed {len(events)} key life events and evaluated multiple candidate times 
within a {request.time_window_hours * 2}-hour window around the approximate birth time.

Key diagnostics:
- Score: {best.score:.2f} (higher indicates better alignment with events)
- Ascendant: {best.ascendant:.2f}°
- Midheaven: {best.midheaven:.2f}°
""".strip()

    return RectificationResponse(
        candidates=[
            CandidateTimeModel(
                birth_time=c.birth_time.isoformat(),
                ascendant=c.ascendant,
                midheaven=c.midheaven,
                score=c.score,
                diagnostics=c.diagnostics,
            )
            for c in candidates
        ],
        summary=summary,
        narrative_summary=narrative_summary,
    )

