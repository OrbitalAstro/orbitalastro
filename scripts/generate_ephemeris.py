"""Generate per-year Swiss Ephemeris JSON caches."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List

import swisseph as swe

BASE_DIR = Path(__file__).resolve().parent.parent
EPHEMERIS_DIR = BASE_DIR / "api" / "ephe"
OUTPUT_DIR = BASE_DIR / "data" / "ephemeris"
INDEX_PATH = OUTPUT_DIR / "index.json"

PLANETS: List[str] = [
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

PLANET_IDS = {
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
    "lilith_mean": swe.MEAN_APOG,
    "lilith_true": swe.TRUE_APOG,
    "ceres": swe.CERES,
    "pallas": swe.PALLAS,
    "juno": swe.JUNO,
    "vesta": swe.VESTA,
    "eris": swe.DWARF_PLANET_136199_ERIS,
}


def _prepare_ephe_path() -> None:
    if not EPHEMERIS_DIR.exists():
        raise SystemExit(f"Missing Swiss Ephemeris data under {EPHEMERIS_DIR}")
    swe.set_ephe_path(str(EPHEMERIS_DIR))


def _generate_year(year: int, interval_hours: int) -> Dict[str, Dict[str, float]]:
    start = datetime(year, 1, 1, 0, 0)
    end = datetime(year, 12, 31, 23, 0)
    delta = timedelta(hours=interval_hours)
    entries: Dict[str, Dict[str, float]] = {}
    current = start

    while current <= end:
        jd = swe.julday(
            current.year,
            current.month,
            current.day,
            current.hour + current.minute / 60 + current.second / 3600,
            swe.GREG_CAL,
        )
        row: Dict[str, float] = {}
        for body in PLANETS:
            body_id = PLANET_IDS[body]
            try:
                result, rc = swe.calc_ut(jd, body_id, swe.FLG_SPEED)
                if rc < 0:
                    # Some objects might not be available for all dates, skip with warning
                    print(f"Warning: Swiss Ephemeris failed for {body} at {current.isoformat()}, skipping")
                    continue
                longitude = result[0] % 360.0
                row[body] = round(longitude, 6)
            except (ValueError, AttributeError):
                # Handle case where object ID might not be available
                print(f"Warning: Could not compute {body} at {current.isoformat()}, skipping")
                continue
        entries[current.strftime("%Y-%m-%dT%H:%M:%SZ")] = row
        current += delta
    return entries


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--start-year", type=int, default=1900, help="Inclusive start year")
    parser.add_argument("--end-year", type=int, default=2100, help="Inclusive end year")
    parser.add_argument("--frequency-hours", type=int, default=1, help="Sampling frequency in hours")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=OUTPUT_DIR,
        help="Directory where per-year JSON will be written",
    )
    args = parser.parse_args()

    if args.end_year < args.start_year:
        raise SystemExit("--end-year must be >= --start-year")

    _prepare_ephe_path()
    args.output_dir.mkdir(parents=True, exist_ok=True)

    for year in range(args.start_year, args.end_year + 1):
        print(f"Generating ephemeris for {year}...", flush=True)
        data = _generate_year(year, args.frequency_hours)
        destination = args.output_dir / f"{year}.json"
        with destination.open("w", encoding="utf-8") as handle:
            json.dump(data, handle, indent=2, sort_keys=True)
        print(f"  saved {destination} ({len(data)} samples)")
        _update_index(year, args.output_dir)


def _update_index(year: int, output_dir: Path) -> None:
    path = output_dir / "index.json"
    if path.exists():
        catalog = json.loads(path.read_text(encoding="utf-8"))
    else:
        catalog = {"available_years": []}
    years = set(catalog.get("available_years", []))
    years.add(year)
    catalog["available_years"] = sorted(years)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(catalog, handle, indent=2)


if __name__ == "__main__":
    main()
