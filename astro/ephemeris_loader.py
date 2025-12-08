"""Loader and interpolator for the precomputed ephemeris cache."""

from __future__ import annotations

import bisect
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Tuple

from astro.ephemeris_catalog import catalog
from astro.interpolate import interpolate_longitude_deg
from astro.telemetry import telemetry

BODY_ORDER = [
    "sun",
    "moon",
    "mercury",
    "venus",
    "mars",
    "jupiter",
    "saturn",
    "uranus",
    "neptune",
    "pluto",
    "true_node",
    "chiron",
    "lilith_mean",
    "lilith_true",
    "ceres",
    "pallas",
    "juno",
    "vesta",
    "eris",
]

CACHE_DIR = Path(__file__).resolve().parent.parent / "data" / "ephemeris"


class YearlyEphemeris:
    def __init__(self, year: int, payload: Dict[str, Dict[str, float]]):
        self.year = year
        entries: List[Tuple[datetime, Dict[str, float]]] = []
        for ts, data in payload.items():
            aware = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            entries.append((aware, data))
        entries.sort(key=lambda pair: pair[0])
        self.timestamps = [pair[0] for pair in entries]
        self.entries = [pair[1] for pair in entries]

    def _find_bracketing_indices(self, target: datetime) -> Tuple[int, int]:
        index = bisect.bisect_left(self.timestamps, target)
        if index == 0:
            return 0, 0
        if index >= len(self.timestamps):
            return len(self.timestamps) - 1, len(self.timestamps) - 1
        if self.timestamps[index] == target:
            return index, index
        return index - 1, index

    def get_bracketing(
        self, target: datetime
    ) -> Tuple[datetime, Dict[str, float], datetime, Dict[str, float]]:
        lower_idx, upper_idx = self._find_bracketing_indices(target)
        lower_time = self.timestamps[lower_idx]
        lower_data = self.entries[lower_idx]
        upper_time = self.timestamps[upper_idx]
        upper_data = self.entries[upper_idx]
        return lower_time, lower_data, upper_time, upper_data


class EphemerisRepository:
    _cache: Dict[int, YearlyEphemeris] = {}

    @classmethod
    def _load_year(cls, year: int) -> YearlyEphemeris:
        if year in cls._cache:
            return cls._cache[year]
        file_path = CACHE_DIR / f"{year}.json"
        if not file_path.exists():
            telemetry.record_cache_miss()
            raise FileNotFoundError(f"No ephemeris cache for year {year}")
        catalog.register(year)
        payload = json.loads(file_path.read_text(encoding="utf-8"))
        year_data = YearlyEphemeris(year, payload)
        cls._cache[year] = year_data
        return year_data

    @classmethod
    def get_positions(cls, target: datetime) -> Dict[str, float]:
        target = target.astimezone(timezone.utc)
        year = target.year
        primary = cls._load_year(year)
        telemetry.record_cache_hit()
        lower_time, lower_data, upper_time, upper_data = primary.get_bracketing(target)

        if (
            lower_time == upper_time
            and lower_time == primary.timestamps[-1]
            and target > lower_time
        ):
            try:
                next_year = cls._load_year(year + 1)
            except FileNotFoundError:
                return {body: lower_data.get(body, 0.0) for body in BODY_ORDER}
            upper_time = next_year.timestamps[0]
            upper_data = next_year.entries[0]

        interpolated = {}
        for body in BODY_ORDER:
            l0 = lower_data.get(body, 0.0)
            l1 = upper_data.get(body, l0)
            interpolated[body] = interpolate_longitude_deg(
                lower_time, l0, upper_time, l1, target
            )
        return interpolated
