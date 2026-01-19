"""Extra astrological objects computation (Arabic Parts, Vertex, etc.)."""

from math import atan2, cos, degrees, radians, sin, tan, copysign
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


def vertex(
    asc_long: float,
    mc_long: float,
    latitude_deg: float,
    ramc_rad: Optional[float] = None,
    obliquity_rad: Optional[float] = None,
) -> float:
    """
    Compute Vertex (intersection of prime vertical and ecliptic).

    The Vertex is the point where the Prime Vertical intersects the Ecliptic in the West.
    It is effectively the Ascendant of the co-latitude.

    Args:
        asc_long: Ascendant longitude in degrees
        mc_long: Midheaven longitude in degrees
        latitude_deg: Latitude in degrees
        ramc_rad: Right Ascension of Midheaven in radians (LST). Optional but recommended for precision.
        obliquity_rad: Obliquity of ecliptic in radians. Optional but recommended.

    Returns:
        Vertex longitude in degrees
    """
    # Use precise calculation if RAMC and Obliquity are provided
    if ramc_rad is not None and obliquity_rad is not None:
        # Handle small latitude to avoid division by zero
        # We clamp phi to a small value if it is effectively zero
        phi = radians(latitude_deg)
        if abs(phi) < 1e-9:
             # Use 1e-9 with the sign of latitude (default to positive if 0)
             phi = copysign(1e-9, latitude_deg) if latitude_deg != 0 else 1e-9

        eps = obliquity_rad

        # Formula for intersection of Prime Vertical and Ecliptic
        # tan(V) = sin(RAMC) / (cos(RAMC)*cos(eps) - sin(eps)/tan(phi))
        y = sin(ramc_rad)
        x = cos(ramc_rad) * cos(eps) - sin(eps) / tan(phi)

        v_rad = atan2(y, x)
        v_deg = normalize_angle_deg(degrees(v_rad))

        # Ensure Vertex is in the Western Hemisphere
        # The Vertex is always the Western intersection.
        # The range [IC, MC] moving via DSC covers the Western Hemisphere.
        # Longitude of MC is roughly 270 (Capricorn) for Aries rising.
        # Longitude of IC is roughly 90 (Cancer).
        # Western hemisphere is from IC to MC (90 -> 270).
        # Wait, Zodiac increases Counter-Clockwise.
        # MC (top) -> ASC (left/east) -> IC (bottom) -> DSC (right/west) -> MC
        # West is centered on DSC.
        # Arc is from IC (Bottom) to MC (Top) via DSC (West).
        # IC is MC + 180.
        # So we want the point that falls in the interval [IC, MC] that contains DSC.

        ic_long = normalize_angle_deg(mc_long + 180.0)

        # Distance from IC in direction of zodiac
        # If we start at IC and go to MC, does DSC lie there?
        # MC=270, IC=90. DSC=180.
        # 90 -> 180 -> 270. Yes.
        # So we want v_deg to be between IC and MC (in increasing longitude order).
        # Check if v_deg is "between" IC and MC.

        # Normalize everything relative to IC being 0
        rel_v = normalize_angle_deg(v_deg - ic_long)
        rel_mc = normalize_angle_deg(mc_long - ic_long) # Should be 180

        # If rel_v is between 0 and 180, it is on the Western side (IC -> DSC -> MC)
        if rel_v > 180.0:
            # It's on the Eastern side, so flip it
            v_deg = normalize_angle_deg(v_deg + 180.0)

        return v_deg

    # Fallback to simplified calculation
    # Vertex is approximately 90° from ASC in the direction of the MC
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
    latitude_deg: float = 0.0,
    ramc_rad: Optional[float] = None,
    obliquity_rad: Optional[float] = None,
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
        latitude_deg: Latitude in degrees (required for Vertex)
        ramc_rad: RAMC/LST in radians (required for accurate Vertex)
        obliquity_rad: Obliquity in radians (required for accurate Vertex)

    Returns:
        Dictionary mapping part names to longitudes in degrees
    """
    parts = {
        "part_of_fortune": part_of_fortune(sun_long, moon_long, asc_long, is_day_chart),
        "part_of_spirit": part_of_spirit(sun_long, moon_long, asc_long, is_day_chart),
        "part_of_karma": part_of_karma(sun_long, moon_long, asc_long, is_day_chart),
    }
    
    if include_vertex:
        parts["vertex"] = vertex(asc_long, mc_long, latitude_deg, ramc_rad, obliquity_rad)
    
    return parts
