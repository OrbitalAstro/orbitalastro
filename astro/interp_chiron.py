# SPDX-License-Identifier: AGPL-3.0-only

"""Chiron interpretation module."""

from typing import Dict


def build_chiron_module(natal: Dict, config: Dict = None) -> str:
    """
    Build Chiron interpretation module.

    Args:
        natal: Natal chart data
        config: Narrative config

    Returns:
        Formatted Chiron interpretation text
    """
    if config is None:
        config = {}

    chiron_sign = natal.get("chiron_sign", "Unknown")
    chiron_house = natal.get("chiron_house", 1)

    tone = config.get("tone", "mythic")

    if tone == "psychological":
        intro = f"Chiron in {chiron_sign} (house {chiron_house}) points to deep wounds and the path to healing."
    elif tone == "coaching":
        intro = f"Chiron in {chiron_sign} shows where you can transform pain into wisdom."
    elif tone == "soft_therapeutic":
        intro = f"Chiron in {chiron_sign} holds your deepest wound and greatest gift for healing others."
    else:
        intro = f"Chiron, the wounded healer, in {chiron_sign} and the {chiron_house}th house, marks both the wound and the medicine."

    return intro














