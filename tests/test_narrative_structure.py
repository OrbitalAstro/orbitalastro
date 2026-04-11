# SPDX-License-Identifier: AGPL-3.0-only

"""Tests for narrative structure and modules."""

import pytest
from astro.master_prompt_builder import build_natal_reading_prompt
from astro.interp_sun import build_sun_module
from astro.interp_moon import build_moon_module
from astro.interp_houses import build_houses_module


def test_sun_module():
    """Test Sun interpretation module."""
    natal = {
        "sun_sign": "Leo",
        "sun_house": 5,
        "sun_longitude": 150.0,
    }
    config = {"tone": "mythic", "depth": "standard"}
    
    module = build_sun_module(natal, config)
    assert isinstance(module, str)
    assert "Leo" in module
    assert len(module) > 0


def test_moon_module():
    """Test Moon interpretation module."""
    natal = {
        "moon_sign": "Cancer",
        "moon_house": 4,
    }
    config = {"tone": "psychological"}
    
    module = build_moon_module(natal, config)
    assert isinstance(module, str)
    assert "Cancer" in module


def test_houses_module():
    """Test houses interpretation module."""
    natal = {
        "asc_sign": "Aries",
        "mc_sign": "Capricorn",
    }
    config = {"tone": "coaching", "focus": ["career"]}
    
    module = build_houses_module(natal, config)
    assert isinstance(module, str)
    assert "Aries" in module
    assert "career" in module.lower() or "10th" in module


def test_master_prompt_builder():
    """Test master prompt builder."""
    natal = {
        "sun_sign": "Leo",
        "sun_house": 5,
        "moon_sign": "Cancer",
        "moon_house": 4,
        "asc_sign": "Aries",
        "mc_sign": "Capricorn",
        "chiron_sign": "Scorpio",
        "chiron_house": 8,
    }
    aspects = [
        {"body1": "sun", "body2": "moon", "aspect": "trine", "orb_deg": 2.0}
    ]
    config = {"tone": "mythic", "depth": "standard", "focus": []}
    
    prompt = build_natal_reading_prompt(natal, aspects, None, None, config)
    assert isinstance(prompt, str)
    assert "mythic" in prompt.lower()
    assert "Leo" in prompt
    assert "Cancer" in prompt
