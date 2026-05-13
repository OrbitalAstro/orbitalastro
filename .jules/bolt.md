## 2026-04-24 - Aspect Detection Optimization
**Learning:** Astronomical calculations using `pyswisseph` (like `get_positions_from_swisseph`) are computationally expensive. Calling them inside nested loops (like the $O(N^2)$ aspect detection loop) causes severe performance degradation (e.g. from 0.1s to 1.6s).
**Action:** When working with ephemeris calculations across multiple celestial bodies, always calculate future positions once (memoization/lazy initialization) at the top level and pass the dictionary down to utility functions instead of re-evaluating for every body pair.
## 2026-05-08 - Optimize _orb_at specific body position lookup
**Learning:** When calculating an orb for a single transit body over a search space in a loop, using a general purpose get_positions_from_swisseph that computes positions for ALL bodies introduces massive overhead.
**Action:** Query the single body directly using swe.calc_ut instead of loading all celestial bodies.
