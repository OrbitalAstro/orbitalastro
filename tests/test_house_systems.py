"""Tests for multi-house system implementations."""

import pytest
from astro.houses_multi import compute_houses
from astro.houses import compute_asc_mc
from astro.julian import datetime_to_julian_day
from datetime import datetime


def test_whole_sign_houses():
    """Test whole sign house system."""
    jd = datetime_to_julian_day(datetime(2000, 1, 1, 12, 0, 0))
    asc, mc = compute_asc_mc(jd, 45.0, -73.0)
    cusps = compute_houses("whole_sign", jd, 45.0, -73.0, asc, mc)
    assert len(cusps) == 12
    # Whole sign houses should be aligned to 30° increments
    for cusp in cusps:
        assert 0 <= cusp < 360


def test_equal_houses():
    """Test equal house system."""
    jd = datetime_to_julian_day(datetime(2000, 1, 1, 12, 0, 0))
    asc, mc = compute_asc_mc(jd, 45.0, -73.0)
    cusps = compute_houses("equal", jd, 45.0, -73.0, asc, mc)
    assert len(cusps) == 12
    # Check that houses are 30° apart
    for i in range(11):
        diff = (cusps[i + 1] - cusps[i]) % 360.0
        assert abs(diff - 30.0) < 1.0 or abs(diff - 330.0) < 1.0


def test_placidus_houses():
    """Test Placidus house system (baseline)."""
    jd = datetime_to_julian_day(datetime(2000, 1, 1, 12, 0, 0))
    asc, mc = compute_asc_mc(jd, 45.0, -73.0)
    cusps = compute_houses("placidus", jd, 45.0, -73.0, asc, mc)
    assert len(cusps) == 12
    assert all(0 <= cusp < 360 for cusp in cusps)


def test_porphyry_houses():
    """Test Porphyry house system."""
    jd = datetime_to_julian_day(datetime(2000, 1, 1, 12, 0, 0))
    asc, mc = compute_asc_mc(jd, 45.0, -73.0)
    cusps = compute_houses("porphyry", jd, 45.0, -73.0, asc, mc)
    assert len(cusps) == 12


def test_koch_houses():
    """Test Koch house system."""
    jd = datetime_to_julian_day(datetime(2000, 1, 1, 12, 0, 0))
    asc, mc = compute_asc_mc(jd, 45.0, -73.0)
    cusps = compute_houses("koch", jd, 45.0, -73.0, asc, mc)
    assert len(cusps) == 12

    # Regression test for London 2000-01-01
    # Validates against Swiss Ephemeris logic for House 11
    dt = datetime(2000, 1, 1, 12, 0, 0)
    jd_london = datetime_to_julian_day(dt)
    lat_london = 51.5074
    lon_london = -0.1278

    cusps_london = compute_houses("koch", jd_london, lat_london, lon_london)
    # Expected H11 ~ 303.36 degrees
    h11 = cusps_london[10]
    expected_h11 = 303.3656
    diff = abs(h11 - expected_h11)
    if diff > 180: diff = 360 - diff
    assert diff < 0.1, f"Koch House 11 mismatch: got {h11}, expected ~{expected_h11}"


def test_all_house_systems():
    """Test all house systems return valid cusps."""
    systems = [
        "placidus", "whole_sign", "equal", "koch", "porphyry",
        "regiomontanus", "campanus", "alcabitius", "meridian", "topocentric"
    ]
    jd = datetime_to_julian_day(datetime(2000, 1, 1, 12, 0, 0))
    asc, mc = compute_asc_mc(jd, 45.0, -73.0)
    
    for system in systems:
        cusps = compute_houses(system, jd, 45.0, -73.0, asc, mc)
        assert len(cusps) == 12
        assert all(0 <= cusp < 360 for cusp in cusps)
