"""Aspect patterns interpretation module."""

from typing import Dict


def build_patterns_module(patterns: Dict, config: Dict = None) -> str:
    """
    Build aspect patterns interpretation module.

    Args:
        patterns: Dictionary of detected patterns
        config: Narrative config

    Returns:
        Formatted patterns interpretation text
    """
    if config is None:
        config = {}

    tone = config.get("tone", "mythic")

    pattern_descriptions = []

    if patterns.get("t_squares"):
        if tone == "psychological":
            pattern_descriptions.append("T-squares indicate areas of tension requiring integration.")
        else:
            pattern_descriptions.append("T-square patterns reveal dynamic tensions seeking resolution.")

    if patterns.get("grand_trines"):
        if tone == "psychological":
            pattern_descriptions.append("Grand trines show natural talents and ease of expression.")
        else:
            pattern_descriptions.append("Grand trine patterns flow with natural grace and harmony.")

    if patterns.get("yods"):
        if tone == "psychological":
            pattern_descriptions.append("Yod configurations point to fated themes and karmic lessons.")
        else:
            pattern_descriptions.append("Yod patterns mark significant karmic and fated themes.")

    if patterns.get("grand_crosses"):
        if tone == "psychological":
            pattern_descriptions.append("Grand crosses indicate complex life challenges requiring mastery.")
        else:
            pattern_descriptions.append("Grand cross patterns mark profound life challenges and opportunities for growth.")

    if not pattern_descriptions:
        return ""

    if tone == "mythic" or tone == "cinematic":
        return "Aspect patterns in the chart:\n" + "\n".join(f"- {desc}" for desc in pattern_descriptions)
    else:
        return "\n".join(pattern_descriptions)









