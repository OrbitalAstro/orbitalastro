"""Transit computation engine."""

from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional

from astro.aspects import Aspect, AspectConfig, find_aspects
from astro.ephemeris_loader import EphemerisRepository


def compute_transits(
    natal_positions: Dict[str, float],
    target_datetime_utc: datetime,
    config: Optional[AspectConfig] = None,
) -> List[Aspect]:
    """
    Compute transits (aspects between transiting planets and natal chart).

    Args:
        natal_positions: Dictionary of natal chart positions (body -> longitude)
        target_datetime_utc: Datetime for transit calculation (UTC)
        config: Aspect configuration (uses defaults if None)

    Returns:
        List of Aspect objects representing transits
    """
    # Get transiting positions at target datetime
    transiting_positions = EphemerisRepository.get_positions(target_datetime_utc)

    # Build combined positions dict for aspect finding
    # We'll compare transiting bodies to natal bodies
    all_positions = {}
    all_positions.update(transiting_positions)
    all_positions.update(natal_positions)

    # Find aspects between transiting and natal positions
    transits = []
    for transiting_body, transiting_long in transiting_positions.items():
        for natal_body, natal_long in natal_positions.items():
            # Skip if same body
            if transiting_body == natal_body:
                continue

            # Create temporary positions dict for this pair
            pair_positions = {
                f"transit_{transiting_body}": transiting_long,
                f"natal_{natal_body}": natal_long,
            }

            # Find aspects between this pair
            aspects = find_aspects(pair_positions, config, target_datetime_utc)

            # Rename aspects to reflect transit nature
            for aspect in aspects:
                # Extract the actual body names
                body1_clean = aspect.body1.replace("transit_", "").replace("natal_", "")
                body2_clean = aspect.body2.replace("transit_", "").replace("natal_", "")

                # Determine which is transiting and which is natal
                if aspect.body1.startswith("transit_"):
                    transiting = body1_clean
                    natal = body2_clean
                else:
                    transiting = body2_clean
                    natal = body1_clean

                transits.append(
                    Aspect(
                        body1=f"transit_{transiting}",
                        body2=f"natal_{natal}",
                        aspect=aspect.aspect,
                        orb_deg=aspect.orb_deg,
                        applying=aspect.applying,
                        exact=aspect.exact,
                    )
                )

    return transits


def compute_transits_to_angles(
    natal_asc: float,
    natal_mc: float,
    target_datetime_utc: datetime,
    config: Optional[AspectConfig] = None,
) -> List[Dict]:
    """
    Compute transits to natal angles (ASC, MC, IC, DSC).

    Args:
        natal_asc: Natal ascendant longitude
        natal_mc: Natal midheaven longitude
        target_datetime_utc: Datetime for transit calculation
        config: Aspect configuration

    Returns:
        List of transit dictionaries with angle, transiting body, aspect, orb
    """
    transiting_positions = EphemerisRepository.get_positions(target_datetime_utc)
    angles = {
        "asc": natal_asc,
        "mc": natal_mc,
        "ic": (natal_mc + 180.0) % 360.0,
        "dsc": (natal_asc + 180.0) % 360.0,
    }

    transits_to_angles = []
    for angle_name, angle_long in angles.items():
        angle_positions = {f"angle_{angle_name}": angle_long}
        for transiting_body, transiting_long in transiting_positions.items():
            transit_positions = {transiting_body: transiting_long}
            transit_positions.update(angle_positions)

            aspects = find_aspects(transit_positions, config, target_datetime_utc)
            for aspect in aspects:
                # Determine which is the transiting body
                if aspect.body1.startswith("angle_"):
                    transiting = aspect.body2
                else:
                    transiting = aspect.body1

                transits_to_angles.append(
                    {
                        "angle": angle_name.upper(),
                        "transiting_body": transiting,
                        "aspect": aspect.aspect,
                        "orb_deg": aspect.orb_deg,
                        "applying": aspect.applying,
                        "exact": aspect.exact,
                    }
                )

    return transits_to_angles







