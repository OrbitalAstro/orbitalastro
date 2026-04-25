import pytest
from astro.objects_extra import get_fixed_star_position, J2000_JD, FIXED_STARS

def test_fixed_star_j2000_epoch():
    """Test that J2000 epoch returns the base coordinates."""
    for star, base_pos in FIXED_STARS.items():
        pos = get_fixed_star_position(star, J2000_JD)
        assert pos == pytest.approx(base_pos, abs=1e-5)

def test_fixed_star_future_epoch():
    """Test precession for a future epoch (e.g., J2100)."""
    # 100 years after J2000
    future_jd = J2000_JD + 100 * 365.25

    # Precession rate is approx 50.3 arcsec/year
    # 50.3 * 100 = 5030 arcsec = 1.39722 degrees
    expected_shift = 100 * (50.3 / 3600.0)

    regulus_base = FIXED_STARS["regulus"]
    expected_pos = regulus_base + expected_shift

    pos = get_fixed_star_position("regulus", future_jd)
    assert pos == pytest.approx(expected_pos, abs=1e-5)

def test_fixed_star_past_epoch():
    """Test precession for a past epoch (e.g., J1900)."""
    # 100 years before J2000
    past_jd = J2000_JD - 100 * 365.25

    expected_shift = -100 * (50.3 / 3600.0)

    aldebaran_base = FIXED_STARS["aldebaran"]
    expected_pos = aldebaran_base + expected_shift

    pos = get_fixed_star_position("aldebaran", past_jd)
    assert pos == pytest.approx(expected_pos, abs=1e-5)

def test_fixed_star_no_epoch():
    """Test behavior when no epoch is provided (should return base J2000)."""
    star = "antares"
    base_pos = FIXED_STARS[star]
    pos = get_fixed_star_position(star)
    assert pos == pytest.approx(base_pos, abs=1e-5)

def test_unknown_star():
    """Test behavior for unknown star."""
    assert get_fixed_star_position("nonexistent") is None

def test_case_insensitivity():
    """Test that star names are case-insensitive."""
    fomalhaut_pos = get_fixed_star_position("fomalhaut", J2000_JD)
    fomalhaut_upper = get_fixed_star_position("FOMALHAUT", J2000_JD)
    assert fomalhaut_pos == fomalhaut_upper

def test_normalization():
    """Test normalization around 360 degrees."""
    # Test Fomalhaut (333.86) moving forward for many years to cross 0
    # Need to cross (360 - 333.86) = 26.14 degrees
    # 26.14 / (50.3/3600) = 1871 years approx

    years = 2000
    future_jd = J2000_JD + years * 365.25
    shift = years * (50.3 / 3600.0)

    base = FIXED_STARS["fomalhaut"]
    expected = (base + shift) % 360.0

    pos = get_fixed_star_position("fomalhaut", future_jd)
    assert pos == pytest.approx(expected, abs=1e-5)
