"""Index of precomputed ephemeris years."""

from __future__ import annotations

import json
from pathlib import Path
from typing import List

CATALOG_PATH = Path(__file__).resolve().parent.parent / "data" / "ephemeris" / "index.json"


class EphemerisCatalog:
    def __init__(self) -> None:
        self._years: List[int] = []
        self._load()

    def _load(self) -> None:
        if not CATALOG_PATH.exists():
            self._years = []
            return
        with CATALOG_PATH.open("r", encoding="utf-8") as handle:
            payload = json.load(handle)
        self._years = sorted(payload.get("available_years", []))

    def includes(self, year: int) -> bool:
        return year in self._years

    def available_years(self) -> List[int]:
        return list(self._years)

    def refresh(self) -> None:
        self._load()

    def register(self, year: int) -> None:
        if year not in self._years:
            self._years.append(year)
            self._years.sort()
            # Persist to disk
            self._save()
    
    def _save(self) -> None:
        """Save catalog to index.json file."""
        payload = {"available_years": self._years}
        CATALOG_PATH.parent.mkdir(parents=True, exist_ok=True)
        with CATALOG_PATH.open("w", encoding="utf-8") as handle:
            json.dump(payload, handle, indent=2)


catalog = EphemerisCatalog()
