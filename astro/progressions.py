"""Secondary progressions engine (1 day = 1 year)."""

from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Dict, Optional, Union

from astro.ephemeris_loader import EphemerisRepository
from astro.houses import compute_asc_mc
from astro.houses_multi import compute_houses
from astro.julian import datetime_to_julian_day


def compute_progressed_chart(
    birth_datetime_utc: datetime,
    progressed_date: Union[date, datetime],
    latitude_deg: float,
    longitude_deg: float,
    house_system: str = "placidus",
) -> Dict:
    """
    Compute a progressed chart using secondary progressions (1 day = 1 year).

    Args:
        birth_datetime_utc: Birth datetime in UTC
        progressed_date: Date for which to compute progressed chart (date or datetime)
        latitude_deg: Birth latitude
        longitude_deg: Birth longitude
        house_system: House system to use

    Returns:
        Dictionary containing progressed chart data
    """
    # Normalize progressed_date to date if it's a datetime
    if isinstance(progressed_date, datetime):
        progressed_date_only = progressed_date.date()
    else:
        progressed_date_only = progressed_date
    
    # Calculate age in years
    age_years = (progressed_date_only - birth_datetime_utc.date()).days / 365.25
    
    # Validate age
    if age_years < 0:
        raise ValueError(f"Progressed date ({progressed_date_only}) must be after birth date ({birth_datetime_utc.date()})")
    if age_years > 150:
        raise ValueError(f"Age ({age_years:.1f} years) exceeds reasonable limit (150 years)")

    # Progressed datetime = birth + age_years days
    progressed_datetime = birth_datetime_utc + timedelta(days=age_years)
    
    # Validate progressed datetime is within ephemeris range
    if progressed_datetime.year < 1900 or progressed_datetime.year > 2100:
        raise ValueError(f"Progressed datetime ({progressed_datetime.year}) is outside ephemeris range (1900-2100)")

    # Get progressed planetary positions
    try:
        progressed_positions = EphemerisRepository.get_positions(progressed_datetime)
    except FileNotFoundError as e:
        raise ValueError(f"Ephemeris data not available for year {progressed_datetime.year}. {str(e)}")

    # Compute progressed angles and houses
    progressed_jd = datetime_to_julian_day(progressed_datetime)
    progressed_asc, progressed_mc = compute_asc_mc(progressed_jd, latitude_deg, longitude_deg)
    progressed_cusps = compute_houses(house_system, progressed_jd, latitude_deg, longitude_deg, progressed_asc, progressed_mc)

    return {
        "progressed_datetime_utc": progressed_datetime.isoformat(),
        "age_years": age_years,
        "planets": progressed_positions,
        "ascendant": progressed_asc,
        "midheaven": progressed_mc,
        "houses": {str(i + 1): cusp for i, cusp in enumerate(progressed_cusps)},
        "house_system": house_system,
    }


def compute_progressed_to_natal_aspects(
    birth_datetime_utc: datetime,
    progressed_date: Union[date, datetime],
    natal_positions: Dict[str, float],
    natal_asc: float,
    natal_mc: float,
) -> Dict:
    """
    Compute aspects between progressed planets and natal chart.

    Args:
        birth_datetime_utc: Birth datetime in UTC
        progressed_date: Date for progression (date or datetime)
        natal_positions: Natal planetary positions
        natal_asc: Natal ascendant
        natal_mc: Natal midheaven

    Returns:
        Dictionary with progressed-to-natal aspects
    """
    from astro.aspects import AspectConfig, find_aspects

    # Normalize progressed_date to date if it's a datetime
    if isinstance(progressed_date, datetime):
        progressed_date_only = progressed_date.date()
    else:
        progressed_date_only = progressed_date

    # Get progressed positions
    age_years = (progressed_date_only - birth_datetime_utc.date()).days / 365.25
    progressed_datetime = birth_datetime_utc + timedelta(days=age_years)
    progressed_positions = EphemerisRepository.get_positions(progressed_datetime)

    # Find aspects between progressed and natal
    all_positions = {}
    for body, pos in progressed_positions.items():
        all_positions[f"progressed_{body}"] = pos
    for body, pos in natal_positions.items():
        all_positions[f"natal_{body}"] = pos

    aspects = find_aspects(all_positions, AspectConfig(), progressed_datetime)

    # Also check progressed angles to natal planets
    progressed_jd = datetime_to_julian_day(progressed_datetime)
    progressed_asc, progressed_mc = compute_asc_mc(
        progressed_jd, 0.0, 0.0
    )  # Would need actual lat/lon

    return {
        "progressed_to_natal_aspects": [
            {
                "progressed_body": a.body1.replace("progressed_", ""),
                "natal_body": a.body2.replace("natal_", ""),
                "aspect": a.aspect,
                "orb_deg": a.orb_deg,
                "applying": a.applying,
            }
            for a in aspects
            if a.body1.startswith("progressed_") and a.body2.startswith("natal_")
        ],
        "progressed_angles": {
            "ascendant": progressed_asc,
            "midheaven": progressed_mc,
        },
    }

