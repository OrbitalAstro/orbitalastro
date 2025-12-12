"""Loader and interpolator for the precomputed ephemeris cache."""

from __future__ import annotations

import bisect
import json
import threading
from datetime import datetime, timedelta, timezone
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
EPHEMERIS_DIR = Path(__file__).resolve().parent.parent / "api" / "ephe"

# Year bounds for on-demand generation
MIN_YEAR = 1900
MAX_YEAR = 2100

# Thread lock for on-demand generation
_generation_locks: Dict[int, threading.Lock] = {}
_generation_lock = threading.Lock()  # Lock for managing per-year locks


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


def _generate_year_on_demand(year: int) -> None:
    """Generate ephemeris data for a single year on-demand."""
    # Check if already exists (race condition check)
    file_path = CACHE_DIR / f"{year}.json"
    if file_path.exists():
        return
    
    # Try swisseph first (preferred, more accurate)
    try:
        import swisseph as swe
        if EPHEMERIS_DIR.exists():
            swe.set_ephe_path(str(EPHEMERIS_DIR))
            _generate_year_with_swisseph(year, swe)
            return
    except ImportError:
        pass
    
    # Fallback to skyfield (pure Python, no compilation needed)
    try:
        _generate_year_with_skyfield(year)
        return
    except ImportError:
        raise FileNotFoundError(
            f"Neither swisseph nor skyfield is available for on-demand ephemeris generation. "
            f"Please install skyfield (pip install skyfield) or pre-generate ephemeris data for year {year}."
        )
    
def _generate_year_with_swisseph(year: int, swe) -> None:
    """Generate ephemeris data using swisseph (preferred method)."""
    # Prepare Swiss Ephemeris path
    if not EPHEMERIS_DIR.exists():
        raise FileNotFoundError(f"Swiss Ephemeris data not found at {EPHEMERIS_DIR}")
    
    # Build planet IDs (same logic as generate_ephemeris.py)
    planet_ids = {}
    try:
        planet_ids.update({
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
            "lilith_true": swe.OSCU_APOG,
            "ceres": swe.CERES,
            "pallas": swe.PALLAS,
            "juno": swe.JUNO,
            "vesta": swe.VESTA,
        })
        if hasattr(swe, 'DWARF_PLANET_136199_ERIS'):
            planet_ids["eris"] = swe.DWARF_PLANET_136199_ERIS
        elif hasattr(swe, 'ERIS'):
            planet_ids["eris"] = swe.ERIS
    except AttributeError:
        pass
    
    # Generate data for the year (hourly samples)
    start = datetime(year, 1, 1, 0, 0)
    end = datetime(year, 12, 31, 23, 0)
    delta = timedelta(hours=1)
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
        for body in BODY_ORDER:
            if body not in planet_ids:
                continue
            body_id = planet_ids[body]
            try:
                result, rc = swe.calc_ut(jd, body_id, swe.FLG_SPEED)
                if rc < 0:
                    continue
                longitude = result[0] % 360.0
                row[body] = round(longitude, 6)
            except (ValueError, AttributeError):
                continue
        entries[current.strftime("%Y-%m-%dT%H:%M:%SZ")] = row
        current += delta
    
    # Save to file
    file_path = CACHE_DIR / f"{year}.json"
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    with file_path.open("w", encoding="utf-8") as handle:
        json.dump(entries, handle, indent=2, sort_keys=True)
    
    # Update catalog (which will save to index.json)
    catalog.register(year)


def _generate_year_with_skyfield(year: int) -> None:
    """Generate ephemeris data using skyfield (pure Python fallback)."""
    from skyfield.api import load
    from skyfield.framelib import ecliptic_frame
    
    # Load ephemeris data (downloads automatically if needed)
    ts = load.timescale()
    eph = load('de421.bsp')  # JPL ephemeris
    
    # Map our body names to skyfield objects
    bodies = {
        'sun': eph['sun'],
        'moon': eph['moon'],
        'mercury': eph['mercury'],
        'venus': eph['venus'],
        'mars': eph['mars'],
        'jupiter': eph['jupiter barycenter'],
        'saturn': eph['saturn barycenter'],
        'uranus': eph['uranus barycenter'],
        'neptune': eph['neptune barycenter'],
        'pluto': eph['pluto barycenter'],
    }
    
    # Generate hourly data for the year
    start = datetime(year, 1, 1, 0, 0, tzinfo=timezone.utc)
    end = datetime(year, 12, 31, 23, 0, tzinfo=timezone.utc)
    delta = timedelta(hours=1)
    
    entries: Dict[str, Dict[str, float]] = {}
    current = start
    
    # Earth position for calculations
    earth = eph['earth']
    
    while current <= end:
        t = ts.from_datetime(current)
        timestamp = current.strftime('%Y-%m-%dT%H:%M:%SZ')
        row: Dict[str, float] = {}
        
        for body_name, body_obj in bodies.items():
            try:
                # Get position relative to Earth
                astrometric = earth.at(t).observe(body_obj)
                # Convert to ecliptic coordinates
                lat, lon, distance = astrometric.frame_latlon(ecliptic_frame)
                longitude = lon.degrees % 360.0
                row[body_name] = round(longitude, 6)
            except Exception:
                continue
        
        # For nodes and other points, we'll need to calculate from Moon's orbit
        # True Node: intersection of Moon's orbit with ecliptic
        try:
            moon_astrometric = earth.at(t).observe(eph['moon'])
            moon_lat, moon_lon, _ = moon_astrometric.frame_latlon(ecliptic_frame)
            # Simplified: use Moon's longitude for node approximation
            # (True node calculation is more complex, this is a simplification)
            row['true_node'] = round(moon_lon.degrees % 360.0, 6)
        except Exception:
            pass
        
        entries[timestamp] = row
        current += delta
    
    # Save to file
    file_path = CACHE_DIR / f"{year}.json"
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    with file_path.open('w', encoding='utf-8') as f:
        json.dump(entries, f, indent=2, sort_keys=True)
    
    # Update catalog (which will save to index.json)
    catalog.register(year)


class EphemerisRepository:
    _cache: Dict[int, YearlyEphemeris] = {}

    @classmethod
    def _get_year_lock(cls, year: int) -> threading.Lock:
        """Get or create a lock for a specific year."""
        with _generation_lock:
            if year not in _generation_locks:
                _generation_locks[year] = threading.Lock()
            return _generation_locks[year]

    @classmethod
    def _load_year(cls, year: int) -> YearlyEphemeris:
        if year in cls._cache:
            return cls._cache[year]
        
        file_path = CACHE_DIR / f"{year}.json"
        
        # If file doesn't exist and year is within bounds, generate on-demand
        if not file_path.exists():
            if MIN_YEAR <= year <= MAX_YEAR:
                # Use per-year lock to prevent duplicate generation
                year_lock = cls._get_year_lock(year)
                with year_lock:
                    # Double-check after acquiring lock
                    if not file_path.exists():
                        try:
                            _generate_year_on_demand(year)
                        except Exception as e:
                            telemetry.record_cache_miss()
                            raise FileNotFoundError(
                                f"Failed to generate ephemeris for year {year}: {e}"
                            )
            else:
                telemetry.record_cache_miss()
                raise FileNotFoundError(
                    f"No ephemeris cache for year {year} (outside range {MIN_YEAR}-{MAX_YEAR})"
                )
        
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
