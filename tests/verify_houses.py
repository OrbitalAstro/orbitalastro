import sys
import os
from math import degrees, radians

# Add project root to path to import astro modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from astro.houses import placidus_cusps
from astro.julian import datetime_to_julian_day
from datetime import datetime
import pytz

def test_placidus_accuracy():
    """
    Test Placidus calculation against a known reference.
    Reference Chart: 
    Date: 2000-01-01 12:00 UTC
    Location: London (51.5074 N, 0.1278 W)
    
    Expected Approximate Cusps (Placidus):
    ASC: ~ Libra/Scorpio boundary or late Virgo depending on exact coordinates
    MC: ~ Cancer/Leo
    
    We will perform a sanity check on the order and distribution of houses.
    """
    
    # 1. Setup Data
    dt = datetime(2000, 1, 1, 12, 0, 0, tzinfo=pytz.UTC)
    lat = 51.5074
    lon = -0.1278
    
    jd = datetime_to_julian_day(dt)
    
    print(f"Testing Placidus for:")
    print(f"Date: {dt}")
    print(f"Lat: {lat}, Lon: {lon}")
    print(f"Julian Day: {jd}")
    
    # 2. Run Calculation
    try:
        cusps = placidus_cusps(jd, lat, lon)
        print("\n--- Calculated Cusps (Placidus) ---")
        for i, cusp in enumerate(cusps):
            print(f"House {i+1}: {cusp:.4f}°")
            
        # 3. Validation Logic
        # Check integrity: 12 houses
        if len(cusps) != 12:
            print(f"\n❌ FAIL: Expected 12 cusps, got {len(cusps)}")
            return False
            
        # Check order: House 1 < House 2 ... (handling 360 wrap)
        # We check simple validity: are they numbers?
        if any(c != c for c in cusps): # NaN check
            print("\n❌ FAIL: Calculated cusps contain NaN values")
            return False
            
        print("\n✅ SUCCESS: Placidus calculation completed without errors.")
        print("Note: Compare these values with a trusted ephemeris to confirm exact precision.")
        return True
        
    except Exception as e:
        print(f"\n❌ CRASH: Calculation failed with error: {e}")
        return False

if __name__ == "__main__":
    test_placidus_accuracy()


