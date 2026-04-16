# SPDX-License-Identifier: AGPL-3.0-only

def build_preincarnation_prompt(data: dict, narrative_config: dict = None) -> str:
    """Return a complete prompt for the mythopoetic dialogue generator."""
    
    if narrative_config is None:
        narrative_config = {
            "tone": "mythic",
            "depth": "standard",
            "focus": [],
        }

    natal = data["natal"]
    pl = data["prenatal_lunation"]
    pe = data["prenatal_eclipse"]
    pp = data["prenatal_epoch"]

    planets_summary = "\n".join(
        f"- {name.title()}: {p['sign']} in house {p['house']}"
        for name, p in natal["planets"].items()
    )

    tone = narrative_config.get("tone", "mythic")
    depth = narrative_config.get("depth", "standard")
    focus = narrative_config.get("focus", [])
    
    # Adapt length based on depth
    length_map = {
        "short": "1000–1500 words",
        "standard": "2000–3000 words",
        "long": "3000–4000 words",
    }
    target_length = length_map.get(depth, "2000–3000 words")
    
    # Adapt tone description
    tone_descriptions = {
        "mythic": "mythopoetic, symbolic, archetypal",
        "psychological": "psychological, introspective, analytical",
        "coaching": "practical, action-oriented, empowering",
        "cinematic": "cinematic, visually rich, dramatic",
        "soft_therapeutic": "gentle, healing, supportive, therapeutic",
    }
    tone_desc = tone_descriptions.get(tone, "mythopoetic")
    
    # Build focus emphasis
    focus_emphasis = ""
    if focus:
        house_planet_map = {
            "career": "10th house, Midheaven, Saturn",
            "relationships": "7th house, Venus, Descendant",
            "family": "4th house, Moon, IC",
            "spirituality": "9th house, Jupiter, Neptune",
            "creativity": "5th house, Sun, Venus",
            "healing": "6th house, Chiron, 12th house",
        }
        relevant_points = []
        for domain in focus:
            if domain in house_planet_map:
                relevant_points.append(house_planet_map[domain])
        if relevant_points:
            focus_emphasis = f"\n\nSPECIAL EMPHASIS: Pay particular attention to {', '.join(relevant_points)} in your interpretation."
    
    return f"""
You are generating a long-form, {tone_desc}, emotionally rich,
DIALOGUE PRE-INCARNATION SCRIPT.

This is NOT factual or metaphysical. It is symbolic and psychological.

Length: {target_length}.
Format: MULTI-SCENE SCRIPT with character dialogue.

=========================================
NATAL CHART
=========================================
Sun: {natal['sun_sign']} in house {natal['sun_house']}
Moon: {natal['moon_sign']} in house {natal['moon_house']}
Ascendant: {natal['asc_sign']}
Midheaven: {natal['mc_sign']}
Chiron: {natal['chiron_sign']} in house {natal['chiron_house']}

Key planetary placements:
{planets_summary}

=========================================
PRENATAL EVENTS
=========================================
Prenatal Lunation: {pl['type']}, in {pl['in_sign']} (house {pl['in_house']})
Prenatal Eclipse: {pe['type']}, in {pe['in_sign']} (house {pe['in_house']})
Prenatal Epoch: {pp['type']}, in {pp['in_sign']} (house {pp['in_house']})

=========================================
DIALOGUE INSTRUCTIONS
=========================================

Write a 5-act pre-incarnation dialogue with:
- The Sun as a character
- The Moon as a character
- The Ascendant as the “Threshold Guardian”
- Chiron as “The Wounded Guide”
- The Prenatal Eclipse as a mysterious figure
- The Prenatal Lunation as an omen-bearing narrator

Acts:
I.   The Chamber of Arrival
II.  The Council of Themes
III. The Wound and the Gift (Chiron enters)
IV.  The Shadow Contract (Eclipse enters)
V.   The Descent into Birth

Make it {tone_desc}, symbolic, and emotionally meaningful.
Avoid metaphysical claims. Only symbolic interpretation.{focus_emphasis}

Begin now.
"""
