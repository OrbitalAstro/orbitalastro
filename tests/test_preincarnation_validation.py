import pytest

from astro.validate_preincarnation_payload import validate_preincarnation_payload


SAMPLE_PAYLOAD = {
    "natal": {
        "sun_sign": "Sagittarius",
        "sun_house": 4,
        "moon_sign": "Cancer",
        "moon_house": 10,
        "asc_sign": "Virgo",
        "mc_sign": "Gemini",
        "chiron_sign": "Leo",
        "chiron_house": 11,
        "planets": {"mercury": {"sign": "Sagittarius", "house": 4}},
        "houses": {str(i): i * 10.0 for i in range(1, 13)},
    },
    "prenatal_lunation": {"type": "full_moon", "in_sign": "Cancer", "in_house": 10, "timestamp": "1990-01-11T00:00:00Z"},
    "prenatal_eclipse": {"type": "solar", "in_sign": "Capricorn", "in_house": 4, "timestamp": "1990-01-04T00:00:00Z"},
    "prenatal_epoch": {"type": "ascending", "in_sign": "Capricorn", "in_house": 4, "timestamp": "1990-01-02T00:00:00Z"},
}


def test_validation_passes_with_complete_payload():
    assert validate_preincarnation_payload(SAMPLE_PAYLOAD) is True


def test_validation_fails_when_missing_field():
    broken = {**SAMPLE_PAYLOAD}
    broken["natal"] = {**SAMPLE_PAYLOAD["natal"]}
    broken["natal"].pop("sun_sign")
    with pytest.raises(ValueError):
        validate_preincarnation_payload(broken)


def test_validation_fails_when_placeholders_remain():
    broken = {**SAMPLE_PAYLOAD}
    broken["natal"] = {**SAMPLE_PAYLOAD["natal"], "sun_sign": "{natal.sun_sign}"}
    with pytest.raises(ValueError):
        validate_preincarnation_payload(broken)
