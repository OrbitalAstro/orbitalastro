"""City lookup helper used by the natal endpoint."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Optional

DATA_PATH = Path(__file__).resolve().parent.parent / "data" / "resources" / "cities.json"
_CITIES_CACHE: List[Dict] | None = None


def _load_cities() -> List[Dict]:
    global _CITIES_CACHE
    if _CITIES_CACHE is not None:
        return _CITIES_CACHE
    if not DATA_PATH.exists():
        _CITIES_CACHE = []
        return _CITIES_CACHE
    with DATA_PATH.open("r", encoding="utf-8") as handle:
        _CITIES_CACHE = json.load(handle)
    return _CITIES_CACHE


def normalize_name(value: str) -> str:
    return value.strip().lower()


def lookup_city(name: str) -> Optional[Dict]:
    if not name:
        return None
    target = normalize_name(name)
    cities = _load_cities()
    for city in cities:
        city_name = normalize_name(city["name"])
        aliases = [normalize_name(alias) for alias in city.get("aliases", [])]
        if target == city_name or target in aliases:
            return city
    for city in cities:
        city_name = normalize_name(city["name"])
        if target in city_name or city_name in target:
            return city
    for city in cities:
        aliases = [normalize_name(alias) for alias in city.get("aliases", [])]
        if any(target in alias or alias in target for alias in aliases):
            return city
    return None


def list_supported_cities() -> List[str]:
    cities = _load_cities()
    return [city["name"] for city in cities]
