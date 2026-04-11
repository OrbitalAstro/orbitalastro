# SPDX-License-Identifier: AGPL-3.0-only

"""Legacy module - no longer used. All calculations now use Swiss Ephemeris via houses_multi.py.

This file is kept for backward compatibility but is not used in production.
All house and angle calculations are now done exclusively through Swiss Ephemeris.
"""

# This module previously contained pure Python implementations of:
# - compute_asc_mc() - now computed by Swiss Ephemeris via swe.houses()
# - placidus_cusps() - now computed by Swiss Ephemeris via swe.houses()

# All production code now uses:
# - astro.houses_multi.compute_houses() - uses Swiss Ephemeris exclusively
# - astro.swisseph_positions.get_positions_from_swisseph() - uses Swiss Ephemeris exclusively
