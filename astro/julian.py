# SPDX-License-Identifier: AGPL-3.0-only

"""Helper to convert UTC datetimes into Julian Days."""

from datetime import datetime, timedelta, timezone


def datetime_to_julian_day(dt_utc: datetime) -> float:
    """Return the Julian Day for a UTC datetime (Gregorian calendar)."""
    year = dt_utc.year
    month = dt_utc.month
    day = dt_utc.day
    hour = dt_utc.hour
    minute = dt_utc.minute
    second = dt_utc.second + dt_utc.microsecond / 1_000_000

    if month <= 2:
        year -= 1
        month += 12

    a = year // 100
    b = 2 - a + a // 4

    frac_day = (hour + minute / 60 + second / 3600) / 24.0

    jd = (
        int(365.25 * (year + 4716))
        + int(30.6001 * (month + 1))
        + day
        + b
        - 1524.5
        + frac_day
    )
    return jd


def julian_day_to_datetime_utc(jd: float) -> datetime:
    """
    Convert Julian Day (UT) to timezone-aware UTC datetime.
    Uses the J2000 anchor (JD 2451545.0 = 2000-01-01 12:00 UTC), standard in astronomy.
    """
    base = datetime(2000, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    return base + timedelta(days=float(jd) - 2451545.0)
