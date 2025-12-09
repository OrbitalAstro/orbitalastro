"""Generate golden master reference charts for testing."""

from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path

from astro.ephemeris_loader import EphemerisRepository
from astro.houses import compute_asc_mc
from astro.houses_multi import compute_houses
from astro.julian import datetime_to_julian_day
from astro.aspects import AspectConfig, find_aspects, detect_patterns
from astro.transits import compute_transits
from astro.progressions import compute_progressed_chart
from astro.solar_returns import find_solar_return
from astro.parallax import correct_moon_for_parallax


# Reference test cases
TEST_CASES = [
    {
        "name": "natal_chart_1990_01_01",
        "birth_datetime": datetime(1990, 1, 1, 12, 0, 0),
        "latitude": 40.7128,  # New York
        "longitude": -74.0060,
        "house_system": "placidus",
    },
    {
        "name": "transit_2024_12_25",
        "natal_datetime": datetime(1990, 1, 1, 12, 0, 0),
        "target_datetime": datetime(2024, 12, 25, 12, 0, 0),
        "latitude": 40.7128,
        "longitude": -74.0060,
    },
    {
        "name": "progression_age_30",
        "birth_datetime": datetime(1990, 1, 1, 12, 0, 0),
        "progressed_date": datetime(2020, 1, 1),
        "latitude": 40.7128,
        "longitude": -74.0060,
        "house_system": "placidus",
    },
    {
        "name": "solar_return_2024",
        "birth_date": datetime(1990, 1, 1, 12, 0, 0),
        "target_year": 2024,
        "latitude": 40.7128,
        "longitude": -74.0060,
        "house_system": "placidus",
    },
]


def generate_natal_golden_master(test_case: dict) -> dict:
    """Generate golden master for natal chart."""
    birth_dt = test_case["birth_datetime"]
    jd = datetime_to_julian_day(birth_dt)
    
    # Get planetary positions
    positions = EphemerisRepository.get_positions(birth_dt)
    
    # Compute angles and houses
    asc, mc = compute_asc_mc(jd, test_case["latitude"], test_case["longitude"])
    cusps = compute_houses(
        test_case["house_system"],
        jd,
        test_case["latitude"],
        test_case["longitude"],
        asc,
        mc,
    )
    
    # Compute aspects
    config = AspectConfig()
    all_positions = positions.copy()
    all_positions["ascendant"] = asc
    all_positions["midheaven"] = mc
    aspects = find_aspects(all_positions, config, birth_dt)
    patterns = detect_patterns(aspects)
    
    return {
        "julian_day": jd,
        "planets": positions,
        "ascendant": asc,
        "midheaven": mc,
        "houses": {str(i + 1): cusp for i, cusp in enumerate(cusps)},
        "house_system": test_case["house_system"],
        "aspects": [
            {
                "body1": a.body1,
                "body2": a.body2,
                "aspect": a.aspect,
                "orb_deg": a.orb_deg,
                "applying": a.applying,
            }
            for a in aspects
        ],
        "patterns": patterns,
    }


def generate_transit_golden_master(test_case: dict) -> dict:
    """Generate golden master for transits with chart data and patterns."""
    from astro.houses import compute_asc_mc
    from astro.houses_multi import compute_houses
    
    natal_dt = test_case["natal_datetime"]
    target_dt = test_case["target_datetime"]
    
    # Get natal positions
    natal_positions = EphemerisRepository.get_positions(natal_dt)
    
    # Compute transits
    config = AspectConfig()
    transits = compute_transits(natal_positions, target_dt, config)
    
    # Get transit chart data
    transit_positions = EphemerisRepository.get_positions(target_dt)
    transit_jd = datetime_to_julian_day(target_dt)
    transit_asc, transit_mc = compute_asc_mc(
        transit_jd, test_case["latitude"], test_case["longitude"]
    )
    transit_cusps = compute_houses(
        "placidus",
        transit_jd,
        test_case["latitude"],
        test_case["longitude"],
        transit_asc,
        transit_mc,
    )
    
    # Detect patterns
    patterns = detect_patterns(transits) if transits else {}
    
    return {
        "target_datetime": target_dt.isoformat(),
        "natal_positions": natal_positions,
        "transits": [
            {
                "transiting_body": t.body1.replace("transit_", ""),
                "natal_body": t.body2.replace("natal_", ""),
                "aspect": t.aspect,
                "orb_deg": t.orb_deg,
                "applying": t.applying,
                "exact": t.exact,
            }
            for t in transits
        ],
        "planets": transit_positions,
        "ascendant": transit_asc,
        "midheaven": transit_mc,
        "houses": {str(i + 1): cusp for i, cusp in enumerate(transit_cusps)},
        "house_system": "placidus",
        "patterns": patterns,
    }


