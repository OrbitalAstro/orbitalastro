"""Aspects interpretation module."""

from typing import Dict, List


def build_aspect_module(natal: Dict, aspects: List[Dict], config: Dict = None) -> str:
    """
    Build aspects interpretation module.

    Args:
        natal: Natal chart data
        aspects: List of aspect dictionaries
        config: Narrative config

    Returns:
        Formatted aspects interpretation text
    """
    if config is None:
        config = {}

    if not aspects:
        return ""

    tone = config.get("tone", "mythic")

    # Group aspects by type
    major_aspects = [a for a in aspects if a.get("aspect") in ["conjunction", "opposition", "square", "trine"]]
    
    if not major_aspects:
        return ""

    if tone == "psychological":
        intro = "Key planetary aspects reveal internal dynamics and psychological patterns:"
    elif tone == "coaching":
        intro = "Important aspects in your chart:"
    else:
        intro = "The planetary aspects weave a complex pattern of energies:"

    aspect_descriptions = []
    for aspect in major_aspects[:5]:  # Limit to top 5
        body1 = aspect.get("body1", "")
        body2 = aspect.get("body2", "")
        aspect_type = aspect.get("aspect", "")
        aspect_descriptions.append(f"{body1.title()} {aspect_type} {body2.title()}")

    return f"{intro}\n" + "\n".join(f"- {desc}" for desc in aspect_descriptions)






