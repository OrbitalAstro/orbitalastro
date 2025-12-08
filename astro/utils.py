"""Utility helpers for astronomical angles."""

from math import tau


def normalize_angle_deg(value: float) -> float:
    """Normalize an angle to the range [0, 360)."""
    return value % 360.0


def normalize_angle_rad(value: float) -> float:
    """Normalize an angle to the range [0, 2π)."""
    return value % tau
