## 2026-04-24 - Aspect Detection Optimization
**Learning:** Astronomical calculations using `pyswisseph` (like `get_positions_from_swisseph`) are computationally expensive. Calling them inside nested loops (like the $O(N^2)$ aspect detection loop) causes severe performance degradation (e.g. from 0.1s to 1.6s).
**Action:** When working with ephemeris calculations across multiple celestial bodies, always calculate future positions once (memoization/lazy initialization) at the top level and pass the dictionary down to utility functions instead of re-evaluating for every body pair.
