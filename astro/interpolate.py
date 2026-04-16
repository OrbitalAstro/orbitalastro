# SPDX-License-Identifier: AGPL-3.0-only

"""Helpers for interpolating planetary longitudes."""

from datetime import datetime


def interpolate_longitude_deg(
    lower_time: datetime,
    lower_longitude: float,
    upper_time: datetime,
    upper_longitude: float,
    target_time: datetime,
) -> float:
    """Linearly interpolate a longitude, handling the 360° wrap."""
    if lower_time == upper_time:
        return lower_longitude % 360.0

    total_seconds = (upper_time - lower_time).total_seconds()
    ratio = (target_time - lower_time).total_seconds() / total_seconds
    delta = (upper_longitude - lower_longitude) % 360.0
    interpolated = (lower_longitude + delta * ratio) % 360.0
    return interpolated
