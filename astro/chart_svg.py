# SPDX-License-Identifier: AGPL-3.0-only

"""SVG chart rendering engine - Traditional birth chart wheel."""

from __future__ import annotations

import random
from math import cos, pi, radians, sin, floor
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
    "lilith_mean": "⚸",
    "lilith_true": "⚸",
    "ceres": "⚳",
    "pallas": "⚴",
    "juno": "⚵",
    "vesta": "⚶",
    "eris": "⯰",
}

# Zodiac sign glyphs
SIGN_GLYPHS = [
    "♈",  # Aries
    "♉",  # Taurus
    "♊",  # Gemini
    "♋",  # Cancer
    "♌",  # Leo
    "♍",  # Virgo
    "♎",  # Libra
    "♏",  # Scorpio
    "♐",  # Sagittarius
    "♑",  # Capricorn
    "♒",  # Aquarius
    "♓",  # Pisces
]

# Sign names
SIGN_NAMES = [
    "Aries", "Taurus", "Gemini", "Cancer",
    "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces",
]

# Aspect colors - traditional astrological colors
ASPECT_COLORS = {
    "conjunction": "#FF0000",      # Red - challenging
    "opposition": "#0000FF",       # Blue - challenging but dynamic
    "square": "#FF0000",           # Red - challenging
    "trine": "#00FF00",            # Green - harmonious
    "sextile": "#00FFFF",          # Cyan - harmonious
    "quincunx": "#FF00FF",         # Magenta - minor aspect
    "semisextile": "#FFFF00",      # Yellow - minor aspect
}

# Aspect line styles
ASPECT_STYLES = {
    "conjunction": {"width": 2, "opacity": 0.8},
    "opposition": {"width": 2, "opacity": 0.8},
    "square": {"width": 2, "opacity": 0.8},
    "trine": {"width": 2, "opacity": 0.7},
    "sextile": {"width": 1.5, "opacity": 0.6},
    "quincunx": {"width": 1, "opacity": 0.5, "dash": "2,2"},
    "semisextile": {"width": 1, "opacity": 0.5, "dash": "2,2"},
}


def get_sign_from_longitude(longitude: float) -> int:
    """Get zodiac sign index (0-11) from longitude."""
    return int(floor(longitude / 30.0)) % 12


def get_degree_in_sign(longitude: float) -> float:
    """Get degree within sign (0-30)."""
    return longitude % 30.0


def get_house_for_planet(planet_longitude: float, houses: Dict[str, float]) -> int:
    """Determine which house a planet is in based on its longitude."""
    # Normalize planet longitude
    planet_long = normalize_angle_deg(planet_longitude)
    
    # Sort house cusps by longitude
    house_cusps = [(int(k), normalize_angle_deg(v)) for k, v in houses.items()]
    house_cusps.sort(key=lambda x: x[1])
    
    # Find the house
    for i in range(len(house_cusps)):
        next_idx = (i + 1) % len(house_cusps)
        cusp1 = house_cusps[i][1]
        cusp2 = house_cusps[next_idx][1]
        
        # Handle wrap-around at 0/360
        if cusp2 < cusp1:
            if planet_long >= cusp1 or planet_long < cusp2:
                return house_cusps[i][0]
        else:
            if cusp1 <= planet_long < cusp2:
                return house_cusps[i][0]
    
    return house_cusps[0][0]  # Default to first house


