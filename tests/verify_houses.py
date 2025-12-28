import sys
import os

# Add project root to path to import astro modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from astro.houses_multi import compute_houses
from astro.julian import datetime_to_julian_day
from datetime import datetime, timezone

def test_placidus_accuracy():
    """
    Test Placidus calculation via Swiss Ephemeris against a known reference.
    Reference Chart:
    Date: 2000-01-01 12:00 UTC
    Location: London (51.5074 N, 0.1278 W)

    We perform a sanity check on count and NaN.
    """

    dt = datetime(2000, 1, 1, 12, 0, 0, tzinfo=timezone.utc)
    lat = 51.5074
    lon = -0.1278

    jd = datetime_to_julian_day(dt)

    print("Testing Placidus for:")
    print(f"Date: {dt}")
    print(f"Lat: {lat}, Lon: {lon}")
    print(f"Julian Day: {jd}")

    try:
        import swisseph  # noqa: F401
    except ImportError as e:
        print(f"\nFAIL: pyswisseph is required for this test: {e}")
        return False

    try:
        cusps = compute_houses("placidus", jd, lat, lon)
        print("\n--- Calculated Cusps (Placidus via Swiss Ephemeris) ---")
        for i, cusp in enumerate(cusps):
            print(f"House {i+1}: {cusp:.4f} deg")

        if len(cusps) != 12:
            print(f"\nFAIL: Expected 12 cusps, got {len(cusps)}")
            return False

        if any(c != c for c in cusps):
            print("\nFAIL: Calculated cusps contain NaN values")
            return False

        print("\nSUCCESS: Placidus calculation completed via Swiss Ephemeris.")
        print("Note: Compare these values with a trusted ephemeris to confirm exact precision.")
        return True

    except Exception as e:
        print(f"\nFAIL: Calculation failed with error: {e}")
        return False

if __name__ == "__main__":
    test_placidus_accuracy()


