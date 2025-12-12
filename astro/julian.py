"""Helper to convert UTC datetimes into Julian Days."""

from datetime import datetime


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
