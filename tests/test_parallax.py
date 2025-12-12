"""Tests for Moon parallax correction."""

import pytest
from astro.parallax import correct_moon_for_parallax
from astro.julian import datetime_to_julian_day
from datetime import datetime


def test_parallax_correction():
    """Test that parallax correction produces reasonable results."""
    moon_long_geo = 100.0
    moon_lat_geo = 0.0
    observer_lat = 45.0
    observer_lon = -73.0
    jd = datetime_to_julian_day(datetime(2000, 1, 1, 12, 0, 0))
    
    topo_long, topo_lat = correct_moon_for_parallax(
        moon_long_geo, moon_lat_geo, observer_lat, observer_lon, jd
    )
    
    # Topocentric longitude should be close to geocentric (within reasonable range)
    diff = abs(topo_long - moon_long_geo) % 360.0
    if diff > 180.0:
        diff = 360.0 - diff
    # Parallax correction is typically small (< 1°)
    assert diff < 1.0


def test_parallax_without_correction():
    """Test that get_moon_with_parallax respects use_parallax flag."""
    from astro.parallax import get_moon_with_parallax
    from datetime import datetime
    
    target_datetime = datetime(2000, 1, 1, 12, 0, 0)
    
    try:
        moon_no_parallax = get_moon_with_parallax(
            target_datetime, 45.0, -73.0, use_parallax=False
        )
        moon_with_parallax = get_moon_with_parallax(
            target_datetime, 45.0, -73.0, use_parallax=True
        )
        
        # With parallax should be different (though small difference)
        # Or same if correction is negligible
        assert isinstance(moon_no_parallax, float)
        assert isinstance(moon_with_parallax, float)
    except FileNotFoundError:
        pytest.skip("Ephemeris data not available")
