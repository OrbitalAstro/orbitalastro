"""Tests for transits and progressions."""

import pytest
from datetime import datetime
from astro.transits import compute_transits
from astro.progressions import compute_progressed_chart


def test_compute_transits():
    """Test transit computation."""
    natal_positions = {
        "sun": 100.0,
        "moon": 200.0,
    }
    target_date = datetime(2025, 6, 15, 12, 0, 0)
    
    try:
        transits = compute_transits(natal_positions, target_date)
        # Should return list of transits
        assert isinstance(transits, list)
    except FileNotFoundError:
        # Ephemeris file might not exist for test date
        pytest.skip("Ephemeris data not available for test date")


def test_compute_progressions():
    """Test progression computation."""
    birth_datetime = datetime(1990, 1, 1, 12, 0, 0)
    progressed_date = datetime(2025, 1, 1).date()
    
    try:
        progressed = compute_progressed_chart(
            birth_datetime, progressed_date, 45.0, -73.0
        )
        assert "planets" in progressed
        assert "ascendant" in progressed
        assert "midheaven" in progressed
        assert "age_years" in progressed
    except FileNotFoundError:
        pytest.skip("Ephemeris data not available")


def test_progression_age_calculation():
    """Test that progression age is calculated correctly."""
    birth_datetime = datetime(1990, 1, 1, 12, 0, 0)
    progressed_date = datetime(2025, 1, 1).date()
    
    try:
        progressed = compute_progressed_chart(
            birth_datetime, progressed_date, 45.0, -73.0
        )
        expected_age = (progressed_date - birth_datetime.date()).days / 365.25
        assert abs(progressed["age_years"] - expected_age) < 0.1
    except FileNotFoundError:
        pytest.skip("Ephemeris data not available")
