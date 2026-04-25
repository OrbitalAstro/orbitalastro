"""Tests for Arabic parts and Vertex."""

from math import radians

from astro.objects_extra import compute_arabic_parts, vertex


def test_vertex_spherical_mid_latitude():
    ramc = radians(50.0)
    eps = radians(23.4392911)
    assert abs(vertex(ramc, eps, 48.8566) - 72.45380938199396) < 1e-9


def test_vertex_equator_branch():
    ramc = radians(50.0)
    eps = radians(23.4392911)
    assert abs(vertex(ramc, eps, 0.0) - 52.40880593259772) < 1e-9


def test_vertex_normalized_range():
    ramc = radians(350.0)
    eps = radians(23.4392911)
    lon = vertex(ramc, eps, 40.0)
    assert 0.0 <= lon < 360.0


def test_compute_arabic_parts_vertex_fallback_without_ephemeris_context():
    parts = compute_arabic_parts(10.0, 20.0, 100.0, 200.0, True, include_vertex=True)
    assert parts["vertex"] == 190.0


def test_compute_arabic_parts_vertex_precise_with_lst():
    ramc = radians(50.0)
    eps = radians(23.4392911)
    parts = compute_arabic_parts(
        10.0,
        20.0,
        100.0,
        200.0,
        True,
        include_vertex=True,
        ramc_rad=ramc,
        obliquity_rad=eps,
        latitude_deg=48.8566,
    )
    assert abs(parts["vertex"] - 72.45380938199396) < 1e-9
