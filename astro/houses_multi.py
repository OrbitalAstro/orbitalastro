# SPDX-License-Identifier: AGPL-3.0-only

"""Multi-house system implementations — Swiss Ephemeris, with native Koch matching swehouse.c."""

import logging
import math
from typing import List, Tuple

logger = logging.getLogger(__name__)

# Mapping of house system names to Swiss Ephemeris codes
# Swiss Ephemeris codes: P=Placidus, K=Koch, R=Regiomontanus, C=Campanus,
# E=Equal, W=Whole Sign, A=Alcabitius, V=Porphyry, X=Equal/MC, T=Topocentric
HOUSE_SYSTEM_CODES = {
    "placidus": b"P",
    "koch": b"K",
    "regiomontanus": b"R",
    "campanus": b"C",
    "equal": b"E",
    "whole_sign": b"W",
    "alcabitius": b"A",
    "porphyry": b"V",
    "meridian": b"X",  # Equal/MC system
    "topocentric": b"T",
}

# Match Swiss Ephemeris swehouse.c VERY_SMALL
_VERY_SMALL = 1.0 / 360000000.0


def _deg_norm(x: float) -> float:
    x = x % 360.0
    if x < 0:
        x += 360.0
    return x


def _sind(d: float) -> float:
    return math.sin(math.radians(d))


def _cosd(d: float) -> float:
    return math.cos(math.radians(d))


def _tand(d: float) -> float:
    return math.tan(math.radians(d))


def _asind(x: float) -> float:
    return math.degrees(math.asin(max(-1.0, min(1.0, x))))


def _atand(x: float) -> float:
    return math.degrees(math.atan(x))


def _asc2(x: float, f: float, sine: float, cose: float) -> float:
    """Oblique ascension helper; x in 0..90, f pole height — same as Swiss Asc2."""
    ass = -_tand(f) * sine + cose * _cosd(x)
    if abs(ass) < _VERY_SMALL:
        ass = 0.0
    sinx = _sind(x)
    if abs(sinx) < _VERY_SMALL:
        sinx = 0.0
    if sinx == 0.0:
        ass = -_VERY_SMALL if ass < 0 else _VERY_SMALL
    elif ass == 0.0:
        ass = -90.0 if sinx < 0 else 90.0
    else:
        ass = _atand(sinx / ass)
    if ass < 0:
        ass = 180.0 + ass
    return ass


def _asc1(x1: float, f: float, sine: float, cose: float) -> float:
    """Ecliptic longitude where a great circle (pole height f) cuts the ecliptic — Swiss Asc1."""
    x1 = _deg_norm(x1)
    n = int(x1 / 90.0 + 1)
    if abs(90.0 - f) < _VERY_SMALL:
        return 180.0
    if abs(90.0 + f) < _VERY_SMALL:
        return 0.0
    if n == 1:
        ass = _asc2(x1, f, sine, cose)
    elif n == 2:
        ass = 180.0 - _asc2(180.0 - x1, -f, sine, cose)
    elif n == 3:
        ass = 180.0 + _asc2(x1 - 180.0, -f, sine, cose)
    else:
        ass = 360.0 - _asc2(360.0 - x1, f, sine, cose)
    ass = _deg_norm(ass)
    if abs(ass - 90.0) < _VERY_SMALL:
        ass = 90.0
    if abs(ass - 180.0) < _VERY_SMALL:
        ass = 180.0
    if abs(ass - 270.0) < _VERY_SMALL:
        ass = 270.0
    if abs(ass - 360.0) < _VERY_SMALL:
        ass = 0.0
    return ass


def _mc_from_armc(th: float, cose: float) -> float:
    """MC ecliptic longitude from RAMC th — same quadrant rules as Swiss CalcH."""
    if abs(th - 90.0) > _VERY_SMALL and abs(th - 270.0) > _VERY_SMALL:
        tant = _tand(th)
        mc = _atand(tant / cose)
        if 90.0 < th <= 270.0:
            mc = _deg_norm(mc + 180.0)
    else:
        mc = 90.0 if abs(th - 90.0) <= _VERY_SMALL else 270.0
    return _deg_norm(mc)


