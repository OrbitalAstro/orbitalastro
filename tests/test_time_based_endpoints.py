"""Integration tests for time-based astrology endpoints."""

from __future__ import annotations

from datetime import datetime

from astro.ephemeris_loader import EphemerisRepository
from astro.houses import compute_asc_mc
from astro.houses_multi import compute_houses
from astro.julian import datetime_to_julian_day
from astro.progressions import compute_progressed_chart
from astro.solar_returns import find_solar_return
from fastapi.testclient import TestClient

from main import app


LATITUDE = 40.7128
LONGITUDE = -74.0060
PLANET_TOLERANCE = 0.3


def test_transits_endpoint_returns_chart_and_narrative():
    """Ensure transits endpoint returns structured chart data and narrative seeds."""
    natal_datetime = datetime(1990, 1, 1, 12, 0, 0)
    natal_positions = EphemerisRepository.get_positions(natal_datetime)
    natal_jd = datetime_to_julian_day(natal_datetime)
    natal_asc, natal_mc = compute_asc_mc(natal_jd, LATITUDE, LONGITUDE)

    target_datetime = datetime(2024, 12, 25, 12, 0, 0)
    payload = {
        "natal_positions": natal_positions,
        "natal_asc": natal_asc,
        "natal_mc": natal_mc,
        "target_date": "2024-12-25T12:00:00Z",
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "house_system": "placidus",
        "include_patterns": True,
        "narrative": {
            "tone": "psychological",
            "depth": "long",
            "focus": ["career"],
        },
    }

    with TestClient(app) as client:
        response = client.post("/api/transits", json=payload)

    assert response.status_code == 200
    data = response.json()

    expected_positions = EphemerisRepository.get_positions(target_datetime)
    target_jd = datetime_to_julian_day(target_datetime)
    expected_asc, expected_mc = compute_asc_mc(target_jd, LATITUDE, LONGITUDE)
    expected_cusps = compute_houses(
        "placidus",
        target_jd,
        LATITUDE,
        LONGITUDE,
        expected_asc,
        expected_mc,
    )

    assert abs(data["planets"]["sun"] - expected_positions["sun"]) < PLANET_TOLERANCE
    assert abs(data["ascendant"] - expected_asc) < 0.5
    assert abs(data["houses"]["1"] - expected_cusps[0]) < 0.5
    assert data.get("patterns") is not None
    assert isinstance(data.get("narrative_seed"), str)


def test_progressions_endpoint_matches_computed_chart():
    """Progressions response should match compute_progressed_chart output."""
    payload = {
        "birth_datetime": "1990-01-01T12:00:00Z",
        "progressed_date": "2020-01-01",
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "house_system": "placidus",
        "include_patterns": True,
        "narrative": {"tone": "cinematic", "depth": "standard", "focus": ["healing"]},
    }

    expected = compute_progressed_chart(
        datetime(1990, 1, 1, 12, 0, 0),
        datetime(2020, 1, 1).date(),
        LATITUDE,
        LONGITUDE,
        "placidus",
    )

    with TestClient(app) as client:
        response = client.post("/api/progressions", json=payload)

    assert response.status_code == 200
    data = response.json()

    assert abs(data["planets"]["sun"] - expected["planets"]["sun"]) < PLANET_TOLERANCE
    assert abs(data["age_years"] - expected["age_years"]) < 0.01
    assert isinstance(data["patterns"], dict)
    assert data.get("narrative_seed")


def test_solar_return_endpoint_delivers_expected_chart():
    """Solar return endpoint should mirror find_solar_return output."""
    payload = {
        "birth_date": "1990-01-01",
        "natal_sun_longitude": EphemerisRepository.get_positions(datetime(1990, 1, 1, 12, 0, 0))["sun"],
        "target_year": 2024,
        "latitude": LATITUDE,
        "longitude": LONGITUDE,
        "include_patterns": True,
        "narrative": {"tone": "mythic", "depth": "comprehensive", "focus": ["creativity"]},
    }

    expected_datetime, expected_chart = find_solar_return(
        payload["natal_sun_longitude"],
        datetime(1990, 1, 1, 12, 0, 0),
        payload["target_year"],
        payload["latitude"],
        payload["longitude"],
    )

    with TestClient(app) as client:
        response = client.post("/api/solar-return", json=payload)

    assert response.status_code == 200
    data = response.json()

    assert abs(data["planets"]["sun"] - expected_chart["planets"]["sun"]) < 0.2
    assert abs(data["sun_exactness_deg"] - expected_chart["sun_exactness_deg"]) < 0.05
    assert data.get("patterns") is not None
    assert data.get("narrative_seed")
