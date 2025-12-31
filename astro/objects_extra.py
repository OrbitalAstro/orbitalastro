"""Extra astrological objects computation (Arabic Parts, Vertex, etc.)."""

from math import cos, radians
from typing import Dict, Optional

from astro.utils import normalize_angle_deg

HOUSE_SYSTEM_TO_SWISSEPH_CODE = {
    "placidus": "P",
    "whole_sign": "W",
    "equal": "E",
    "koch": "K",
    "porphyry": "O",
    "regiomontanus": "R",
    "campanus": "C",
    "alcabitius": "B",
    "meridian": "X",
    "topocentric": "T",
}


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


def vertex_from_swisseph(
    jd_ut: float,
    latitude_deg: float,
    longitude_deg: float,
    house_system: str = "placidus",
) -> float:
    """
    Compute Vertex using Swiss Ephemeris house calculation.

    Args:
        jd_ut: Julian Day (UT).
        latitude_deg: Geographic latitude in degrees.
        longitude_deg: Geographic longitude in degrees (east positive, west negative).
        house_system: House system name (placidus, whole_sign, equal, etc.).

    Returns:
        Vertex longitude in degrees.
    """
    import swisseph as swe

    code = HOUSE_SYSTEM_TO_SWISSEPH_CODE.get(house_system, "P")
    _, ascmc = swe.houses(jd_ut, latitude_deg, longitude_deg, code.encode("ascii"))
    return normalize_angle_deg(float(ascmc[3]))


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
    jd_ut: Optional[float] = None,
    latitude_deg: Optional[float] = None,
    longitude_deg: Optional[float] = None,
    house_system: str = "placidus",
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
        jd_ut: Optional Julian Day (UT) to compute an accurate Vertex via Swiss Ephemeris
        latitude_deg: Optional latitude to compute an accurate Vertex
        longitude_deg: Optional longitude to compute an accurate Vertex
        house_system: House system name for Swiss Ephemeris

    Returns:
        Dictionary mapping part names to longitudes in degrees
    """
    parts = {
        "part_of_fortune": part_of_fortune(sun_long, moon_long, asc_long, is_day_chart),
        "part_of_spirit": part_of_spirit(sun_long, moon_long, asc_long, is_day_chart),
        "part_of_karma": part_of_karma(sun_long, moon_long, asc_long, is_day_chart),
    }
    
    if include_vertex:
        if jd_ut is not None and latitude_deg is not None and longitude_deg is not None:
            try:
                parts["vertex"] = vertex_from_swisseph(
                    jd_ut=jd_ut,
                    latitude_deg=latitude_deg,
                    longitude_deg=longitude_deg,
                    house_system=house_system,
                )
            except Exception:
                parts["vertex"] = vertex(asc_long, mc_long, latitude_deg)
        elif latitude_deg is not None:
            parts["vertex"] = vertex(asc_long, mc_long, latitude_deg)
        else:
            parts["vertex"] = normalize_angle_deg(asc_long + 90.0)
    
    return parts











