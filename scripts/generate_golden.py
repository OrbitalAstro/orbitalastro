# SPDX-License-Identifier: AGPL-3.0-only

"""Generate golden master cases using Swiss Ephemeris for validation."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

import swisseph as swe

BASE_DIR = Path(__file__).resolve().parent.parent
EPHEMERIS_DIR = BASE_DIR / "api" / "ephe"

PLANETS: Dict[str, int] = {
    "sun": swe.SUN,
    "moon": swe.MOON,
    "mercury": swe.MERCURY,
    "venus": swe.VENUS,
    "mars": swe.MARS,
    "jupiter": swe.JUPITER,
    "saturn": swe.SATURN,
    "uranus": swe.URANUS,
    "neptune": swe.NEPTUNE,
    "pluto": swe.PLUTO,
    "true_node": swe.TRUE_NODE,
    "chiron": swe.CHIRON,
}


def _prepare() -> None:
    swe.set_ephe_path(str(EPHEMERIS_DIR))


def _make_case(
    description: str,
    dt: datetime,
    latitude: float,
    longitude: float,
) -> Dict:
    jd = swe.julday(
        dt.year, dt.month, dt.day, dt.hour + dt.minute / 60 + dt.second / 3600, swe.GREG_CAL
    )
    planets: Dict[str, float] = {}
    for name, planet_id in PLANETS.items():
        pos, rc = swe.calc_ut(jd, planet_id, swe.FLG_SPEED)
        if rc < 0:
            raise RuntimeError(f"Failed to compute {name}")
        planets[name] = round(pos[0] % 360.0, 6)

    cusps, ascmc = swe.houses(jd, latitude, longitude, b"P")
    asc = round(ascmc[0] % 360.0, 6)
    mc = round(ascmc[1] % 360.0, 6)
    houses = [round(c % 360.0, 6) for c in cusps[1:13]]

    return {
        "description": description,
        "datetime_utc": dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "latitude": latitude,
        "longitude": longitude,
        "planets": planets,
        "asc": asc,
        "mc": mc,
        "houses": houses,
    }


def main() -> None:
    _prepare()
    cases: List[Dict] = []
    cases.append(
        _make_case("Paris New Year 2025", datetime(2025, 1, 1, 0, 0), 48.8566, 2.3522)
    )
    cases.append(
        _make_case("Los Angeles Summer Solstice", datetime(2025, 6, 21, 12, 0), 34.0522, -118.2437)
    )

    destination = BASE_DIR / "tests" / "golden_master.json"
    with destination.open("w", encoding="utf-8") as handle:
        json.dump({"cases": cases}, handle, indent=2)
    print(f"Wrote golden master to {destination}")


if __name__ == "__main__":
    main()
