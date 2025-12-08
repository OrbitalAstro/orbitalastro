"""Birth-time rectification helpers and scoring."""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, List

from zoneinfo import ZoneInfo

from astro.ephemeris_loader import EphemerisRepository
from astro.houses import compute_asc_mc
from astro.julian import datetime_to_julian_day

ASPECT_ANGLES = {
    "conjunction": 0.0,
    "opposition": 180.0,
    "square": 90.0,
    "trine": 120.0,
    "sextile": 60.0,
}

ASPECT_ORBS = {
    "default": 6.0,
    "sun": 8.0,
    "moon": 8.0,
    "chiron": 4.0,
}

# Bodies we score against
SCORING_BODIES = ["asc", "mc", "sun", "moon", "chiron", "true_node"]


def _parse_time(value: str) -> datetime.time:
    for fmt in ("%H:%M", "%H:%M:%S"):
        try:
            return datetime.strptime(value, fmt).time()
        except ValueError:
            continue
    raise ValueError("approx_time must use HH:MM or HH:MM:SS")


def _normalize_angle(value: float) -> float:
    return value % 360.0


def _angular_distance(a: float, b: float) -> float:
    diff = abs(a - b) % 360.0
    return min(diff, 360.0 - diff)


def _sign_from_degree(degree: float) -> str:
    signs = [
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
    index = int(degree // 30) % 12
    return signs[index]


def _compute_positions(dt: datetime, latitude: float, longitude: float) -> Dict[str, float]:
    positions = EphemerisRepository.get_positions(dt)
    asc, mc = compute_asc_mc(datetime_to_julian_day(dt), latitude, longitude)
    positions["asc"] = asc
    positions["mc"] = mc
    return positions


@dataclass
class RectifyEvent:
    type: str
    datetime_local: datetime
    weight: float


@dataclass
class CandidateScore:
    local_time: datetime
    utc_time: datetime
    ascendant: float
    asc_sign: str
    mc: float
    score: float
    event_breakdown: List[Dict[str, Any]] = field(default_factory=list)


def _score_aspects(
    natal_positions: Dict[str, float],
    event_positions: Dict[str, float],
    event_weight: float,
) -> Dict[str, Any]:
    breakdown: List[Dict[str, Any]] = []
    total = 0.0
    for aspect, angle in ASPECT_ANGLES.items():
        for body in SCORING_BODIES:
            natal_val = natal_positions.get(body)
            event_val = event_positions.get(body)
            if natal_val is None or event_val is None:
                continue
            orb = ASPECT_ORBS.get(body, ASPECT_ORBS["default"])
            distance = _angular_distance(event_val, natal_val)
            if distance <= orb:
                aspect_score = (orb - distance + 1) * event_weight
                breakdown.append(
                    {
                        "body": body,
                        "aspect": aspect,
                        "orb": round(distance, 3),
                        "angle_target": angle,
                        "score": round(aspect_score, 3),
                    }
                )
                total += aspect_score
    return {"score": total, "details": breakdown}


def rectify_birth_time(
    data: Dict[str, Any],
    step_minutes: int = 5,
    top_n: int = 3,
) -> Dict[str, Any]:
    """Return ranked birth-time candidates based on event alignments."""
    tz = ZoneInfo(data["timezone"])
    approx_time = _parse_time(data["approx_time"])
    birth_date = datetime.fromisoformat(data["birth_date"]).date()
    base_local = datetime.combine(birth_date, approx_time).replace(tzinfo=tz)
    window = timedelta(hours=data.get("time_window_hours", 4))

    start = base_local - window
    end = base_local + window

    latitude = data["latitude_deg"]
    longitude = data["longitude_deg"]

    events = [
        RectifyEvent(
            type=event["type"],
            datetime_local=datetime.fromisoformat(event["datetime_local"]).replace(tzinfo=tz),
            weight=event.get("weight", 1.0),
        )
        for event in data.get("events", [])
    ]

    event_positions: Dict[str, Dict[str, float]] = {}
    for event in events:
        utcz = event.datetime_local.astimezone(timezone.utc)
        event_positions[event.type] = _compute_positions(utcz, latitude, longitude)

    candidates: List[CandidateScore] = []
    current = start
    while current <= end:
        utc = current.astimezone(timezone.utc)
        natal_positions = _compute_positions(utc, latitude, longitude)
        asc, mc = natal_positions["asc"], natal_positions["mc"]
        candidate = CandidateScore(
            local_time=current,
            utc_time=utc,
            ascendant=asc,
            asc_sign=_sign_from_degree(asc),
            mc=mc,
            score=0.0,
        )
        for event in events:
            matchup = _score_aspects(natal_positions, event_positions[event.type], event.weight)
            candidate.score += matchup["score"]
            candidate.event_breakdown.append(
                {
                    "event": event.type,
                    "score": round(matchup["score"], 3),
                    "details": matchup["details"],
                }
            )
        candidates.append(candidate)
        current += timedelta(minutes=step_minutes)

    candidates.sort(key=lambda entry: entry.score, reverse=True)
    winners = candidates[:top_n]

    response = {
        "top_candidates": [
            {
                "local_time": winner.local_time.isoformat(),
                "utc_time": winner.utc_time.isoformat(),
                "ascendant_degree": round(winner.ascendant, 4),
                "ascendant_sign": winner.asc_sign,
                "midheaven_degree": round(winner.mc, 4),
                "score": round(winner.score, 3),
                "events": winner.event_breakdown,
            }
            for winner in winners
        ],
        "probable_ascendant": winners[0].asc_sign if winners else None,
        "narrative": (
            f"Most probable rising sign: {winners[0].asc_sign} (score: {round(winners[0].score,3)})"
            if winners
            else "No candidates could be scored."
        ),
    }
    return response
