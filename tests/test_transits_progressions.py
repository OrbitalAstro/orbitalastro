"""Tests for transits and progressions."""

import pytest
from datetime import datetime
from astro.transits import compute_transits, compute_transits_to_angles
from astro.progressions import compute_progressed_chart
from astro.aspects import AspectConfig, detect_patterns
from astro.swisseph_positions import get_positions_from_swisseph
from astro.julian import datetime_to_julian_day


def test_compute_transits():
    """Test transit computation."""
    natal_positions = {
        "sun": 100.0,
        "moon": 200.0,
    }
    target_date = datetime(2025, 6, 15, 12, 0, 0)
    
    try:
        config = AspectConfig()
        transits = compute_transits(natal_positions, target_date, config)
        # Should return list of transits
        assert isinstance(transits, list)
        # Each transit should have required fields
        if transits:
            t = transits[0]
            assert hasattr(t, 'body1')
            assert hasattr(t, 'body2')
            assert hasattr(t, 'aspect')
            assert hasattr(t, 'orb_deg')
    except FileNotFoundError:
        # Ephemeris file might not exist for test date
        pytest.skip("Ephemeris data not available for test date")


def test_transits_pattern_detection():
    """Test pattern detection in transits."""
    natal_positions = {
        "sun": 100.0,
        "moon": 200.0,
    }
    target_date = datetime(2025, 6, 15, 12, 0, 0)
    
    try:
        config = AspectConfig()
        transits = compute_transits(natal_positions, target_date, config)
        if transits:
            patterns = detect_patterns(transits)
            assert isinstance(patterns, dict)
    except FileNotFoundError:
        pytest.skip("Ephemeris data not available for test date")


def test_transits_to_angles():
    """Test transit computation to angles."""
    natal_asc = 100.0
    natal_mc = 200.0
    target_date = datetime(2025, 6, 15, 12, 0, 0)
    
    try:
        config = AspectConfig()
        transits_to_angles = compute_transits_to_angles(
            natal_asc, natal_mc, target_date, config
        )
        assert isinstance(transits_to_angles, list)
        if transits_to_angles:
            t = transits_to_angles[0]
            assert "angle" in t
            assert "transiting_body" in t
            assert "aspect" in t
    except FileNotFoundError:
        pytest.skip("Ephemeris data not available for test date")


def test_compute_progressions():
    """Test progression computation with aspects and patterns."""
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
        assert "houses" in progressed
        
        # Test that we can compute aspects for progressed chart
        from astro.aspects import find_aspects, AspectConfig
        all_positions = progressed["planets"].copy()
        all_positions["ascendant"] = progressed["ascendant"]
        all_positions["midheaven"] = progressed["midheaven"]
        progressed_dt = datetime.fromisoformat(progressed["progressed_datetime_utc"].replace("Z", "+00:00"))
        aspects = find_aspects(all_positions, AspectConfig(), progressed_dt)
        assert isinstance(aspects, list)
        
        # Test pattern detection
        patterns = detect_patterns(aspects)
        assert isinstance(patterns, dict)
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


def test_solar_return():
    """Test solar return computation with aspects and patterns."""
    from astro.solar_returns import find_solar_return
    from astro.aspects import find_aspects, AspectConfig, detect_patterns
    
    birth_date = datetime(1990, 1, 1, 12, 0, 0)
    birth_jd = datetime_to_julian_day(birth_date)
    natal_positions = get_positions_from_swisseph(birth_date, birth_jd)
    natal_sun_long = natal_positions["sun"]
    
    try:
        return_dt, return_chart = find_solar_return(
            natal_sun_long,
            birth_date,
            2025,
            45.0,
            -73.0,
        )
        
        assert "planets" in return_chart
        assert "ascendant" in return_chart
        assert "midheaven" in return_chart
        assert "houses" in return_chart
        assert "sun_exactness_deg" in return_chart
        
        # Test aspects within return chart
        all_positions = return_chart["planets"].copy()
        all_positions["ascendant"] = return_chart["ascendant"]
        all_positions["midheaven"] = return_chart["midheaven"]
        return_dt_parsed = datetime.fromisoformat(return_chart["return_datetime_utc"].replace("Z", "+00:00"))
        aspects = find_aspects(all_positions, AspectConfig(), return_dt_parsed)
        assert isinstance(aspects, list)
        
        # Test pattern detection
        patterns = detect_patterns(aspects)
        assert isinstance(patterns, dict)
    except FileNotFoundError:
        pytest.skip("Ephemeris data not available")
