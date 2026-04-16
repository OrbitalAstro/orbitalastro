"""Extra astrological objects computation (Arabic Parts, Vertex, etc.)."""

from math import atan2, cos, degrees, radians, sin, tan
from typing import Dict, Optional

from astro.utils import normalize_angle_deg


def part_of_fortune(sun_long: float, moon_long: float, asc_long: float, is_day_chart: bool) -> float:
    """
    Compute Part of Fortune.

    Args:
        sun_long: Sun longitude in degrees
        moon_long: Moon longitude in degrees
        asc_long: Ascendant longitude in degrees
        is_day_chart: True if Sun is above horizon (in houses 7-12), False otherwise

    Returns:
        Part of Fortune longitude in degrees
    """
    if is_day_chart:
        # Day chart: ASC + Moon - Sun
        pof = asc_long + moon_long - sun_long
    else:
        # Night chart: ASC + Sun - Moon
        pof = asc_long + sun_long - moon_long
    
    return normalize_angle_deg(pof)


def vertex(ramc_rad: float, obliquity_rad: float, latitude_deg: float) -> float:
    """
    Compute the Western Vertex (prime vertical / ecliptic intersection, western limb).

    Uses spherical trigonometry (RAMC = local sidereal angle in radians):

        tan(V) = sin(RAMC) / (cos(RAMC)*cos(ε) - sin(ε)/tan(φ))

    Quadrants follow ``atan2``. At the equator (φ = 0) the denominator is undefined;
    the limit uses only the meridian / obliquity term.

    Args:
        ramc_rad: Local sidereal angle in radians (same convention as ``lst_from_jd_and_longitude``).
        obliquity_rad: Mean obliquity of the ecliptic ε in radians.
        latitude_deg: Geographic latitude in degrees (positive north).

    Returns:
        Vertex ecliptic longitude in degrees [0, 360).
    """
    phi = radians(latitude_deg)
    cos_eps = cos(obliquity_rad)
    sin_eps = sin(obliquity_rad)

    if abs(phi) < 1e-12:
        lam = atan2(sin(ramc_rad), cos(ramc_rad) * cos_eps)
    else:
        tan_phi = tan(phi)
        denom = cos(ramc_rad) * cos_eps - sin_eps / tan_phi
        lam = atan2(sin(ramc_rad), denom)

    return normalize_angle_deg(degrees(lam))


def part_of_spirit(sun_long: float, moon_long: float, asc_long: float, is_day_chart: bool) -> float:
    """
    Compute Part of Spirit (opposite of Part of Fortune).

    Args:
        sun_long: Sun longitude in degrees
        moon_long: Moon longitude in degrees
        asc_long: Ascendant longitude in degrees
        is_day_chart: True if Sun is above horizon

    Returns:
        Part of Spirit longitude in degrees
    """
    pof = part_of_fortune(sun_long, moon_long, asc_long, is_day_chart)
    return normalize_angle_deg(pof + 180.0)


def part_of_karma(sun_long: float, moon_long: float, asc_long: float, is_day_chart: bool) -> float:
    """
    Compute Part of Karma (alternative calculation).

    Args:
        sun_long: Sun longitude in degrees
        moon_long: Moon longitude in degrees
        asc_long: Ascendant longitude in degrees
        is_day_chart: True if Sun is above horizon

    Returns:
        Part of Karma longitude in degrees
    """
    # Part of Karma: ASC + Node - Sun (simplified, would need true node)
    # For now, use a variation of Part of Fortune
    if is_day_chart:
        pok = asc_long + moon_long - sun_long + 90.0
    else:
        pok = asc_long + sun_long - moon_long + 90.0
    
    return normalize_angle_deg(pok)


# Fixed star positions (approximate, for key stars)
FIXED_STARS = {
    "regulus": 150.0,  # Approximate position (would need proper precession calculation)
    "aldebaran": 69.0,
    "antares": 249.0,
    "fomalhaut": 339.0,
}


def get_fixed_star_position(star_name: str, epoch_jd: Optional[float] = None) -> Optional[float]:
    """
    Get fixed star position (simplified - would need proper precession for accuracy).

    Args:
        star_name: Name of fixed star (regulus, aldebaran, antares, fomalhaut)
        epoch_jd: Optional Julian day for precession calculation

    Returns:
        Star longitude in degrees, or None if star not found
    """
    star_lower = star_name.lower()
    if star_lower in FIXED_STARS:
        base_long = FIXED_STARS[star_lower]
        # In a full implementation, we'd apply precession correction based on epoch_jd
        # For now, return approximate position
        return normalize_angle_deg(base_long)
    return None


def compute_arabic_parts(
    sun_long: float,
    moon_long: float,
    asc_long: float,
    mc_long: float,
    is_day_chart: bool,
    include_vertex: bool = True,
    ramc_rad: Optional[float] = None,
    obliquity_rad: Optional[float] = None,
    latitude_deg: Optional[float] = None,
) -> Dict[str, float]:
    """
    Compute common Arabic Parts and sensitive points.

    Args:
        sun_long: Sun longitude in degrees
        moon_long: Moon longitude in degrees
        asc_long: Ascendant longitude in degrees
        mc_long: Midheaven longitude in degrees
        is_day_chart: True if Sun is above horizon
        include_vertex: Whether to include Vertex calculation
        ramc_rad: Local sidereal angle in radians (required with obliquity and latitude for Vertex)
        obliquity_rad: Mean obliquity ε in radians
        latitude_deg: Geographic latitude in degrees (north positive)

    Returns:
        Dictionary mapping part names to longitudes in degrees
    """
    parts = {
        "part_of_fortune": part_of_fortune(sun_long, moon_long, asc_long, is_day_chart),
        "part_of_spirit": part_of_spirit(sun_long, moon_long, asc_long, is_day_chart),
        "part_of_karma": part_of_karma(sun_long, moon_long, asc_long, is_day_chart),
    }

    if include_vertex:
        if ramc_rad is not None and obliquity_rad is not None and latitude_deg is not None:
            parts["vertex"] = vertex(ramc_rad, obliquity_rad, latitude_deg)
        else:
            parts["vertex"] = normalize_angle_deg(asc_long + 90.0)

    return parts














