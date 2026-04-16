"""Master prompt builder for composing interpretation modules."""

from typing import Dict, List, Optional

from astro.interp_aspects import build_aspect_module
from astro.interp_chiron import build_chiron_module
from astro.interp_houses import build_houses_module
from astro.interp_moon import build_moon_module
from astro.interp_patterns import build_patterns_module
from astro.interp_sun import build_sun_module
from astro.interp_transits import build_transits_module


def build_natal_reading_prompt(
    natal: Dict,
    aspects: Optional[List[Dict]] = None,
    transits: Optional[List[Dict]] = None,
    patterns: Optional[Dict] = None,
    narrative_config: Optional[Dict] = None,
    chart_context: str = "natal",
) -> str:
    """
    Build a complete natal reading prompt from modular components.

    Args:
        natal: Natal chart data
        aspects: List of aspect dictionaries
        transits: Optional list of transit dictionaries
        patterns: Optional dictionary of aspect patterns
        narrative_config: Narrative configuration (tone, depth, focus)
        chart_context: Optional context key (natal, transit, progression, solar_return)

    Returns:
        Complete formatted prompt string
    """
    if narrative_config is None:
        narrative_config = {
            "tone": "mythic",
            "depth": "standard",
            "focus": [],
        }

    modules = []

    # Core modules
    modules.append(build_sun_module(natal, narrative_config))
    modules.append(build_moon_module(natal, narrative_config))
    modules.append(build_houses_module(natal, narrative_config))

    # Aspects
    if aspects:
        modules.append(build_aspect_module(natal, aspects, narrative_config))

    # Patterns
    if patterns:
        modules.append(build_patterns_module(patterns, narrative_config))

    # Chiron
    if "chiron_sign" in natal:
        modules.append(build_chiron_module(natal, narrative_config))

    # Transits (if provided)
    if transits:
        modules.append(build_transits_module(transits, narrative_config))

    # Combine modules
    combined = "\n\n".join(modules)

    tone = narrative_config.get("tone", "mythic")
    depth = narrative_config.get("depth", "standard")
    focus = narrative_config.get("focus", [])

    focus_text = ""
    if focus:
        focus_text = f"\n\nFocus domains: {', '.join(focus)}."

    context_labels = {
        "natal": "natal chart interpretation",
        "transit": "transit snapshot",
        "progression": "progressed chart narrative",
        "solar_return": "solar return profile",
    }
    context_label = context_labels.get(chart_context.lower(), f"{chart_context} chart interpretation")

    return f"""
You are generating a {tone} {context_label}.

Depth: {depth}.{focus_text}

Use the following structured modules:

{combined}

Write a coherent, flowing interpretation that weaves all modules together.
"""














