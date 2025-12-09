"""Houses interpretation module."""

from typing import Dict


def build_houses_module(natal: Dict, config: Dict = None) -> str:
    """
    Build houses interpretation module.

    Args:
        natal: Natal chart data
        config: Narrative config

    Returns:
        Formatted houses interpretation text
    """
    if config is None:
        config = {}

    asc_sign = natal.get("asc_sign", "Unknown")
    mc_sign = natal.get("mc_sign", "Unknown")
    focus = config.get("focus", [])

    tone = config.get("tone", "mythic")

    if tone == "psychological":
        intro = f"The Ascendant ({asc_sign}) represents your persona and how you present yourself. The Midheaven ({mc_sign}) shows your public image and career direction."
    elif tone == "coaching":
        intro = f"Your Ascendant in {asc_sign} is your outer mask, while your Midheaven in {mc_sign} points to your career path."
    else:
        intro = f"The Ascendant in {asc_sign} marks the threshold of your being, while the Midheaven in {mc_sign} illuminates your highest aspirations."

    # Add focus-specific house emphasis
    if focus:
        house_emphasis = []
        if "career" in focus:
            house_emphasis.append("10th house (career and public image)")
        if "relationships" in focus:
            house_emphasis.append("7th house (partnerships)")
        if "family" in focus:
            house_emphasis.append("4th house (home and family)")
        if house_emphasis:
            intro += f"\n\nSpecial attention to: {', '.join(house_emphasis)}."

    return intro





