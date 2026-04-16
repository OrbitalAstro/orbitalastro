# SPDX-License-Identifier: AGPL-3.0-only

"""Calculate planetary positions directly using Swiss Ephemeris."""
from typing import Dict
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

# Mapping of body names to Swiss Ephemeris IDs
BODY_IDS = {
    "sun": None,  # Will be set dynamically
    "moon": None,
    "mercury": None,
    "venus": None,
    "mars": None,
    "jupiter": None,
    "saturn": None,
    "uranus": None,
    "neptune": None,
    "pluto": None,
    "true_node": None,
    "chiron": None,
    "lilith_mean": None,
    "lilith_true": None,
    "ceres": None,
    "pallas": None,
    "juno": None,
    "vesta": None,
    "eris": None,
}


def _get_body_ids(swe):
    """Get Swiss Ephemeris body IDs, caching them in BODY_IDS."""
    if BODY_IDS["sun"] is None:
        BODY_IDS.update({
            "sun": swe.SUN,
            "moon": swe.MOON,
            "mercury": swe.MERCURY,
            "venus": swe.VENUS,
            "mars": swe.MARS,
            "jupiter": swe.JUPITER,
            "saturn": swe.SATURN,
            "uranus": swe.URANUS,
            "neptune": swe.NEPTUNE,
            "pluto": swe.PLUTO,
            "true_node": swe.TRUE_NODE,
            "chiron": swe.CHIRON,
            "lilith_mean": swe.MEAN_APOG,
            "lilith_true": swe.OSCU_APOG,
            "ceres": swe.CERES,
            "pallas": swe.PALLAS,
            "juno": swe.JUNO,
            "vesta": swe.VESTA,
        })
        # Eris might not be available in all versions
        if hasattr(swe, 'DWARF_PLANET_136199_ERIS'):
            BODY_IDS["eris"] = swe.DWARF_PLANET_136199_ERIS
        elif hasattr(swe, 'ERIS'):
            BODY_IDS["eris"] = swe.ERIS
        else:
            BODY_IDS["eris"] = None
    return BODY_IDS


def get_positions_from_swisseph(target_datetime: datetime, jd: float) -> Dict[str, float]:
    """
    Calculate planetary positions directly using Swiss Ephemeris.
    
    Args:
        target_datetime: Target datetime (for logging/error messages)
        jd: Julian day number
        
    Returns:
        Dictionary mapping body names to longitudes in degrees
    """
    try:
        import swisseph as swe
        from astro.ephemeris_loader import EPHEMERIS_DIR
        
        # Set ephemeris path if available
        if EPHEMERIS_DIR.exists():
            swe.set_ephe_path(str(EPHEMERIS_DIR))
        
        body_ids = _get_body_ids(swe)
        positions: Dict[str, float] = {}
        
        # Calculate positions for each body
        for body_name, body_id in body_ids.items():
            if body_id is None:
                continue
            
            try:
                # Calculate position with Swiss Ephemeris
                # Format: (longitude, latitude, distance, ...), return_code
                result, rc = swe.calc_ut(jd, body_id, swe.FLG_SWIEPH)
                if rc >= 0:  # rc < 0 means error
                    longitude = result[0] % 360.0
                    positions[body_name] = longitude
                else:
                    logger.warning(f"Swiss Ephemeris returned error code {rc} for {body_name} at JD {jd}")
            except Exception as e:
                logger.warning(f"Failed to calculate position for {body_name} using Swiss Ephemeris: {e}")
                continue
        
        return positions
        
    except ImportError:
        raise RuntimeError("Swiss Ephemeris (pyswisseph) is required but not available")
    except Exception as e:
        raise RuntimeError(f"Failed to calculate positions with Swiss Ephemeris: {e}")


