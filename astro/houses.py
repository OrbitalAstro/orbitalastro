"""Compute ASC, MC, and Placidus cusps with pure Python."""

from math import atan, atan2, cos, degrees, pi, radians, sin, tan
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
    asc_rad = atan(tan_asc_numerator / tan_asc_denominator)
    if tan_asc_denominator < 0:
        asc_rad += pi
    asc_deg = normalize_angle_deg(degrees(asc_rad))

    return asc_deg, mc_deg


def _solve_placidus_alpha(ramc: float, eps: float, phi: float, h_angle_rad: float) -> float:
    alpha = ramc + h_angle_rad
    for _ in range(5):
        correction = atan(tan(alpha - ramc) * sin(phi) * tan(eps))
        alpha = ramc + h_angle_rad + correction
    return alpha


def _ra_to_ecliptic_longitude(alpha: float, eps: float) -> float:
    value = tan(alpha) / cos(eps)
    lam = atan(value)
    if cos(alpha) < 0:
        lam += pi
    return normalize_angle_rad(lam)


def placidus_cusps(JD: float, latitude_deg: float, longitude_deg: float) -> List[float]:
    """Compute the 12 Placidus cusps in degrees."""
    asc_deg, mc_deg = compute_asc_mc(JD, latitude_deg, longitude_deg)
    eps = mean_obliquity(JD)
    lst_rad = lst_from_jd_and_longitude(JD, longitude_deg)
    ramc = lst_rad
    phi = radians(latitude_deg)

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
    for house, offset in h_offsets.items():
        h_rad = radians(offset)
        alpha = _solve_placidus_alpha(ramc, eps, phi, h_rad)
        lam = _ra_to_ecliptic_longitude(alpha, eps)
        intermediate[house] = normalize_angle_deg(degrees(lam))

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
