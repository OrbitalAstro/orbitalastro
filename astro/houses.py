"""Compute ASC, MC, and Placidus cusps with pure Python."""

from math import atan, atan2, cos, degrees, pi, radians, sin, tan, acos, asin
from typing import List, Tuple

from astro.obliquity import mean_obliquity
from astro.sidereal import lst_from_jd_and_longitude
from astro.utils import normalize_angle_deg, normalize_angle_rad


def compute_asc_mc(JD: float, latitude_deg: float, longitude_deg: float) -> Tuple[float, float]:
    """Return (ASC, MC) in degrees using mean obliquity and LST."""
    eps = mean_obliquity(JD)
    lst_rad = lst_from_jd_and_longitude(JD, longitude_deg)
    ramc = lst_rad

    tan_mc = tan(ramc) / cos(eps)
    mc_rad = atan(tan_mc)
    if cos(ramc) < 0:
        mc_rad += pi
    mc_deg = normalize_angle_deg(degrees(mc_rad))

    phi = radians(latitude_deg)
    tan_asc_numerator = 1.0
    tan_asc_denominator = cos(ramc) * tan(eps) - sin(ramc) * tan(phi)
    
    # Handle mathematical singularities (e.g. at poles)
    if abs(tan_asc_denominator) < 1e-10:
         # Fallback logic for extreme latitudes if needed, usually MC +/- 90
         # But for now we just avoid division by zero
         asc_rad = pi/2 if tan_asc_numerator > 0 else -pi/2
    else:
        asc_rad = atan(tan_asc_numerator / tan_asc_denominator)
        
    if tan_asc_denominator < 0:
        asc_rad += pi
    asc_deg = normalize_angle_deg(degrees(asc_rad))

    return asc_deg, mc_deg


def _solve_placidus_alpha(ramc: float, eps: float, phi: float, h_angle_rad: float) -> float:
    """
    Solve the Placidus semi-arc equation iteratively.
    
    R1 = tan(declination) * tan(latitude)
    R = RAMC + H (where H is the house offset angle, e.g. 30°, 60°)
    
    The formula being solved iteratively is:
    tan(declination) = tan(epsilon) * sin(R) / cos(R) ... simplified in implementation
    
    Improved version with convergence check and better mathematical stability.
    """
    # Convergence threshold (about 1 minute of arc)
    DELTA_MAX = radians(0.01)
    MAX_ITERS = 50
    
    # Initial guess
    alpha = ramc + h_angle_rad
    
    for _ in range(MAX_ITERS):
        prev_alpha = alpha
        
        # Placidus iteration formula
        # M = atan( tan(alpha - ramc) * sin(phi) * tan(eps) ) -- Simplified approach often used
        # More robust formula:
        # sin(declination) = sin(epsilon) * sin(alpha)
        # alpha_next = ramc + h_angle_rad + asin( tan(declination) * tan(phi) )
        #
        # Using the standard recursive definition:
        numerator = sin(alpha) * tan(eps) * tan(phi)
        
        # Safety check for asin domain [-1, 1]
        # If we exceed this, we are likely inside the circumpolar region where Placidus fails
        if abs(numerator) > 1.0:
            raise ValueError("Placidus non-convergence (circumpolar)")
            
        correction = asin(numerator)
        
        # Determine the semi-arc H' (standard Placidus house interval usually 30, 60 degrees)
        # In the iteration: alpha_{n+1} = RAMC + HouseOffset + correction
        # But HouseOffset depends on the house (11th=30, 12th=60, etc.)
        # The h_angle_rad passed in is the HouseOffset (30 deg or 60 deg converted to rads)
        
        # Refined formula: 
        # R(alpha) = atan( tan(alpha) / cos(epsilon) )
        # This implementation uses the classic semi-arc iterative approximation
        # F = asin( sin(alpha)*tan(eps)*tan(phi) )
        # alpha_new = RAMC + angle + F
        
        alpha = ramc + h_angle_rad + correction
        
        if abs(alpha - prev_alpha) < DELTA_MAX:
            return alpha
            
    # If no convergence, return best guess (or raise error if strict)
    return alpha


def _ra_to_ecliptic_longitude(alpha: float, eps: float) -> float:
    value = tan(alpha) / cos(eps)
    lam = atan(value)
    if cos(alpha) < 0:
        lam += pi
    return normalize_angle_rad(lam)


def placidus_cusps(JD: float, latitude_deg: float, longitude_deg: float) -> List[float]:
    """Compute the 12 Placidus cusps in degrees."""
    
    # Placidus fails beyond polar circles (+/- 66.5 degrees)
    # We fallback to Porphyry automatically in these cases
    if abs(latitude_deg) > 66.0:
        from astro.houses_multi import porphyry_cusps
        asc_deg, mc_deg = compute_asc_mc(JD, latitude_deg, longitude_deg)
        return porphyry_cusps(asc_deg, mc_deg)
        
    asc_deg, mc_deg = compute_asc_mc(JD, latitude_deg, longitude_deg)
    eps = mean_obliquity(JD)
    lst_rad = lst_from_jd_and_longitude(JD, longitude_deg)
    ramc = lst_rad
    phi = radians(latitude_deg)

    # House offsets from RAMC for 11, 12, 2, 3
    # 10th is MC, 1st is ASC
    h_offsets = {
        11: 30,
        12: 60,
        2: 120,
        3: 150,
    }

    cusps = [0.0] * 12
    cusps[0] = asc_deg
    cusps[9] = mc_deg

    intermediate: dict[int, float] = {}
    
    try:
        for house, offset in h_offsets.items():
            h_rad = radians(offset)
            alpha = _solve_placidus_alpha(ramc, eps, phi, h_rad)
            lam = _ra_to_ecliptic_longitude(alpha, eps)
            intermediate[house] = normalize_angle_deg(degrees(lam))
    except ValueError:
        # Fallback to Porphyry if iteration fails (non-convergence)
        from astro.houses_multi import porphyry_cusps
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
