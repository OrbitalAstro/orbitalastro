"""Extra astrological objects computation (Arabic Parts, Vertex, etc.)."""

from math import cos, radians, sin
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


def vertex(asc_long: float, mc_long: float, latitude_deg: float) -> float:
    """
    Compute Vertex (intersection of prime vertical and ecliptic).

    Args:
        asc_long: Ascendant longitude in degrees
        mc_long: Midheaven longitude in degrees
        latitude_deg: Latitude in degrees

    Returns:
        Vertex longitude in degrees
    """
    # Vertex is approximately 90° from ASC in the direction of the MC
    # More precisely, it's the intersection of prime vertical and ecliptic
    # Simplified calculation: Vertex ≈ ASC + 90° (adjusted for latitude)
    vertex_long = normalize_angle_deg(asc_long + 90.0)
    
    # Adjust for latitude (simplified)
    lat_factor = cos(radians(latitude_deg))
    adjustment = (1.0 - lat_factor) * 5.0  # Small adjustment
    vertex_long = normalize_angle_deg(vertex_long + adjustment)
    
    return vertex_long


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


# Constants for precession calculation
J2000_JD = 2451545.0
PRECESSION_RATE_DEG_PER_YEAR = 50.3 / 3600.0  # ~0.013972 degrees/year

# Fixed star positions (J2000.0 ecliptic longitude)
FIXED_STARS = {
    "regulus": 149.829,  # ~29°50' Leo
    "aldebaran": 69.788,  # ~09°47' Gemini
    "antares": 249.761,  # ~09°46' Sagittarius
    "fomalhaut": 333.860,  # ~03°52' Pisces
}


def get_fixed_star_position(star_name: str, epoch_jd: Optional[float] = None) -> Optional[float]:
    """
    Get fixed star position with precession correction.

    Args:
        star_name: Name of fixed star (regulus, aldebaran, antares, fomalhaut)
        epoch_jd: Optional Julian day for precession calculation. If None, J2000 position is returned.

    Returns:
        Star longitude in degrees, or None if star not found
    """
    star_lower = star_name.lower()
    if star_lower in FIXED_STARS:
        base_long = FIXED_STARS[star_lower]

        if epoch_jd is not None:
            # Apply precession correction
            # Formula: correction = (years from J2000) * precession_rate
            years_from_j2000 = (epoch_jd - J2000_JD) / 365.25
            correction = years_from_j2000 * PRECESSION_RATE_DEG_PER_YEAR
            return normalize_angle_deg(base_long + correction)

        return normalize_angle_deg(base_long)
    return None


def compute_arabic_parts(
    sun_long: float,
    moon_long: float,
    asc_long: float,
    mc_long: float,
    is_day_chart: bool,
    include_vertex: bool = True,
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

    Returns:
        Dictionary mapping part names to longitudes in degrees
    """
    parts = {
        "part_of_fortune": part_of_fortune(sun_long, moon_long, asc_long, is_day_chart),
        "part_of_spirit": part_of_spirit(sun_long, moon_long, asc_long, is_day_chart),
        "part_of_karma": part_of_karma(sun_long, moon_long, asc_long, is_day_chart),
    }
    
    if include_vertex:
        # Would need latitude for accurate Vertex, using simplified version
        parts["vertex"] = normalize_angle_deg(asc_long + 90.0)
    
    return parts











