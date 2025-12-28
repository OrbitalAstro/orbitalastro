"""Aspect detection and pattern recognition engine."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple

from astro.swisseph_positions import get_positions_from_swisseph
from astro.julian import datetime_to_julian_day
from astro.utils import normalize_angle_deg


@dataclass
class Aspect:
    """Represents an aspect between two celestial bodies."""

    body1: str
    body2: str
    aspect: str
    orb_deg: float
    applying: bool
    exact: bool = False


@dataclass
class AspectConfig:
    """Configuration for aspect detection."""

    major_aspects: Dict[str, float] = None
    orbs: Dict[str, float] = None

    def __post_init__(self):
        if self.major_aspects is None:
            self.major_aspects = {
                "conjunction": 0.0,
                "opposition": 180.0,
                "square": 90.0,
                "trine": 120.0,
                "sextile": 60.0,
            }
        if self.orbs is None:
            self.orbs = {
                "default": 6.0,
                "sun": 8.0,
                "moon": 8.0,
                "chiron": 3.0,
            }


# Body speed order (fastest to slowest) for applying/separating detection
BODY_SPEED_ORDER = [
    "moon",
    "sun",
    "mercury",
    "venus",
    "mars",
    "jupiter",
    "saturn",
    "uranus",
    "neptune",
    "pluto",
    "chiron",
    "true_node",
]


def _get_orb(body: str, config: AspectConfig) -> float:
    """Get the orb for a specific body."""
    return config.orbs.get(body, config.orbs.get("default", 6.0))


def _compute_velocity(
    body: str, position: float, target_datetime: datetime, delta_hours: float = 1.0
) -> float:
    """Compute the velocity of a body in degrees per hour using Swiss Ephemeris."""
    future_time = target_datetime + timedelta(hours=delta_hours)
    try:
        future_jd = datetime_to_julian_day(future_time)
        future_positions = get_positions_from_swisseph(future_time, future_jd)
        if body not in future_positions:
            return 0.0
        future_pos = future_positions[body]
        delta_pos = (future_pos - position) % 360.0
        if delta_pos > 180.0:
            delta_pos -= 360.0
        return delta_pos / delta_hours
    except (KeyError, Exception):
        return 0.0


def _is_applying(
    body1: str,
    body2: str,
    pos1: float,
    pos2: float,
    aspect_angle: float,
    target_datetime: datetime,
) -> bool:
    """Determine if an aspect is applying (moving toward exact) or separating."""
    # Determine which body is faster
    try:
        idx1 = BODY_SPEED_ORDER.index(body1)
    except ValueError:
        idx1 = 999
    try:
        idx2 = BODY_SPEED_ORDER.index(body2)
    except ValueError:
        idx2 = 999

    faster_body = body1 if idx1 < idx2 else body2
    faster_pos = pos1 if faster_body == body1 else pos2

    # Compute velocity of faster body
    velocity = _compute_velocity(faster_body, faster_pos, target_datetime)

    # Current angular separation
    current_sep = abs(pos1 - pos2) % 360.0
    if current_sep > 180.0:
        current_sep = 360.0 - current_sep

    # Expected separation after 1 hour
    if faster_body == body1:
        future_pos1 = normalize_angle_deg(faster_pos + velocity)
        future_sep = abs(future_pos1 - pos2) % 360.0
    else:
        future_pos2 = normalize_angle_deg(faster_pos + velocity)
        future_sep = abs(pos1 - future_pos2) % 360.0
    if future_sep > 180.0:
        future_sep = 360.0 - future_sep

    # If separation is decreasing, aspect is applying
    return future_sep < current_sep


def find_aspects(
    positions: Dict[str, float],
    config: Optional[AspectConfig] = None,
    target_datetime: Optional[datetime] = None,
) -> List[Aspect]:
    """
    Find all aspects between bodies in the positions dictionary.

    Args:
        positions: Dictionary mapping body names to longitudes in degrees
        config: Aspect configuration (uses defaults if None)
        target_datetime: Datetime for velocity computation (optional, uses current time if None)

    Returns:
        List of Aspect objects
    """
    if config is None:
        config = AspectConfig()
    if target_datetime is None:
        target_datetime = datetime.now()

    aspects: List[Aspect] = []
    bodies = list(positions.keys())

    for i, body1 in enumerate(bodies):
        for body2 in bodies[i + 1 :]:
            pos1 = positions[body1]
            pos2 = positions[body2]

            # Calculate angular separation
            diff = abs(pos1 - pos2) % 360.0
            if diff > 180.0:
                diff = 360.0 - diff

            # Check each major aspect
            for aspect_name, aspect_angle in config.major_aspects.items():
                orb1 = _get_orb(body1, config)
                orb2 = _get_orb(body2, config)
                max_orb = max(orb1, orb2)

                # Check if within orb
                angle_diff = abs(diff - aspect_angle)
                if angle_diff <= max_orb:
                    orb_deg = angle_diff
                    exact = orb_deg < 0.1

                    # Determine applying/separating
                    applying = _is_applying(body1, body2, pos1, pos2, aspect_angle, target_datetime)

                    aspects.append(
                        Aspect(
                            body1=body1,
                            body2=body2,
                            aspect=aspect_name,
                            orb_deg=orb_deg,
                            applying=applying,
                            exact=exact,
                        )
                    )

    return aspects


def detect_patterns(aspects: List[Aspect], positions: Optional[Dict[str, float]] = None) -> Dict[str, List[Dict]]:
    """
    Detect aspect patterns: T-square, Grand Trine, Yod, Grand Cross.

    Args:
        aspects: List of Aspect objects
        positions: Optional dictionary of body positions for quincunx detection

    Returns:
        Dictionary mapping pattern names to lists of pattern instances
    """
    patterns: Dict[str, List[Dict]] = {
        "t_squares": [],
        "grand_trines": [],
        "yods": [],
        "grand_crosses": [],
    }

    # Build aspect graph
    aspect_map: Dict[Tuple[str, str], Aspect] = {}
    for aspect in aspects:
        key = tuple(sorted([aspect.body1, aspect.body2]))
        aspect_map[key] = aspect

    bodies = set()
    for aspect in aspects:
        bodies.add(aspect.body1)
        bodies.add(aspect.body2)
    bodies = list(bodies)

    # T-square: two oppositions + one square
    for i, body1 in enumerate(bodies):
        for body2 in bodies[i + 1 :]:
            opp_key = tuple(sorted([body1, body2]))
            if opp_key in aspect_map and aspect_map[opp_key].aspect == "opposition":
                # Find third body that squares both
                for body3 in bodies:
                    if body3 in (body1, body2):
                        continue
                    sq1_key = tuple(sorted([body1, body3]))
                    sq2_key = tuple(sorted([body2, body3]))
                    if (
                        sq1_key in aspect_map
                        and aspect_map[sq1_key].aspect == "square"
                        and sq2_key in aspect_map
                        and aspect_map[sq2_key].aspect == "square"
                    ):
                        patterns["t_squares"].append(
                            {
                                "bodies": [body1, body2, body3],
                                "opposition": [body1, body2],
                                "squares": [[body1, body3], [body2, body3]],
                            }
                        )

    # Grand Trine: three trines forming a triangle
    for i, body1 in enumerate(bodies):
        for body2 in bodies[i + 1 :]:
            tr1_key = tuple(sorted([body1, body2]))
            if tr1_key in aspect_map and aspect_map[tr1_key].aspect == "trine":
                for body3 in bodies:
                    if body3 in (body1, body2):
                        continue
                    tr2_key = tuple(sorted([body1, body3]))
                    tr3_key = tuple(sorted([body2, body3]))
                    if (
                        tr2_key in aspect_map
                        and aspect_map[tr2_key].aspect == "trine"
                        and tr3_key in aspect_map
                        and aspect_map[tr3_key].aspect == "trine"
                    ):
                        patterns["grand_trines"].append(
                            {
                                "bodies": [body1, body2, body3],
                                "trines": [[body1, body2], [body1, body3], [body2, body3]],
                            }
                        )

    # Yod: two quincunxes (150°) + one sextile (60°)
    # Detect quincunxes by checking angular separation if positions are available
    if positions:
        quincunx_pairs = []
        for i, body1 in enumerate(bodies):
            for body2 in bodies[i + 1 :]:
                if body1 in positions and body2 in positions:
                    pos1 = positions[body1]
                    pos2 = positions[body2]
                    diff = abs(pos1 - pos2) % 360.0
                    if diff > 180.0:
                        diff = 360.0 - diff
                    # Quincunx is approximately 150° (within 5° orb)
                    if abs(diff - 150.0) < 5.0 or abs(diff - 30.0) < 5.0:
                        quincunx_pairs.append((body1, body2))
        
        # Find Yods: two quincunxes sharing a body, with the other two in sextile
        for i, (b1, b2) in enumerate(quincunx_pairs):
            for b3, b4 in quincunx_pairs[i + 1 :]:
                # Check if they share a body
                shared = None
                if b1 == b3 or b1 == b4:
                    shared = b1
                    other1 = b2
                    other2 = b4 if b1 == b3 else b3
                elif b2 == b3 or b2 == b4:
                    shared = b2
                    other1 = b1
                    other2 = b4 if b2 == b3 else b3
                
                if shared:
                    # Check if other two bodies are in sextile
                    sext_key = tuple(sorted([other1, other2]))
                    if sext_key in aspect_map and aspect_map[sext_key].aspect == "sextile":
                        patterns["yods"].append(
                            {
                                "apex": shared,
                                "base": [other1, other2],
                                "quincunxes": [[shared, other1], [shared, other2]],
                                "sextile": [other1, other2],
                            }
                        )

    # Grand Cross: four squares/oppositions forming a cross
    # This is a simplified detection - looks for two oppositions that are square to each other
    oppositions = [a for a in aspects if a.aspect == "opposition"]
    for i, opp1 in enumerate(oppositions):
        for opp2 in oppositions[i + 1 :]:
            # Check if the four bodies form squares
            bodies_set = {opp1.body1, opp1.body2, opp2.body1, opp2.body2}
            if len(bodies_set) == 4:
                bodies_list = list(bodies_set)
                square_count = 0
                for j, b1 in enumerate(bodies_list):
                    for b2 in bodies_list[j + 1 :]:
                        sq_key = tuple(sorted([b1, b2]))
                        if sq_key in aspect_map and aspect_map[sq_key].aspect == "square":
                            square_count += 1
                if square_count >= 4:
                    patterns["grand_crosses"].append(
                        {
                            "bodies": bodies_list,
                            "oppositions": [[opp1.body1, opp1.body2], [opp2.body1, opp2.body2]],
                        }
                    )

    return patterns

