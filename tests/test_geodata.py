import pytest

from astro.geodata import lookup_city, list_supported_cities


def test_lookup_city_exact_name():
    city = lookup_city("Paris")
    assert city is not None
    assert city["timezone"] == "Europe/Paris"


def test_lookup_city_alias():
    city = lookup_city("NYC")
    assert city is not None
    assert city["latitude"] == pytest.approx(40.7128)


def test_lookup_city_case_insensitive():
    city = lookup_city("london")
    assert city is not None
    assert city["timezone"] == "Europe/London"


def test_list_supported_cities_contains_known():
    supported = list_supported_cities()
    assert "Paris" in supported
