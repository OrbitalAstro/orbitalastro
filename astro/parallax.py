# SPDX-License-Identifier: AGPL-3.0-only

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
    observer_alt_m: float = 0.0,
) -> Tuple[float, float]:
    """
    Correct Moon position from geocentric to topocentric using rigorous coordinate transformation.

    Args:
        moon_longitude_geocentric: Geocentric Moon longitude in degrees
        moon_latitude_geocentric: Geocentric Moon latitude in degrees
        observer_lat_deg: Observer latitude in degrees
        observer_lon_deg: Observer longitude in degrees
        JD: Julian day
        moon_distance_km: Moon distance in km (uses mean if None)
        observer_alt_m: Observer altitude in meters

    Returns:
        Tuple of (topocentric_longitude, topocentric_latitude) in degrees
    """
    import swisseph as swe

    if moon_distance_km is None:
        moon_distance_km = MOON_MEAN_DISTANCE_KM

    # WGS84 ellipsoid constants
    a = 6378.137  # Earth's equatorial radius in km
    f = 1 / 298.257223563  # Flattening
    b = a * (1 - f)  # Earth's polar radius in km
    e2 = 2 * f - f**2  # Square of eccentricity

    # Observer's geodetic coordinates
    phi = radians(observer_lat_deg)
    h_km = observer_alt_m / 1000.0

    # Radius of curvature in the prime vertical
    sin_phi = sin(phi)
    cos_phi = cos(phi)
    N = a / sqrt(1 - e2 * sin_phi**2)

    # Observer's geocentric coordinates (XYZ) in rotating Earth frame
    # X_obs_earth = (N + h_km) * cos_phi * cos(lon)
    # Y_obs_earth = (N + h_km) * cos_phi * sin(lon)
    # Z_obs_earth = (N * (1 - e2) + h_km) * sin_phi

    # We need observer's position in celestial (equatorial) frame
    # Compute Local Apparent Sidereal Time (LAST)
    # We can get Greenwich Apparent Sidereal Time (GAST) from Swiss Ephemeris
    gast_hours = swe.sidtime(JD)
    gast_rad = radians(gast_hours * 15.0)

    # Local Apparent Sidereal Time
    lon_rad = radians(observer_lon_deg)
    last_rad = gast_rad + lon_rad

    # Observer XYZ in equatorial frame
    rho_cos_phi_prime = (N + h_km) * cos_phi
    rho_sin_phi_prime = (N * (1 - e2) + h_km) * sin_phi

    X_obs = rho_cos_phi_prime * cos(last_rad)
    Y_obs = rho_cos_phi_prime * sin(last_rad)
    Z_obs = rho_sin_phi_prime

    # Moon's geocentric ecliptic coordinates
    moon_lon_rad = radians(moon_longitude_geocentric)
    moon_lat_rad = radians(moon_latitude_geocentric)
    eps = mean_obliquity(JD)

    # Moon's geocentric equatorial coordinates
    sin_lat = sin(moon_lat_rad)
    cos_lat = cos(moon_lat_rad)
    sin_lon = sin(moon_lon_rad)
    cos_lon = cos(moon_lon_rad)
    sin_eps = sin(eps)
    cos_eps = cos(eps)

    ra_geo = atan2(sin_lon * cos_eps - tan(moon_lat_rad) * sin_eps, cos_lon)
    dec_geo = asin(sin_lat * cos_eps + cos_lat * sin_eps * sin_lon)

    # Moon's geocentric XYZ coordinates
    X_moon = moon_distance_km * cos(dec_geo) * cos(ra_geo)
    Y_moon = moon_distance_km * cos(dec_geo) * sin(ra_geo)
    Z_moon = moon_distance_km * sin(dec_geo)

    # Moon's topocentric XYZ coordinates
    X_topo = X_moon - X_obs
    Y_topo = Y_moon - Y_obs
    Z_topo = Z_moon - Z_obs

    # Moon's topocentric equatorial coordinates
    rho_topo = sqrt(X_topo**2 + Y_topo**2 + Z_topo**2)
    ra_topo = atan2(Y_topo, X_topo)
    dec_topo = asin(Z_topo / rho_topo)

    # Convert topocentric equatorial back to ecliptic
    sin_dec_topo = sin(dec_topo)
    cos_dec_topo = cos(dec_topo)
    sin_ra_topo = sin(ra_topo)
    cos_ra_topo = cos(ra_topo)

    topo_lon_rad = atan2(sin_ra_topo * cos_eps + tan(dec_topo) * sin_eps, cos_ra_topo)
    topo_lat_rad = asin(sin_dec_topo * cos_eps - cos_dec_topo * sin_eps * sin_ra_topo)

    topo_lon = normalize_angle_deg(degrees(topo_lon_rad))
    topo_lat = degrees(topo_lat_rad)

    return topo_lon, topo_lat


def get_moon_with_parallax(
    target_datetime,
    observer_lat_deg: float,
    observer_lon_deg: float,
    use_parallax: bool = True,
    observer_alt_m: float = 0.0,
) -> float:
    """
    Get Moon longitude with optional topocentric parallax correction.

    Args:
        target_datetime: Datetime for Moon position
        observer_lat_deg: Observer latitude
        observer_lon_deg: Observer longitude
        use_parallax: Whether to apply parallax correction
        observer_alt_m: Observer altitude in meters

    Returns:
        Moon longitude in degrees (topocentric if use_parallax=True)
    """
    from astro.julian import datetime_to_julian_day
    jd = datetime_to_julian_day(target_datetime)

    import swisseph as swe
    from astro.ephemeris_loader import EPHEMERIS_DIR
    if EPHEMERIS_DIR.exists():
        swe.set_ephe_path(str(EPHEMERIS_DIR))

    # Calculate Moon position and distance
    result, rc = swe.calc_ut(jd, swe.MOON, swe.FLG_SWIEPH)
    if rc < 0:
        # Fallback to get_positions_from_swisseph if direct calculation fails
        from astro.swisseph_positions import get_positions_from_swisseph
        positions = get_positions_from_swisseph(target_datetime, jd)
        return positions.get("moon", 0.0)

    moon_long = result[0] % 360.0
    moon_lat = result[1]
    moon_distance_au = result[2]

    if not use_parallax:
        return moon_long

    # Convert distance from AU to km
    moon_distance_km = moon_distance_au * 149597870.7

    topo_long, _ = correct_moon_for_parallax(
        moon_long, moon_lat, observer_lat_deg, observer_lon_deg, jd, moon_distance_km, observer_alt_m
    )

    return topo_long