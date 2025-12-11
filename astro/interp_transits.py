"""Transits interpretation module."""

from typing import Dict, List


def build_transits_module(transits: List[Dict], config: Dict = None) -> str:
    """
    Build transits interpretation module.

    Args:
        transits: List of transit dictionaries
        config: Narrative config

    Returns:
        Formatted transits interpretation text
    """
    if config is None:
        config = {}

    if not transits:
        return ""

    tone = config.get("tone", "mythic")
    focus = config.get("focus", [])

    if tone == "psychological":
        intro = "Current transits reflect psychological shifts and developmental themes:"
    elif tone == "coaching":
        intro = "Active transits indicate areas for growth and action:"
    else:
        intro = "The transiting planets speak to current themes and opportunities:"

    focus_text = ""
    if focus:
        focus_text = f" Focus on {', '.join(focus)}."

    transit_descriptions = []
    for transit in transits[:5]:  # Limit to top 5
        transiting = transit.get("transiting_body", "")
        natal = transit.get("natal_body", "")
        aspect = transit.get("aspect", "")
        transit_descriptions.append(f"{transiting.title()} {aspect} {natal.title()}")

    return f"{intro}{focus_text}\n" + "\n".join(f"- {desc}" for desc in transit_descriptions)