def generate_progression_golden_master(test_case: dict) -> dict:
    """Generate golden master for progressions with aspects and patterns."""
    birth_dt = test_case["birth_datetime"]
    progressed_date = test_case["progressed_date"]
    
    progressed_data = compute_progressed_chart(
        birth_dt,
        progressed_date,
        test_case["latitude"],
        test_case["longitude"],
        test_case["house_system"],
    )
    
    # Compute aspects within progressed chart
    config = AspectConfig()
    all_positions = progressed_data["planets"].copy()
    all_positions["ascendant"] = progressed_data["ascendant"]
    all_positions["midheaven"] = progressed_data["midheaven"]
    
    from datetime import datetime
    progressed_dt = datetime.fromisoformat(progressed_data["progressed_datetime_utc"].replace("Z", "+00:00"))
    aspects = find_aspects(all_positions, config, progressed_dt)
    patterns = detect_patterns(aspects)
    
    progressed_data["aspects"] = [
        {
            "body1": a.body1,
            "body2": a.body2,
            "aspect": a.aspect,
            "orb_deg": a.orb_deg,
            "applying": a.applying,
        }
        for a in aspects
    ]
    progressed_data["patterns"] = patterns
    
    return progressed_data


def generate_solar_return_golden_master(test_case: dict) -> dict:
    """Generate golden master for solar return with aspects and patterns."""
    birth_dt = test_case["birth_date"]
    natal_positions = EphemerisRepository.get_positions(birth_dt)
    natal_sun_long = natal_positions["sun"]
    
    return_dt, return_chart = find_solar_return(
        natal_sun_long,
        birth_dt,
        test_case["target_year"],
        test_case["latitude"],
        test_case["longitude"],
    )
    
    # Compute aspects within return chart
    config = AspectConfig()
    all_positions = return_chart["planets"].copy()
    all_positions["ascendant"] = return_chart["ascendant"]
    all_positions["midheaven"] = return_chart["midheaven"]
    
    from datetime import datetime
    return_dt_parsed = datetime.fromisoformat(return_chart["return_datetime_utc"].replace("Z", "+00:00"))
    aspects = find_aspects(all_positions, config, return_dt_parsed)
    patterns = detect_patterns(aspects)
    
    return_chart["aspects"] = [
        {
            "body1": a.body1,
            "body2": a.body2,
            "aspect": a.aspect,
            "orb_deg": a.orb_deg,
            "applying": a.applying,
        }
        for a in aspects
    ]
    return_chart["patterns"] = patterns
    
    return return_chart


def main():
    """Generate all golden master files."""
    output_dir = Path("data/golden_masters")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    for test_case in TEST_CASES:
        name = test_case["name"]
        
        if "natal" in name:
            result = generate_natal_golden_master(test_case)
        elif "transit" in name:
            result = generate_transit_golden_master(test_case)
        elif "progression" in name:
            result = generate_progression_golden_master(test_case)
        elif "solar_return" in name:
            result = generate_solar_return_golden_master(test_case)
        else:
            continue
        
        output_file = output_dir / f"{name}.json"
        with open(output_file, "w") as f:
            json.dump(result, f, indent=2, default=str)
        
        print(f"Generated: {output_file}")
    
    print(f"\nGolden masters generated in {output_dir}")


if __name__ == "__main__":
    main()

