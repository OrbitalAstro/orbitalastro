# SPDX-License-Identifier: AGPL-3.0-only

"""Moon interpretation module."""

from typing import Dict


def build_moon_module(natal: Dict, config: Dict = None) -> str:
    """
    Build Moon interpretation module.

    Args:
        natal: Natal chart data
        config: Narrative config

    Returns:
        Formatted Moon interpretation text
    """
    if config is None:
        config = {}

    moon_sign = natal.get("moon_sign", "Unknown")
    moon_house = natal.get("moon_house", 1)

    tone = config.get("tone", "mythic")

    if tone == "psychological":
        intro = f"The Moon in {moon_sign} reflects your emotional nature and unconscious patterns."
    elif tone == "coaching":
        intro = f"Your Moon in {moon_sign} (house {moon_house}) shows how you process emotions and find security."
    elif tone == "soft_therapeutic":
        intro = f"Your Moon in {moon_sign} holds your emotional needs and inner child."
    else:
        intro = f"The Moon, in {moon_sign} and the {moon_house}th house, governs your emotional landscape."

    return intro














