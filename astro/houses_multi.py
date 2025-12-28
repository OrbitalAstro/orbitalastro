"""Multi-house system implementations - using Swiss Ephemeris exclusively."""
import logging
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


def compute_houses(
    system: str, JD: float, lat_deg: float, lon_deg: float, asc_deg: float = None, mc_deg: float = None
) -> Tuple[List[float], float, float]:
    """
    Compute house cusps using the specified house system exclusively with Swiss Ephemeris.
    
    This function uses Swiss Ephemeris (pyswisseph) for ALL house system calculations.
    No Python fallback implementations are used.

    Args:
        system: House system name (placidus, whole_sign, equal, koch, porphyry,
               regiomontanus, campanus, alcabitius, meridian, topocentric)
        JD: Julian day
        lat_deg: Latitude in degrees
        lon_deg: Longitude in degrees
        asc_deg: Ignored (kept for backward compatibility, always computed by Swiss Ephemeris)
        mc_deg: Ignored (kept for backward compatibility, always computed by Swiss Ephemeris)

    Returns:
        Tuple of (List of 12 house cusps in degrees, ascendant_deg, midheaven_deg)
        The ascendant and midheaven are always from Swiss Ephemeris.
    """
    system_lower = system.lower()
    swe_code = HOUSE_SYSTEM_CODES.get(system_lower)

    if not swe_code:
        raise ValueError(f"Unknown or unsupported house system: {system}. Supported systems: {', '.join(HOUSE_SYSTEM_CODES.keys())}")

    try:
        import swisseph as swe
        from astro.ephemeris_loader import EPHEMERIS_DIR

        if EPHEMERIS_DIR.exists():
            swe.set_ephe_path(str(EPHEMERIS_DIR))

        # Calculate houses using Swiss Ephemeris exclusively
        cusps, ascmc = swe.houses(JD, lat_deg, lon_deg, swe_code)
        
        # swisseph returns ascmc as a tuple: (ascendant, midheaven, ...)
        swe_asc = float(ascmc[0]) % 360.0
        swe_mc = float(ascmc[1]) % 360.0
        
        # swisseph can return either 13 elements (index 0 unused) or 12 elements (1..12).
        if len(cusps) == 13:
            raw_cusps = cusps[1:13]
        elif len(cusps) == 12:
            raw_cusps = cusps
        else:
            raise ValueError(f"Invalid cusp count from swisseph for system {system}: {len(cusps)}")

        cusps_list = [float(c % 360.0) for c in raw_cusps]
        return (cusps_list, swe_asc, swe_mc)
    except ImportError as e:
        raise RuntimeError("Swiss Ephemeris (pyswisseph) is required for all house system calculations") from e
    except Exception as e:
        raise RuntimeError(f"Swiss Ephemeris failed for house system {system}: {e}") from e
