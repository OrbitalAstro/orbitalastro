# SPDX-License-Identifier: AGPL-3.0-only

"""Obliquity of the ecliptic."""

from math import radians


def mean_obliquity(JD: float) -> float:
    """Return the mean obliquity ε in radians."""
    t = (JD - 2451545.0) / 36525.0
    eps_deg = (
        23.43929111
        - (46.8150 / 3600.0) * t
        - (0.00059 / 3600.0) * t * t
        + (0.001813 / 3600.0) * t * t * t
    )
    return radians(eps_deg)
