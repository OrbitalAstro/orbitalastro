"""SVG chart rendering engine."""

from __future__ import annotations

from math import cos, pi, radians, sin
from typing import Dict, List, Optional

from astro.utils import normalize_angle_deg

# Planet glyphs (Unicode)
PLANET_GLYPHS = {
    "sun": "☉",
    "moon": "☽",
    "mercury": "☿",
    "venus": "♀",
    "mars": "♂",
    "jupiter": "♃",
    "saturn": "♄",
    "uranus": "⛢",
    "neptune": "♆",
    "pluto": "♇",
    "true_node": "☊",
    "chiron": "⚷",
}

# Aspect colors
ASPECT_COLORS = {
    "conjunction": "#FF0000",
    "opposition": "#0000FF",
    "square": "#FF0000",
    "trine": "#00FF00",
    "sextile": "#FFFF00",
}

# Sign names
SIGN_NAMES = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]


def generate_chart_svg(
    natal_chart: Dict,
    aspects: Optional[List[Dict]] = None,
    config: Optional[Dict] = None,
) -> str:
    """
    Generate SVG chart wheel.

    Args:
        natal_chart: Dictionary with planets, houses, ascendant, midheaven
        aspects: Optional list of aspect dictionaries
        config: Configuration (style: traditional/modern, size, colors)

    Returns:
        SVG string
    """
    if config is None:
        config = {}

    style = config.get("style", "traditional")
    size = config.get("size", 600)
    center_x = size / 2
    center_y = size / 2
    outer_radius = size / 2 - 40
    inner_radius = outer_radius * 0.6
    house_radius = outer_radius * 0.8

    planets = natal_chart.get("planets", {})
    houses = natal_chart.get("houses", {})
    ascendant = natal_chart.get("ascendant", 0.0)
    midheaven = natal_chart.get("midheaven", 0.0)

    svg_parts = []

    # SVG header
    svg_parts.append(
        f'<svg width="{size}" height="{size}" xmlns="http://www.w3.org/2000/svg">'
    )
    svg_parts.append('<g transform="translate({}, {})">'.format(center_x, center_y))

    # Background circle
    if style == "traditional":
        svg_parts.append(
            f'<circle cx="0" cy="0" r="{outer_radius}" fill="white" stroke="black" stroke-width="2"/>'
        )
    else:
        svg_parts.append(
            f'<circle cx="0" cy="0" r="{outer_radius}" fill="#f5f5f5" stroke="#333" stroke-width="1"/>'
        )

    # Draw zodiac circle (12 signs)
    for i in range(12):
        angle = radians(i * 30.0 - 90.0)  # Start at top
        x1 = cos(angle) * outer_radius
        y1 = sin(angle) * outer_radius
        x2 = cos(angle) * (outer_radius - 20)
        y2 = sin(angle) * (outer_radius - 20)
        svg_parts.append(
            f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#666" stroke-width="1"/>'
        )
        # Sign label
        label_x = cos(angle) * (outer_radius - 35)
        label_y = sin(angle) * (outer_radius - 35)
        svg_parts.append(
            f'<text x="{label_x}" y="{label_y}" text-anchor="middle" font-size="10" fill="#333">{SIGN_NAMES[i][:3]}</text>'
        )

    # Draw house cusps
    for i in range(12):
        house_num = str(i + 1)
        if house_num in houses:
            cusp_angle = normalize_angle_deg(houses[house_num] - 90.0)
            angle_rad = radians(cusp_angle)
            x1 = cos(angle_rad) * inner_radius
            y1 = sin(angle_rad) * inner_radius
            x2 = cos(angle_rad) * house_radius
            y2 = sin(angle_rad) * house_radius
            svg_parts.append(
                f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#999" stroke-width="1" stroke-dasharray="2,2"/>'
            )

    # Draw aspect lines
    if aspects:
        aspect_lines = {}
        for aspect in aspects:
            body1 = aspect.get("body1", "")
            body2 = aspect.get("body2", "")
            aspect_type = aspect.get("aspect", "")
            
            if body1 in planets and body2 in planets:
                pos1 = planets[body1].get("longitude", 0.0) if isinstance(planets[body1], dict) else planets[body1].longitude
                pos2 = planets[body2].get("longitude", 0.0) if isinstance(planets[body2], dict) else planets[body2].longitude
                
                # Convert to coordinates
                angle1_rad = radians(normalize_angle_deg(pos1 - 90.0))
                angle2_rad = radians(normalize_angle_deg(pos2 - 90.0))
                
                x1 = cos(angle1_rad) * house_radius
                y1 = sin(angle1_rad) * house_radius
                x2 = cos(angle2_rad) * house_radius
                y2 = sin(angle2_rad) * house_radius
                
                color = ASPECT_COLORS.get(aspect_type, "#999")
                svg_parts.append(
                    f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{color}" stroke-width="1" opacity="0.6"/>'
                )

    # Draw planets
    planet_radius = 8
    for planet_name, planet_data in planets.items():
        if isinstance(planet_data, dict):
            longitude = planet_data.get("longitude", 0.0)
        else:
            longitude = planet_data.longitude
        
        angle = radians(normalize_angle_deg(longitude - 90.0))
        x = cos(angle) * house_radius
        y = sin(angle) * house_radius
        
        glyph = PLANET_GLYPHS.get(planet_name.lower(), "•")
        svg_parts.append(
            f'<circle cx="{x}" cy="{y}" r="{planet_radius}" fill="white" stroke="black" stroke-width="1"/>'
        )
        svg_parts.append(
            f'<text x="{x}" y="{y + 4}" text-anchor="middle" font-size="14" fill="black">{glyph}</text>'
        )

    # Draw ASC and MC lines
    asc_angle = radians(normalize_angle_deg(ascendant - 90.0))
    mc_angle = radians(normalize_angle_deg(midheaven - 90.0))
    
    # ASC line
    x1 = cos(asc_angle) * inner_radius
    y1 = sin(asc_angle) * inner_radius
    x2 = cos(asc_angle) * outer_radius
    y2 = sin(asc_angle) * outer_radius
    svg_parts.append(
        f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="red" stroke-width="2"/>'
    )
    
    # MC line
    x1 = cos(mc_angle) * inner_radius
    y1 = sin(mc_angle) * inner_radius
    x2 = cos(mc_angle) * outer_radius
    y2 = sin(mc_angle) * outer_radius
    svg_parts.append(
        f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="blue" stroke-width="2"/>'
    )

    svg_parts.append("</g>")
    svg_parts.append("</svg>")

    return "\n".join(svg_parts)

