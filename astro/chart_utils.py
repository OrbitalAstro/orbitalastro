# SPDX-License-Identifier: AGPL-3.0-only

"""Helpers for assembling chart data for narratives and responses."""

from typing import Dict, List, Optional

from astro.utils import normalize_angle_deg


SIGN_NAMES = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
]


def sign_from_longitude(longitude: float) -> str:
    """Return the zodiac sign name for a longitude."""
    normalized = normalize_angle_deg(longitude)
    index = int(normalized // 30) % 12
    return SIGN_NAMES[index]


def house_number_for_longitude(longitude: float, cusps: List[float]) -> int:
    """Determine the Placidus house number for a longitude using cusps."""
    if not cusps or len(cusps) < 12:
        return 1
    normalized = normalize_angle_deg(longitude)
    for index in range(12):
        start = normalize_angle_deg(cusps[index])
        end = normalize_angle_deg(cusps[(index + 1) % 12])
        if start <= end:
            if start <= normalized < end:
                return index + 1
        else:
            if normalized >= start or normalized < end:
                return index + 1
    return 12


def annotate_planets(positions: Dict[str, float], cusps: List[float]) -> Dict[str, Dict]:
    """Build a dictionary of planet metadata (longitude, sign, house)."""
    annotated: Dict[str, Dict] = {}
    for body, longitude in positions.items():
        annotated[body] = {
            "longitude": normalize_angle_deg(longitude),
            "sign": sign_from_longitude(longitude),
            "house": house_number_for_longitude(longitude, cusps),
        }
    return annotated


def build_chart_payload_for_narrative(
    positions: Dict[str, float],
    ascendant: Optional[float],
    midheaven: Optional[float],
    cusps: Optional[List[float]],
    houses: Optional[Dict[str, float]],
    house_system: Optional[str],
) -> Dict:
    """Build a consistent chart dict suitable for narrative modules."""
    cusp_list = cusps or []
    planets_info = annotate_planets(positions, cusp_list)

    def safe_house(body: str, default: int = 1) -> int:
        return planets_info.get(body, {}).get("house", default)

    def safe_sign(body: str) -> str:
        return planets_info.get(body, {}).get("sign", "Unknown")

    def safe_longitude(body: str) -> float:
        return planets_info.get(body, {}).get("longitude", 0.0)

    def sign_from_degree(value: Optional[float]) -> str:
        if value is None:
            return "Unknown"
        return sign_from_longitude(value)

    payload = {
        "sun_longitude": safe_longitude("sun"),
        "sun_sign": safe_sign("sun"),
        "sun_house": safe_house("sun"),
        "moon_longitude": safe_longitude("moon"),
        "moon_sign": safe_sign("moon"),
        "moon_house": safe_house("moon"),
        "chiron_longitude": safe_longitude("chiron"),
        "chiron_sign": safe_sign("chiron"),
        "chiron_house": safe_house("chiron"),
        "asc_degree": ascendant or 0.0,
        "asc_sign": sign_from_degree(ascendant),
        "mc_degree": midheaven or 0.0,
        "mc_sign": sign_from_degree(midheaven),
        "planets": planets_info,
        "houses": houses or {},
        "house_system": house_system or "placidus",
    }

    return payload