def generate_chart_svg(
    natal_chart: Dict,
    aspects: Optional[List[Dict]] = None,
    config: Optional[Dict] = None,
) -> str:
    """
    Generate traditional birth chart wheel SVG matching the first image style.

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
    size = config.get("size", 800)
    center_x = size / 2
    center_y = size / 2
    
    # Radius calculations for concentric circles (matching first image)
    outer_radius = size / 2 - 20
    zodiac_outer = outer_radius - 5
    zodiac_inner = outer_radius - 25
    house_number_ring = zodiac_inner - 20
    house_cusp_ring = house_number_ring - 15
    planet_ring = house_cusp_ring - 25
    aspect_ring = planet_ring - 15
    inner_radius = aspect_ring - 20
    center_circle_radius = 25

    planets = natal_chart.get("planets", {})
    houses = natal_chart.get("houses", {})
    ascendant = natal_chart.get("ascendant", 0.0)
    midheaven = natal_chart.get("midheaven", 0.0)
    house_system = natal_chart.get("house_system", "placidus")

    svg_parts = []

    # SVG header with dark cosmic background
    svg_parts.append(
        f'<svg width="{size}" height="{size}" viewBox="0 0 {size} {size}" preserveAspectRatio="xMidYMid meet" xmlns="http://www.w3.org/2000/svg">'
    )
    
    # Dark cosmic background
    svg_parts.append(f'<rect width="{size}" height="{size}" fill="#0a0e27"/>')
    
    # Add stars for cosmic effect
    random.seed(42)  # For consistent star positions
    for _ in range(80):
        x = random.uniform(0, size)
        y = random.uniform(0, size)
        opacity = random.uniform(0.3, 0.9)
        size_star = random.uniform(0.5, 1.5)
        svg_parts.append(f'<circle cx="{x}" cy="{y}" r="{size_star}" fill="white" opacity="{opacity}"/>')
    
    svg_parts.append('<g transform="translate({}, {})">'.format(center_x, center_y))

    # Outer white circle (chart boundary)
    svg_parts.append(
        f'<circle cx="0" cy="0" r="{outer_radius}" fill="white" stroke="black" stroke-width="2"/>'
    )

    # Draw 12 equal zodiac sign divisions on outer ring
    for i in range(12):
        angle = radians(i * 30.0 - 90.0)  # Start at top (Aries at 0°)
        x1 = cos(angle) * outer_radius
        y1 = sin(angle) * outer_radius
        x2 = cos(angle) * zodiac_inner
        y2 = sin(angle) * zodiac_inner
        
        # Sign division line (radial line)
        svg_parts.append(
            f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="black" stroke-width="1.5"/>'
        )
        
        # Sign glyph in outer ring (centered in each 30° segment)
        sign_glyph = SIGN_GLYPHS[i]
        mid_angle = radians((i * 30.0 + 15.0) - 90.0)  # Middle of sign
        glyph_x = cos(mid_angle) * ((zodiac_outer + zodiac_inner) / 2)
        glyph_y = sin(mid_angle) * ((zodiac_outer + zodiac_inner) / 2)
        svg_parts.append(
            f'<text x="{glyph_x}" y="{glyph_y + 6}" text-anchor="middle" font-size="20" fill="black" font-weight="bold">{sign_glyph}</text>'
        )
        
        # Degree markings every 5 degrees within each sign
        for deg in range(0, 30, 5):
            deg_angle = radians((i * 30.0 + deg) - 90.0)
            deg_x1 = cos(deg_angle) * outer_radius
            deg_y1 = sin(deg_angle) * outer_radius
            deg_x2 = cos(deg_angle) * (outer_radius - 6)
            deg_y2 = sin(deg_angle) * (outer_radius - 6)
            svg_parts.append(
                f'<line x1="{deg_x1}" y1="{deg_y1}" x2="{deg_x2}" y2="{deg_y2}" stroke="black" stroke-width="0.5"/>'
            )
            
            # Degree numbers every 10 degrees
            if deg % 10 == 0:
                num_x = cos(deg_angle) * (outer_radius - 12)
                num_y = sin(deg_angle) * (outer_radius - 12)
                svg_parts.append(
                    f'<text x="{num_x}" y="{num_y + 3}" text-anchor="middle" font-size="9" fill="black" font-weight="bold">{deg}°</text>'
                )

    # Draw house cusps (variable house sizes - Placidus style)
    house_cusps_list = []
    for i in range(12):
        house_num = str(i + 1)
        if house_num in houses:
            cusp_longitude = houses[house_num]
            house_cusps_list.append((i + 1, cusp_longitude))
            cusp_angle = normalize_angle_deg(cusp_longitude - 90.0)
            angle_rad = radians(cusp_angle)
            
            # House cusp line (radial line from inner to house_cusp_ring)
            x1 = cos(angle_rad) * inner_radius
            y1 = sin(angle_rad) * inner_radius
            x2 = cos(angle_rad) * house_cusp_ring
            y2 = sin(angle_rad) * house_cusp_ring
            svg_parts.append(
                f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="black" stroke-width="1.5"/>'
            )
            
            # House number label (in a ring)
            label_x = cos(angle_rad) * house_number_ring
            label_y = sin(angle_rad) * house_number_ring
            svg_parts.append(
                f'<text x="{label_x}" y="{label_y + 5}" text-anchor="middle" font-size="14" fill="black" font-weight="bold">{house_num}</text>'
            )
            
            # Sign glyph at house cusp (green as in first image)
            sign_idx = get_sign_from_longitude(cusp_longitude)
            sign_glyph = SIGN_GLYPHS[sign_idx]
            glyph_x = cos(angle_rad) * (house_cusp_ring + 10)
            glyph_y = sin(angle_rad) * (house_cusp_ring + 10)
            svg_parts.append(
                f'<text x="{glyph_x}" y="{glyph_y + 5}" text-anchor="middle" font-size="16" fill="#00AA00" font-weight="bold">{sign_glyph}</text>'
            )

    # Draw aspect lines first (so planets appear on top)
    if aspects:
        for aspect in aspects:
            body1 = aspect.get("body1", "")
            body2 = aspect.get("body2", "")
            aspect_type = aspect.get("aspect", "")
            
            # Get planet positions
            pos1 = None
            pos2 = None
            
            if body1 in planets:
                planet1_data = planets[body1]
                if isinstance(planet1_data, dict):
                    pos1 = planet1_data.get("longitude", 0.0)
                elif isinstance(planet1_data, (int, float)):
                    pos1 = float(planet1_data)
            
            if body2 in planets:
                planet2_data = planets[body2]
                if isinstance(planet2_data, dict):
                    pos2 = planet2_data.get("longitude", 0.0)
                elif isinstance(planet2_data, (int, float)):
                    pos2 = float(planet2_data)
            
            if pos1 is not None and pos2 is not None:
                # Convert to coordinates on aspect ring
                angle1_rad = radians(normalize_angle_deg(pos1 - 90.0))
                angle2_rad = radians(normalize_angle_deg(pos2 - 90.0))
                
                x1 = cos(angle1_rad) * aspect_ring
                y1 = sin(angle1_rad) * aspect_ring
                x2 = cos(angle2_rad) * aspect_ring
                y2 = sin(angle2_rad) * aspect_ring
                
                # Get aspect styling
                color = ASPECT_COLORS.get(aspect_type, "#999")
                style_config = ASPECT_STYLES.get(aspect_type, {"width": 1, "opacity": 0.6})
                
                stroke_dash = style_config.get("dash", "none")
                stroke_attr = f'stroke-dasharray="{stroke_dash}"' if stroke_dash != "none" else ""
                
                # Thicker lines for major aspects (matching first image)
                line_width = style_config["width"]
                if aspect_type in ["trine", "sextile"]:
                    color = "#0000FF"  # Blue for harmonious
                elif aspect_type in ["square", "opposition", "conjunction"]:
                    color = "#FF0000"  # Red for challenging
                
                svg_parts.append(
                    f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
                    f'stroke="{color}" stroke-width="{line_width}" '
                    f'opacity="{style_config["opacity"]}" {stroke_attr}/>'
                )

    # Draw planets positioned in their houses
    for planet_name, planet_data in planets.items():
        if isinstance(planet_data, dict):
            longitude = planet_data.get("longitude", 0.0)
        elif isinstance(planet_data, (int, float)):
            longitude = float(planet_data)
        else:
            continue
        
        # Position planet on planet ring based on longitude
        angle = radians(normalize_angle_deg(longitude - 90.0))
        x = cos(angle) * planet_ring
        y = sin(angle) * planet_ring
        
        glyph = PLANET_GLYPHS.get(planet_name.lower(), "•")
        
        # Planet circle background (white with black border)
        svg_parts.append(
            f'<circle cx="{x}" cy="{y}" r="12" fill="white" stroke="black" stroke-width="2"/>'
        )
        
        # Planet glyph
        svg_parts.append(
            f'<text x="{x}" y="{y + 6}" text-anchor="middle" font-size="18" fill="black" font-weight="bold">{glyph}</text>'
        )

    # Draw ASC line (horizontal, left side - matching first image)
    asc_angle = radians(normalize_angle_deg(ascendant - 90.0))
    asc_x1 = cos(asc_angle) * inner_radius
    asc_y1 = sin(asc_angle) * inner_radius
    asc_x2 = cos(asc_angle) * outer_radius
    asc_y2 = sin(asc_angle) * outer_radius
    svg_parts.append(
        f'<line x1="{asc_x1}" y1="{asc_y1}" x2="{asc_x2}" y2="{asc_y2}" stroke="black" stroke-width="3"/>'
    )
    # ASC label
    asc_label_x = cos(asc_angle) * (outer_radius + 18)
    asc_label_y = sin(asc_angle) * (outer_radius + 18)
    svg_parts.append(
        f'<text x="{asc_label_x}" y="{asc_label_y + 5}" text-anchor="middle" font-size="14" fill="black" font-weight="bold">ASC</text>'
    )
    
    # Draw MC line (vertical, top - matching first image)
    mc_angle = radians(normalize_angle_deg(midheaven - 90.0))
    mc_x1 = cos(mc_angle) * inner_radius
    mc_y1 = sin(mc_angle) * inner_radius
    mc_x2 = cos(mc_angle) * outer_radius
    mc_y2 = sin(mc_angle) * outer_radius
    svg_parts.append(
        f'<line x1="{mc_x1}" y1="{mc_y1}" x2="{mc_x2}" y2="{mc_y2}" stroke="black" stroke-width="3"/>'
    )
    # MC label
    mc_label_x = cos(mc_angle) * (outer_radius + 18)
    mc_label_y = sin(mc_angle) * (outer_radius + 18)
    svg_parts.append(
        f'<text x="{mc_label_x}" y="{mc_label_y + 5}" text-anchor="middle" font-size="14" fill="black" font-weight="bold">MC</text>'
    )

    # Center circle with house system label
    svg_parts.append(
        f'<circle cx="0" cy="0" r="{center_circle_radius}" fill="white" stroke="black" stroke-width="2"/>'
    )
    svg_parts.append(
        f'<text x="0" y="5" text-anchor="middle" font-size="11" fill="black" font-weight="bold">{house_system.upper()[:4]}</text>'
    )

    svg_parts.append("</g>")
    svg_parts.append("</svg>")

    return "\n".join(svg_parts)
