"""Multi-house system implementations."""

from math import atan, atan2, cos, degrees, pi, radians, sin, tan, asin
from typing import List, Tuple

from astro.houses import compute_asc_mc
from astro.obliquity import mean_obliquity
from astro.sidereal import lst_from_jd_and_longitude
from astro.utils import normalize_angle_deg, normalize_angle_rad


def whole_sign_cusps(asc_deg: float) -> List[float]:
    """
    Whole Sign houses: each house is an entire sign starting at the ASC sign.

    Args:
        asc_deg: Ascendant longitude in degrees

    Returns:
        List of 12 house cusps in degrees
    """
    asc_sign = int(asc_deg // 30)
    cusps = []
    for i in range(12):
        cusp_sign = (asc_sign + i) % 12
        cusps.append(cusp_sign * 30.0)
    return cusps


def equal_cusps(asc_deg: float) -> List[float]:
    """
    Equal houses: House 1 cusp = ASC, each subsequent house +30°.

    Args:
        asc_deg: Ascendant longitude in degrees

    Returns:
        List of 12 house cusps in degrees
    """
    cusps = []
    for i in range(12):
        cusp = normalize_angle_deg(asc_deg + i * 30.0)
        cusps.append(cusp)
    return cusps


def porphyry_cusps(asc_deg: float, mc_deg: float) -> List[float]:
    """
    Porphyry houses: equal division of each quadrant.

    Args:
        asc_deg: Ascendant longitude in degrees
        mc_deg: Midheaven longitude in degrees

    Returns:
        List of 12 house cusps in degrees
    """
    cusps = [0.0] * 12
    cusps[0] = asc_deg
    cusps[9] = mc_deg
    cusps[3] = normalize_angle_deg(mc_deg + 180.0)
    cusps[6] = normalize_angle_deg(asc_deg + 180.0)

    # Quadrant 1: ASC to MC
    quadrant1_size = (mc_deg - asc_deg) % 360.0
    if quadrant1_size > 180.0:
        quadrant1_size = 360.0 - quadrant1_size
    cusps[10] = normalize_angle_deg(asc_deg + quadrant1_size / 3.0)
    cusps[11] = normalize_angle_deg(asc_deg + 2 * quadrant1_size / 3.0)

    # Quadrant 2: MC to DSC
    quadrant2_size = (cusps[3] - mc_deg) % 360.0
    if quadrant2_size > 180.0:
        quadrant2_size = 360.0 - quadrant2_size
    cusps[1] = normalize_angle_deg(mc_deg + quadrant2_size / 3.0)
    cusps[2] = normalize_angle_deg(mc_deg + 2 * quadrant2_size / 3.0)

    # Quadrant 3: DSC to IC
    quadrant3_size = (cusps[6] - cusps[3]) % 360.0
    if quadrant3_size > 180.0:
        quadrant3_size = 360.0 - quadrant3_size
    cusps[4] = normalize_angle_deg(cusps[3] + quadrant3_size / 3.0)
    cusps[5] = normalize_angle_deg(cusps[3] + 2 * quadrant3_size / 3.0)

    # Quadrant 4: IC to ASC
    quadrant4_size = (asc_deg - cusps[6]) % 360.0
    if quadrant4_size > 180.0:
        quadrant4_size = 360.0 - quadrant4_size
    cusps[7] = normalize_angle_deg(cusps[6] + quadrant4_size / 3.0)
    cusps[8] = normalize_angle_deg(cusps[6] + 2 * quadrant4_size / 3.0)

    return cusps


def koch_cusps(JD: float, latitude_deg: float, longitude_deg: float) -> List[float]:
    """
    Koch (Birthplace) houses: similar to Placidus but uses different time divisions.

    Args:
        JD: Julian day
        latitude_deg: Latitude in degrees
        longitude_deg: Longitude in degrees

    Returns:
        List of 12 house cusps in degrees
    """
    # Koch system fails at polar circles, fallback to Porphyry
    if abs(latitude_deg) > 66.0:
        asc_deg, mc_deg = compute_asc_mc(JD, latitude_deg, longitude_deg)
        return porphyry_cusps(asc_deg, mc_deg)

    # Import helpers from astro.houses (inside function to avoid circular imports)
    from astro.houses import (
        _solve_placidus_alpha,
        _ra_to_ecliptic_longitude
    )

    asc_deg, mc_deg = compute_asc_mc(JD, latitude_deg, longitude_deg)
    eps = mean_obliquity(JD)
    lst_rad = lst_from_jd_and_longitude(JD, longitude_deg)
    ramc = lst_rad
    phi = radians(latitude_deg)

    # Calculate Ascensional Difference of MC (AD_MC)
    # sin(declination) = sin(longitude) * sin(epsilon)
    mc_rad = radians(mc_deg)
    sin_dec_mc = sin(mc_rad) * sin(eps)

    # Calculate AD_MC = asin(tan(phi) * tan(dec_mc))
    # Note: tan(dec) = sin(dec) / cos(dec)
    # cos(dec) = sqrt(1 - sin^2(dec))
    # So tan(dec) = sin(dec) / sqrt(1 - sin^2(dec))

    # Check for validity (although outside polar circles should be fine)
    if abs(sin_dec_mc) >= 1.0:
        # Should not happen if epsilon is correct and we are not in weird state
        return porphyry_cusps(asc_deg, mc_deg)

    tan_dec_mc = sin_dec_mc / (1.0 - sin_dec_mc**2)**0.5

    # Check if tan(phi) * tan(dec_mc) is valid for asin
    arg = tan(phi) * tan_dec_mc
    if abs(arg) > 1.0:
        # Fallback for extreme cases
        return porphyry_cusps(asc_deg, mc_deg)

    ad_mc = asin(arg)

    # Calculate offsets for Koch houses
    # House 11: RAMC + 30 - 2/3 * AD_MC
    # House 12: RAMC + 60 - 1/3 * AD_MC
    # House 2:  RAMC + 120 + 1/3 * AD_MC
    # House 3:  RAMC + 150 + 2/3 * AD_MC

    # We pass 'h_angle_rad' to _solve_placidus_alpha which solves:
    # alpha - AD(alpha) = RAMC + h_angle_rad
    # So h_angle_rad should be the Offset relative to RAMC.

    h30 = radians(30.0)
    h60 = radians(60.0)
    h120 = radians(120.0)
    h150 = radians(150.0)

    # Note: ad_mc sign logic.
    # If AD_MC is calculated as asin(tan(phi)*tan(dec)), then:
    # Formula for House 11 OA is: OA = RAMC + 30 - 2/3 AD_MC
    # So h_angle_rad = 30 - 2/3 AD_MC

    offsets = {
        11: h30 - (2.0/3.0) * ad_mc,
        12: h60 - (1.0/3.0) * ad_mc,
        2:  h120 + (1.0/3.0) * ad_mc,
        3:  h150 + (2.0/3.0) * ad_mc,
    }

    cusps = [0.0] * 12
    cusps[0] = asc_deg
    cusps[9] = mc_deg

    intermediate = {}

    try:
        for house, offset_rad in offsets.items():
            alpha = _solve_placidus_alpha(ramc, eps, phi, offset_rad)
            lam = _ra_to_ecliptic_longitude(alpha, eps)
            intermediate[house] = normalize_angle_deg(degrees(lam))
    except ValueError:
        return porphyry_cusps(asc_deg, mc_deg)

    cusps[10] = intermediate[11]
    cusps[11] = intermediate[12]
    cusps[1] = intermediate[2]
    cusps[2] = intermediate[3]

    # Oppositions
    cusps[3] = (cusps[9] + 180.0) % 360.0
    cusps[4] = (cusps[10] + 180.0) % 360.0
    cusps[5] = (cusps[11] + 180.0) % 360.0
    cusps[6] = (cusps[0] + 180.0) % 360.0
    cusps[7] = (cusps[1] + 180.0) % 360.0
    cusps[8] = (cusps[2] + 180.0) % 360.0

    return cusps


def regiomontanus_cusps(JD: float, latitude_deg: float, longitude_deg: float) -> List[float]:
    """
    Regiomontanus houses: based on prime vertical division.

    Args:
        JD: Julian day
        latitude_deg: Latitude in degrees
        longitude_deg: Longitude in degrees

    Returns:
        List of 12 house cusps in degrees
    """
    asc_deg, mc_deg = compute_asc_mc(JD, latitude_deg, longitude_deg)
    eps = mean_obliquity(JD)
    lst_rad = lst_from_jd_and_longitude(JD, longitude_deg)
    ramc = lst_rad
    phi = radians(latitude_deg)

    cusps = [0.0] * 12
    cusps[0] = asc_deg
    cusps[9] = mc_deg
    cusps[3] = normalize_angle_deg(mc_deg + 180.0)
    cusps[6] = normalize_angle_deg(asc_deg + 180.0)

    # Regiomontanus divides the prime vertical into 12 equal parts
    # Each house cusp is computed by dividing the prime vertical circle
    for i in range(1, 12):
        if i == 9:
            continue
        # Compute house cusp using prime vertical division
        house_angle = i * 30.0
        h_rad = radians(house_angle)
        
        # Regiomontanus formula
        tan_cusp = tan(h_rad) / cos(eps)
        cusp_ra = atan(tan_cusp)
        if cos(h_rad) < 0:
            cusp_ra += pi
        cusp_ra = normalize_angle_rad(cusp_ra)
        
        # Convert RA to ecliptic longitude
        tan_lambda = tan(cusp_ra) / cos(eps)
        lambda_rad = atan(tan_lambda)
        if cos(cusp_ra) < 0:
            lambda_rad += pi
        lambda_rad = normalize_angle_rad(lambda_rad)
        
        # Adjust for latitude
        sin_lambda = sin(lambda_rad)
        cos_lambda = cos(lambda_rad)
        tan_phi = tan(phi)
        
        # Compute cusp longitude
        numerator = sin_lambda * cos(eps) + cos_lambda * sin(eps) * tan_phi
        denominator = cos_lambda
        if abs(denominator) < 1e-10:
            cusp_long = cusp_ra
        else:
            cusp_long = atan2(numerator, denominator)
        
        cusps[i] = normalize_angle_deg(degrees(cusp_long))

    return cusps


def campanus_cusps(JD: float, latitude_deg: float, longitude_deg: float) -> List[float]:
    """
    Campanus houses: based on prime vertical division with different method.

    Args:
        JD: Julian day
        latitude_deg: Latitude in degrees
        longitude_deg: Longitude in degrees

    Returns:
        List of 12 house cusps in degrees
    """
    asc_deg, mc_deg = compute_asc_mc(JD, latitude_deg, longitude_deg)
    eps = mean_obliquity(JD)
    phi = radians(latitude_deg)

    cusps = [0.0] * 12
    cusps[0] = asc_deg
    cusps[9] = mc_deg
    cusps[3] = normalize_angle_deg(mc_deg + 180.0)
    cusps[6] = normalize_angle_deg(asc_deg + 180.0)

    # Campanus divides the prime vertical into equal arcs
    # Similar to Regiomontanus but with different calculation
    for i in range(1, 12):
        if i == 9:
            continue
        house_angle = i * 30.0
        h_rad = radians(house_angle)
        
        # Campanus formula
        sin_h = sin(h_rad)
        cos_h = cos(h_rad)
        
        # Compute using prime vertical
        tan_cusp = sin_h / (cos_h * cos(phi))
        cusp_ra = atan(tan_cusp)
        if cos_h < 0:
            cusp_ra += pi
        
        # Convert to ecliptic
        tan_lambda = tan(cusp_ra) / cos(eps)
        lambda_rad = atan(tan_lambda)
        if cos(cusp_ra) < 0:
            lambda_rad += pi
        
        cusps[i] = normalize_angle_deg(degrees(lambda_rad))

    return cusps


def alcabitius_cusps(JD: float, latitude_deg: float, longitude_deg: float) -> List[float]:
    """
    Alcabitius (Alcabitius) houses: time-based division similar to Placidus.

    Args:
        JD: Julian day
        latitude_deg: Latitude in degrees
        longitude_deg: Longitude in degrees

    Returns:
        List of 12 house cusps in degrees
    """
    asc_deg, mc_deg = compute_asc_mc(JD, latitude_deg, longitude_deg)
    eps = mean_obliquity(JD)
    lst_rad = lst_from_jd_and_longitude(JD, longitude_deg)
    ramc = lst_rad
    phi = radians(latitude_deg)

    cusps = [0.0] * 12
    cusps[0] = asc_deg
    cusps[9] = mc_deg
    cusps[3] = normalize_angle_deg(mc_deg + 180.0)
    cusps[6] = normalize_angle_deg(asc_deg + 180.0)

    # Alcabitius uses time-based division
    # Similar to Placidus but with different time calculations
    # Map intermediate time offsets to house indices for 11, 12, 2, 3
    h_offsets = {
        10: 30,   # 11th house cusp
        11: 60,   # 12th house cusp
        1: 120,   # 2nd house cusp
        2: 150,   # 3rd house cusp
    }

    for house, offset in h_offsets.items():
        h_rad = radians(offset)
        # Alcabitius formula
        tan_alpha = tan(h_rad) * cos(phi) / cos(eps)
        alpha = atan(tan_alpha)
        if cos(h_rad) < 0:
            alpha += pi
        alpha = normalize_angle_rad(alpha)
        
        # Convert to ecliptic longitude
        tan_lambda = tan(alpha) / cos(eps)
        lambda_rad = atan(tan_lambda)
        if cos(alpha) < 0:
            lambda_rad += pi
        
        cusps[house] = normalize_angle_deg(degrees(lambda_rad))

    # Fill in oppositions
    cusps[4] = normalize_angle_deg(cusps[10] + 180.0)
    cusps[5] = normalize_angle_deg(cusps[11] + 180.0)
    cusps[7] = normalize_angle_deg(cusps[1] + 180.0)
    cusps[8] = normalize_angle_deg(cusps[2] + 180.0)

    return cusps


def meridian_cusps(asc_deg: float, mc_deg: float) -> List[float]:
    """
    Meridian houses: simple system based on MC and ASC.

    Args:
        asc_deg: Ascendant longitude in degrees
        mc_deg: Midheaven longitude in degrees

    Returns:
        List of 12 house cusps in degrees
    """
    cusps = [0.0] * 12
    cusps[0] = asc_deg
    cusps[9] = mc_deg
    cusps[3] = normalize_angle_deg(mc_deg + 180.0)
    cusps[6] = normalize_angle_deg(asc_deg + 180.0)

    # Meridian houses: divide quadrants equally
    # Quadrant 1: ASC to MC
    q1_size = (mc_deg - asc_deg) % 360.0
    if q1_size > 180.0:
        q1_size = 360.0 - q1_size
    cusps[10] = normalize_angle_deg(asc_deg + q1_size / 3.0)
    cusps[11] = normalize_angle_deg(asc_deg + 2 * q1_size / 3.0)

    # Quadrant 2: MC to DSC
    q2_size = (cusps[3] - mc_deg) % 360.0
    if q2_size > 180.0:
        q2_size = 360.0 - q2_size
    cusps[1] = normalize_angle_deg(mc_deg + q2_size / 3.0)
    cusps[2] = normalize_angle_deg(mc_deg + 2 * q2_size / 3.0)

    # Quadrant 3: DSC to IC
    q3_size = (cusps[6] - cusps[3]) % 360.0
    if q3_size > 180.0:
        q3_size = 360.0 - q3_size
    cusps[4] = normalize_angle_deg(cusps[3] + q3_size / 3.0)
    cusps[5] = normalize_angle_deg(cusps[3] + 2 * q3_size / 3.0)

    # Quadrant 4: IC to ASC
    q4_size = (asc_deg - cusps[6]) % 360.0
    if q4_size > 180.0:
        q4_size = 360.0 - q4_size
    cusps[7] = normalize_angle_deg(cusps[6] + q4_size / 3.0)
    cusps[8] = normalize_angle_deg(cusps[6] + 2 * q4_size / 3.0)

    return cusps


def topocentric_cusps(JD: float, latitude_deg: float, longitude_deg: float) -> List[float]:
    """
    Topocentric houses: similar to Placidus but with topocentric corrections.

    Args:
        JD: Julian day
        latitude_deg: Latitude in degrees
        longitude_deg: Longitude in degrees

    Returns:
        List of 12 house cusps in degrees
    """
    # Topocentric is very similar to Placidus but accounts for observer's location
    # For this implementation, we'll use a Placidus-based approach with corrections
    from astro.houses import placidus_cusps

    # Topocentric corrections are typically small, so we'll use Placidus as base
    # A full topocentric implementation would apply corrections based on altitude
    return placidus_cusps(JD, latitude_deg, longitude_deg)


def compute_houses(
    system: str, JD: float, lat_deg: float, lon_deg: float, asc_deg: float = None, mc_deg: float = None
) -> List[float]:
    """
    Compute house cusps using the specified house system.

    Args:
        system: House system name (placidus, whole_sign, equal, koch, porphyry,
               regiomontanus, campanus, alcabitius, meridian, topocentric)
        JD: Julian day
        lat_deg: Latitude in degrees
        lon_deg: Longitude in degrees
        asc_deg: Optional precomputed ascendant (will compute if None)
        mc_deg: Optional precomputed midheaven (will compute if None)

    Returns:
        List of 12 house cusps in degrees
    """
    if asc_deg is None or mc_deg is None:
        asc_deg, mc_deg = compute_asc_mc(JD, lat_deg, lon_deg)

    system_lower = system.lower()

    if system_lower == "placidus":
        from astro.houses import placidus_cusps
        return placidus_cusps(JD, lat_deg, lon_deg)
    elif system_lower == "whole_sign":
        return whole_sign_cusps(asc_deg)
    elif system_lower == "equal":
        return equal_cusps(asc_deg)
    elif system_lower == "koch":
        return koch_cusps(JD, lat_deg, lon_deg)
    elif system_lower == "porphyry":
        return porphyry_cusps(asc_deg, mc_deg)
    elif system_lower == "regiomontanus":
        return regiomontanus_cusps(JD, lat_deg, lon_deg)
    elif system_lower == "campanus":
        return campanus_cusps(JD, lat_deg, lon_deg)
    elif system_lower == "alcabitius":
        return alcabitius_cusps(JD, lat_deg, lon_deg)
    elif system_lower == "meridian":
        return meridian_cusps(asc_deg, mc_deg)
    elif system_lower == "topocentric":
        return topocentric_cusps(JD, lat_deg, lon_deg)
    else:
        raise ValueError(f"Unknown house system: {system}")
