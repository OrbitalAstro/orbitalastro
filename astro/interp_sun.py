"""Sun interpretation module."""

from typing import Dict


def build_sun_module(natal: Dict, config: Dict = None) -> str:
    """
    Build Sun interpretation module.

    Args:
        natal: Natal chart data
        config: Narrative config (tone, depth, focus)

    Returns:
        Formatted Sun interpretation text
    """
    if config is None:
        config = {}

    sun_sign = natal.get("sun_sign", "Unknown")
    sun_house = natal.get("sun_house", 1)
    sun_longitude = natal.get("sun_longitude", 0.0)

    tone = config.get("tone", "mythic")
    depth = config.get("depth", "standard")

    # Adapt wording based on tone
    if tone == "psychological":
        intro = f"The Sun in {sun_sign} represents your core identity and ego structure."
    elif tone == "coaching":
        intro = f"Your Sun in {sun_sign} (house {sun_house}) is your driving force and life purpose."
    elif tone == "soft_therapeutic":
        intro = f"Your Sun in {sun_sign} holds the essence of who you are becoming."
    else:  # mythic, cinematic
        intro = f"The Sun, placed in {sun_sign} and the {sun_house}th house, illuminates your essential nature."

    # Add depth-based detail
    if depth == "long":
        detail = f"\n\nThis placement suggests a {sun_sign} approach to self-expression, with themes of {sun_house}th house concerns shaping your life path. The Sun's position at {sun_longitude:.1f}° indicates specific nuances in how this energy manifests."
    elif depth == "short":
        detail = ""
    else:
        detail = f"\n\nThis {sun_sign} Sun in the {sun_house}th house shapes your core identity and life direction."

    return f"{intro}{detail}"









