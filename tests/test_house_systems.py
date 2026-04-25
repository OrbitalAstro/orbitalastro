# SPDX-License-Identifier: AGPL-3.0-only

"""Tests for multi-house system implementations."""

import pytest
from astro.houses_multi import compute_houses
from astro.julian import datetime_to_julian_day
from datetime import datetime


def test_whole_sign_houses():
    """Test whole sign house system."""
    jd = datetime_to_julian_day(datetime(2000, 1, 1, 12, 0, 0))
    cusps, asc, mc = compute_houses("whole_sign", jd, 45.0, -73.0, None, None)
    assert len(cusps) == 12
    # Whole sign houses should be aligned to 30° increments
    for cusp in cusps:
        assert 0 <= cusp < 360


def test_equal_houses():
    """Test equal house system."""
    jd = datetime_to_julian_day(datetime(2000, 1, 1, 12, 0, 0))
    cusps, asc, mc = compute_houses("equal", jd, 45.0, -73.0, None, None)
    assert len(cusps) == 12
    # Check that houses are 30° apart
    for i in range(11):
        diff = (cusps[i + 1] - cusps[i]) % 360.0
        assert abs(diff - 30.0) < 1.0 or abs(diff - 330.0) < 1.0


def test_placidus_houses():
    """Test Placidus house system (baseline)."""
    jd = datetime_to_julian_day(datetime(2000, 1, 1, 12, 0, 0))
    cusps, asc, mc = compute_houses("placidus", jd, 45.0, -73.0, None, None)
    assert len(cusps) == 12
    assert all(0 <= cusp < 360 for cusp in cusps)


def test_porphyry_houses():
    """Test Porphyry house system."""
    jd = datetime_to_julian_day(datetime(2000, 1, 1, 12, 0, 0))
    cusps, asc, mc = compute_houses("porphyry", jd, 45.0, -73.0, None, None)
    assert len(cusps) == 12


def test_koch_houses():
    """Test Koch house system."""
    jd = datetime_to_julian_day(datetime(2000, 1, 1, 12, 0, 0))
    cusps, asc, mc = compute_houses("koch", jd, 45.0, -73.0, None, None)
    assert len(cusps) == 12


def test_koch_houses_london_matches_swiss_ephemeris_reference():
    """
    Regression: native Koch implementation matches Swiss Ephemeris swehouse.c
    (reference cusps from swe.houses(..., b'K') for this JD/location).
    """
    jd = datetime_to_julian_day(datetime(2000, 1, 1, 12, 0, 0))
    lat, lon = 51.5074, -0.1278
    cusps, asc, mc = compute_houses("koch", jd, lat, lon, None, None)
    ref_cusps = [
        24.014590, 58.813741, 82.022935, 99.493225, 123.358123, 159.243426,
        204.014590, 238.813741, 262.022935, 279.493225, 303.358123, 339.243426,
    ]
    ref_asc = 24.014590440762543
    ref_mc = 279.4932253031697
    for i, r in enumerate(ref_cusps):
        assert abs(cusps[i] - r) < 1e-4
    assert abs(asc - ref_asc) < 1e-5
    assert abs(mc - ref_mc) < 1e-5


def test_all_house_systems():
    """Test all house systems return valid cusps."""
    systems = [
        "placidus", "whole_sign", "equal", "koch", "porphyry",
        "regiomontanus", "campanus", "alcabitius", "meridian", "topocentric"
    ]
    jd = datetime_to_julian_day(datetime(2000, 1, 1, 12, 0, 0))
    
    for system in systems:
        cusps, asc, mc = compute_houses(system, jd, 45.0, -73.0, None, None)
        assert len(cusps) == 12
        assert all(0 <= cusp < 360 for cusp in cusps)