def _koch_cusps(armc_deg: float, lat_deg: float, obl_deg: float) -> Tuple[List[float], float, float]:
    """
    Koch house cusps — algorithm from Swiss Ephemeris swehouse.c (case 'K').
    Returns (12 cusps, ascendant, midheaven).
    """
    sine = _sind(obl_deg)
    cose = _cosd(obl_deg)
    tanfi = _tand(lat_deg)
    th = armc_deg
    mc = _mc_from_armc(th, cose)
    sina = _sind(mc) * sine / _cosd(lat_deg)
    sina = max(-1.0, min(1.0, sina))
    cosa = math.sqrt(1.0 - sina * sina)
    c = _atand(tanfi / cosa)
    ad3 = _asind(_sind(c) * sina) / 3.0
    cusp = [0.0] * 13
    cusp[1] = _asc1(th + 90.0, lat_deg, sine, cose)
    cusp[10] = mc
    cusp[11] = _asc1(th + 30.0 - 2.0 * ad3, lat_deg, sine, cose)
    cusp[12] = _asc1(th + 60.0 - ad3, lat_deg, sine, cose)
    cusp[2] = _asc1(th + 120.0 + ad3, lat_deg, sine, cose)
    cusp[3] = _asc1(th + 150.0 + 2.0 * ad3, lat_deg, sine, cose)
    cusp[4] = _deg_norm(cusp[10] + 180.0)
    cusp[5] = _deg_norm(cusp[11] + 180.0)
    cusp[6] = _deg_norm(cusp[12] + 180.0)
    cusp[7] = _deg_norm(cusp[1] + 180.0)
    cusp[8] = _deg_norm(cusp[2] + 180.0)
    cusp[9] = _deg_norm(cusp[3] + 180.0)
    out = [_deg_norm(cusp[i]) for i in range(1, 13)]
    return out, cusp[1], cusp[10]


def _swiss_houses_raw(
    swe_code: bytes, JD: float, lat_deg: float, lon_deg: float
) -> Tuple[List[float], float, float]:
    """Call swe.houses and normalize cusp list + asc/mc."""
    import swisseph as swe
    from astro.ephemeris_loader import EPHEMERIS_DIR

    if EPHEMERIS_DIR.exists():
        swe.set_ephe_path(str(EPHEMERIS_DIR))

    cusps, ascmc = swe.houses(JD, lat_deg, lon_deg, swe_code)
    swe_asc = float(ascmc[0]) % 360.0
    swe_mc = float(ascmc[1]) % 360.0
    if len(cusps) == 13:
        raw_cusps = cusps[1:13]
    elif len(cusps) == 12:
        raw_cusps = cusps
    else:
        raise ValueError(f"Invalid cusp count from swisseph: {len(cusps)}")
    cusps_list = [float(c % 360.0) for c in raw_cusps]
    return cusps_list, swe_asc, swe_mc


def compute_houses(
    system: str, JD: float, lat_deg: float, lon_deg: float, asc_deg: float = None, mc_deg: float = None
) -> Tuple[List[float], float, float]:
    """
    Compute house cusps using the specified house system.

    Most systems are delegated to Swiss Ephemeris (pyswisseph). Koch uses the same
    formulas as Swiss Ephemeris swehouse.c: ARMC and true obliquity come from
    Swiss Ephemeris, then cusps are computed in Python. Within the polar circle
    (|latitude| ≥ 90° − obliquity), Koch falls back to Porphyry, matching Swiss.

    Args:
        system: House system name (placidus, whole_sign, equal, koch, porphyry,
               regiomontanus, campanus, alcabitius, meridian, topocentric)
        JD: Julian day
        lat_deg: Latitude in degrees
        lon_deg: Longitude in degrees
        asc_deg: Ignored (backward compatibility)
        mc_deg: Ignored (backward compatibility)

    Returns:
        Tuple of (List of 12 house cusps in degrees, ascendant_deg, midheaven_deg)
    """
    system_lower = system.lower()
    swe_code = HOUSE_SYSTEM_CODES.get(system_lower)

    if not swe_code:
        raise ValueError(
            f"Unknown or unsupported house system: {system}. "
            f"Supported systems: {', '.join(HOUSE_SYSTEM_CODES.keys())}"
        )

    try:
        import swisseph as swe
        from astro.ephemeris_loader import EPHEMERIS_DIR

        if EPHEMERIS_DIR.exists():
            swe.set_ephe_path(str(EPHEMERIS_DIR))

        if system_lower == "koch":
            nut = swe.calc_ut(JD, swe.ECL_NUT, 0)[0]
            obl_deg = float(nut[0])
            if abs(lat_deg) >= 90.0 - obl_deg:
                logger.info(
                    "Koch: polar latitude (|lat| >= 90° - obliquity); using Porphyry fallback (Swiss behaviour)."
                )
                return _swiss_houses_raw(HOUSE_SYSTEM_CODES["porphyry"], JD, lat_deg, lon_deg)

            _, ascmc = swe.houses(JD, lat_deg, lon_deg, b"P")
            armc = float(ascmc[2])
            cusps_list, asc_ret, mc_ret = _koch_cusps(armc, lat_deg, obl_deg)
            return (cusps_list, asc_ret % 360.0, mc_ret % 360.0)

        return _swiss_houses_raw(swe_code, JD, lat_deg, lon_deg)
    except ImportError as e:
        raise RuntimeError("Swiss Ephemeris (pyswisseph) is required for all house system calculations") from e
    except Exception as e:
        raise RuntimeError(f"Swiss Ephemeris failed for house system {system}: {e}") from e
