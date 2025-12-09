"""FastAPI endpoints for birth-time rectification."""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from astro.rectification import rectify_birth_time

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
            try:
                approx_time = datetime.combine(birth_date, datetime.strptime(approx_time_str, "%H:%M").time())
            except ValueError:
                approx_time = datetime.combine(birth_date, datetime.strptime(approx_time_str, "%H:%M:%S").time())
        else:
            approx_time = datetime.fromisoformat(approx_time_str)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date/time format: {e}")

    # Convert events to dict format
    events_data = []
    for event_model in request.events:
        try:
            # Handle datetime-local format (YYYY-MM-DDTHH:MM) - may not have timezone
            datetime_str = event_model.datetime_local
            if "T" in datetime_str:
                # Try parsing with timezone, fallback to naive datetime
                try:
                    event_dt = datetime.fromisoformat(datetime_str)
                except ValueError:
                    # If parsing fails, try without timezone (assume local timezone)
                    event_dt = datetime.fromisoformat(datetime_str.replace("Z", ""))
                    if event_dt.tzinfo is None:
                        # Apply the birth timezone to the event
                        from zoneinfo import ZoneInfo
                        tz = ZoneInfo(request.timezone)
                        event_dt = event_dt.replace(tzinfo=tz)
            else:
                raise ValueError(f"Event datetime must include time: {datetime_str}")
            
            events_data.append({
                "type": event_model.type,
                "datetime_local": event_dt.isoformat(),
                "weight": event_model.weight,
            })
        except (ValueError, Exception) as e:
            raise HTTPException(status_code=400, detail=f"Invalid event datetime '{event_model.datetime_local}': {str(e)}")

    # Prepare data dict for rectify_birth_time
    data = {
        "birth_date": birth_date.isoformat(),
        "approx_time": approx_time.strftime("%H:%M"),
        "timezone": request.timezone,
        "latitude_deg": request.latitude_deg,
        "longitude_deg": request.longitude_deg,
        "time_window_hours": request.time_window_hours,
        "events": events_data,
    }
    
    try:
        result = rectify_birth_time(
            data,
            step_minutes=request.step_minutes or 5,
            top_n=request.top_n or 3,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid input: {str(e)}")
    except KeyError as e:
        raise HTTPException(status_code=400, detail=f"Missing required field: {str(e)}")
    except FileNotFoundError as e:
        error_msg = str(e)
        if "ephemeris" in error_msg.lower() or "year" in error_msg.lower():
            # Extract year from error if possible
            import re
            year_match = re.search(r'year (\d{4})', error_msg)
            if year_match:
                year = year_match.group(1)
                raise HTTPException(
                    status_code=400,
                    detail=f"Ephemeris data not available for year {year}. Please use events from years with available data (1900-1906, 1967, 1972, 1975, 1980, 1995, 2000, 2020, 2025) or install swisseph to generate data on-demand."
                )
        raise HTTPException(status_code=400, detail=f"Data not available: {error_msg}")
    except Exception as e:
        import traceback
        import sys
        error_detail = traceback.format_exc()
        # Log the full error for debugging (will appear in server logs)
        print(f"Rectification error: {error_detail}", file=sys.stderr)
        # Return a user-friendly error message
        error_msg = str(e) if str(e) else type(e).__name__
        raise HTTPException(status_code=500, detail=f"Rectification error: {error_msg}")
    
    # Convert result to candidates format
    candidates = []
    for candidate_data in result.get("top_candidates", []):
        try:
            candidates.append({
                "birth_time": datetime.fromisoformat(candidate_data["local_time"]),
                "ascendant": candidate_data["ascendant_degree"],
                "midheaven": candidate_data["midheaven_degree"],
                "score": candidate_data["score"],
                "diagnostics": {
                    "ascendant_sign": candidate_data["ascendant_sign"],
                    "events": candidate_data.get("events", []),
                },
            })
        except KeyError as e:
            raise HTTPException(status_code=500, detail=f"Missing field in candidate data: {e}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error processing candidate: {e}")

    # Generate summary and narrative
    summary = f"Found {len(candidates)} candidate birth times based on {len(request.events)} life events."
    if candidates:
        best = candidates[0]
        summary += f" Top candidate: {best['birth_time'].strftime('%H:%M:%S')} (score: {best['score']:.2f})"
    
    narrative_summary = None
    if candidates:
        best = candidates[0]
        narrative_summary = f"""
Based on the life events provided, the most likely birth time is {best['birth_time'].strftime('%H:%M:%S')}.

This time produces an Ascendant of {best['ascendant']:.2f}° and Midheaven of {best['midheaven']:.2f}°, 
which aligns best with the significant events in your life.

The rectification process analyzed {len(request.events)} key life events and evaluated multiple candidate times 
within a {request.time_window_hours * 2}-hour window around the approximate birth time.

Key diagnostics:
- Score: {best['score']:.2f} (higher indicates better alignment with events)
- Ascendant: {best['ascendant']:.2f}°
- Midheaven: {best['midheaven']:.2f}°
""".strip()

    return RectificationResponse(
        candidates=[
            CandidateTimeModel(
                birth_time=c["birth_time"].isoformat(),
                ascendant=c["ascendant"],
                midheaven=c["midheaven"],
                score=c["score"],
                diagnostics=c["diagnostics"],
            )
            for c in candidates
        ],
        summary=summary,
        narrative_summary=narrative_summary,
    )

