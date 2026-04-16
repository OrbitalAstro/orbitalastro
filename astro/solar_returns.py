# SPDX-License-Identifier: AGPL-3.0-only

"""Solar return chart finder and calculator."""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple

from astro.swisseph_positions import get_positions_from_swisseph
from astro.julian import datetime_to_julian_day
from astro.houses_multi import compute_houses
from astro.julian import datetime_to_julian_day
from astro.utils import normalize_angle_deg


def find_solar_return(
    natal_sun_longitude: float,
    birth_date: datetime,
    target_year: int,
    latitude_deg: float,
    longitude_deg: float,
    tolerance_deg: float = 0.01,
) -> Tuple[datetime, Dict]:
    """
    Find the exact moment of solar return (when transiting Sun returns to natal Sun longitude).

    Args:
        natal_sun_longitude: Natal Sun longitude in degrees
        birth_date: Birth date (used to determine approximate return date)
        target_year: Year for which to find solar return
        latitude_deg: Latitude for return chart
        longitude_deg: Longitude for return chart
        tolerance_deg: Tolerance for exact return (degrees)

    Returns:
        Tuple of (solar_return_datetime, return_chart_dict)
    """
    # Approximate solar return date (near birthday)
    approx_date = datetime(target_year, birth_date.month, birth_date.day, 12, 0, 0)

    # Search for exact moment using binary search
    search_start = approx_date - timedelta(days=30)
    search_end = approx_date + timedelta(days=30)

    best_datetime = approx_date
    best_diff = 360.0

    # Binary search for exact return
    for _ in range(20):  # Max 20 iterations
        test_datetime = search_start + (search_end - search_start) / 2
        test_jd = datetime_to_julian_day(test_datetime)
        test_positions = get_positions_from_swisseph(test_datetime, test_jd)
        test_sun_long = test_positions.get("sun", 0.0)

        diff = abs(test_sun_long - natal_sun_longitude) % 360.0
        if diff > 180.0:
            diff = 360.0 - diff

        if diff < best_diff:
            best_diff = diff
            best_datetime = test_datetime

        if diff < tolerance_deg:
            break

        # Determine search direction
        # Check if we need to go forward or backward
        future_datetime = test_datetime + timedelta(hours=1)
        future_jd = datetime_to_julian_day(future_datetime)
        future_positions = get_positions_from_swisseph(future_datetime, future_jd)
        future_sun_long = future_positions.get("sun", 0.0)

        # Check if Sun is moving toward or away from natal position
        current_diff = (test_sun_long - natal_sun_longitude) % 360.0
        if current_diff > 180.0:
            current_diff = current_diff - 360.0

        future_diff = (future_sun_long - natal_sun_longitude) % 360.0
        if future_diff > 180.0:
            future_diff = future_diff - 360.0

        if abs(future_diff) < abs(current_diff):
            # Moving toward, search later
            search_start = test_datetime
        else:
            # Moving away, search earlier
            search_end = test_datetime

    # Compute return chart at exact moment
    return_chart = compute_solar_return_chart(
        best_datetime, latitude_deg, longitude_deg, natal_sun_longitude
    )

    return best_datetime, return_chart


def compute_solar_return_chart(
    return_datetime: datetime,
    latitude_deg: float,
    longitude_deg: float,
    natal_sun_longitude: float,
    house_system: str = "placidus",
) -> Dict:
    """
    Compute a solar return chart at the given datetime.

    Args:
        return_datetime: Datetime of solar return
        latitude_deg: Latitude for return chart
        longitude_deg: Longitude for return chart
        natal_sun_longitude: Natal Sun longitude (for verification)
        house_system: House system to use

    Returns:
        Dictionary containing solar return chart data
    """
    return_jd = datetime_to_julian_day(return_datetime)
    return_positions = get_positions_from_swisseph(return_datetime, return_jd)

    # Verify Sun is at natal longitude (within tolerance)
    return_sun_long = return_positions.get("sun", 0.0)
    diff = abs(return_sun_long - natal_sun_longitude) % 360.0
    if diff > 180.0:
        diff = 360.0 - diff

    # Compute angles and houses
    # compute_houses now returns (cusps, ascendant, midheaven)
    # All values are calculated by Swiss Ephemeris exclusively
    cusps_tuple = compute_houses(house_system, return_jd, latitude_deg, longitude_deg, None, None)
    if isinstance(cusps_tuple, tuple) and len(cusps_tuple) == 3:
        return_cusps, return_asc, return_mc = cusps_tuple
    else:
        raise ValueError(f"Invalid return format from compute_houses: expected tuple of 3, got {type(cusps_tuple)}")

    return {
        "return_datetime_utc": return_datetime.isoformat(),
        "planets": return_positions,
        "ascendant": return_asc,
        "midheaven": return_mc,
        "houses": {str(i + 1): cusp for i, cusp in enumerate(return_cusps)},
        "house_system": house_system,
        "sun_exactness_deg": diff,
        "natal_sun_longitude": natal_sun_longitude,
        "return_sun_longitude": return_sun_long,
    }

