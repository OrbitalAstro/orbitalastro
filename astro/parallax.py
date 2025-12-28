"""Topocentric Moon parallax correction for high-precision lunar positioning."""

from __future__ import annotations

from math import asin, atan2, cos, radians, sin, sqrt, tan, degrees
from typing import Tuple

from astro.swisseph_positions import get_positions_from_swisseph
from astro.obliquity import mean_obliquity
from astro.utils import normalize_angle_deg
from astro.julian import datetime_to_julian_day


# Constants
EARTH_RADIUS_KM = 6371.0  # Mean Earth radius in km
MOON_MEAN_DISTANCE_KM = 384400.0  # Mean Moon distance in km


def correct_moon_for_parallax(
    moon_longitude_geocentric: float,
    moon_latitude_geocentric: float,
    observer_lat_deg: float,
    observer_lon_deg: float,
    JD: float,
    moon_distance_km: float = None,
) -> Tuple[float, float]:
    """
    Correct Moon position from geocentric to topocentric using parallax.

    Args:
        moon_longitude_geocentric: Geocentric Moon longitude in degrees
        moon_latitude_geocentric: Geocentric Moon latitude in degrees
        observer_lat_deg: Observer latitude in degrees
        observer_lon_deg: Observer longitude in degrees
        JD: Julian day
        moon_distance_km: Moon distance in km (uses mean if None)

    Returns:
        Tuple of (topocentric_longitude, topocentric_latitude) in degrees
    """
    if moon_distance_km is None:
        moon_distance_km = MOON_MEAN_DISTANCE_KM

    # Convert to radians
    moon_lon_rad = radians(moon_longitude_geocentric)
    moon_lat_rad = radians(moon_latitude_geocentric)
    obs_lat_rad = radians(observer_lat_deg)
    obs_lon_rad = radians(observer_lon_deg)
    eps = mean_obliquity(JD)

    # Compute parallax angle
    # Simplified: parallax ≈ asin((Earth_radius / Moon_distance) * cos(Moon_altitude))
    # For more accuracy, we'd compute Moon's altitude first
    parallax_angle = asin(EARTH_RADIUS_KM / moon_distance_km)

    # Convert geocentric ecliptic to geocentric equatorial
    # Longitude to RA/Dec conversion
    sin_lat = sin(moon_lat_rad)
    cos_lat = cos(moon_lat_rad)
    sin_lon = sin(moon_lon_rad)
    cos_lon = cos(moon_lon_rad)
    sin_eps = sin(eps)
    cos_eps = cos(eps)

    # Convert ecliptic to equatorial coordinates
    ra_geocentric = atan2(
        sin_lon * cos_eps - tan(moon_lat_rad) * sin_eps, cos_lon
    )
    dec_geocentric = asin(sin_lat * cos_eps + cos_lat * sin_eps * sin_lon)

    # Apply parallax correction
    # The parallax correction depends on the observer's position
    # Simplified correction: adjust RA based on observer longitude
    parallax_correction_ra = parallax_angle * cos(obs_lat_rad) * sin(obs_lon_rad - ra_geocentric)
    parallax_correction_dec = parallax_angle * sin(obs_lat_rad)

    ra_topocentric = ra_geocentric + parallax_correction_ra
    dec_topocentric = dec_geocentric + parallax_correction_dec

    # Convert back to ecliptic coordinates
    sin_dec = sin(dec_topocentric)
    cos_dec = cos(dec_topocentric)
    sin_ra = sin(ra_topocentric)
    cos_ra = cos(ra_topocentric)

    # Ecliptic longitude
    topo_lon_rad = atan2(
        sin_ra * cos_eps + tan(dec_topocentric) * sin_eps, cos_ra
    )
    # Ecliptic latitude
    topo_lat_rad = asin(sin_dec * cos_eps - cos_dec * sin_eps * sin_ra)

    topo_lon = normalize_angle_deg(degrees(topo_lon_rad))
    topo_lat = degrees(topo_lat_rad)

    return topo_lon, topo_lat


def get_moon_with_parallax(
    target_datetime,
    observer_lat_deg: float,
    observer_lon_deg: float,
    use_parallax: bool = True,
) -> float:
    """
    Get Moon longitude with optional topocentric parallax correction.

    Args:
        target_datetime: Datetime for Moon position
        observer_lat_deg: Observer latitude
        observer_lon_deg: Observer longitude
        use_parallax: Whether to apply parallax correction

    Returns:
        Moon longitude in degrees (topocentric if use_parallax=True)
    """
    jd = datetime_to_julian_day(target_datetime)
    positions = get_positions_from_swisseph(target_datetime, jd)
    moon_long = positions.get("moon", 0.0)

    if not use_parallax:
        return moon_long

    # For parallax correction, we need Moon's distance
    # Since we don't store distance in ephemeris, we'll use mean distance
    # In a full implementation, we'd compute distance from ephemeris
    topo_long, _ = correct_moon_for_parallax(
        moon_long, 0.0, observer_lat_deg, observer_lon_deg, jd
    )

    return topo_long












