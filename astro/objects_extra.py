# SPDX-License-Identifier: AGPL-3.0-only

"""Extra astrological objects computation (Arabic Parts, Vertex, etc.)."""

from math import atan2, cos, degrees, radians, sin, tan
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
    ramc_rad: Optional[float] = None,
    obliquity_rad: Optional[float] = None,
    latitude_deg: Optional[float] = None,
    jd_ut: Optional[float] = None,
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
        ramc_rad: Local sidereal angle in radians (spherical Vertex with obliquity and latitude)
        obliquity_rad: Mean obliquity ε in radians
        latitude_deg: Geographic latitude in degrees (north positive)
        jd_ut: Optional Julian Day (UT) to compute Vertex via Swiss Ephemeris when available
        longitude_deg: Longitude for Swiss Ephemeris Vertex
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
                if ramc_rad is not None and obliquity_rad is not None:
                    parts["vertex"] = vertex(ramc_rad, obliquity_rad, latitude_deg)
                else:
                    parts["vertex"] = normalize_angle_deg(asc_long + 90.0)
        elif ramc_rad is not None and obliquity_rad is not None and latitude_deg is not None:
            parts["vertex"] = vertex(ramc_rad, obliquity_rad, latitude_deg)
        else:
            parts["vertex"] = normalize_angle_deg(asc_long + 90.0)

    return parts
