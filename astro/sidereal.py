"""Sidereal time calculations."""

from math import floor, radians, tau


def gmst_from_jd(JD: float) -> float:
    """Return the Greenwich Mean Sidereal Time in hours [0, 24)."""
    jd0 = floor(JD - 0.5) + 0.5
    h = (JD - jd0) * 24.0
    d = JD - 2451545.0
    d0 = jd0 - 2451545.0
    t = d / 36525.0

    gmst = 6.697374558 + 0.06570982441908 * d0 + 1.00273790935 * h + 0.000026 * t * t
    gmst = gmst % 24.0
    return gmst


def lst_from_jd_and_longitude(JD: float, longitude_deg: float) -> float:
    """Return the Local Sidereal Time in radians [0, 2π)."""
    gmst_hours = gmst_from_jd(JD)
    lst_hours = gmst_hours + longitude_deg / 15.0
    lst_hours = lst_hours % 24.0
    lst_deg = lst_hours * 15.0
    return radians(lst_deg % 360.0)
