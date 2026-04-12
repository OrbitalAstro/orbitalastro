# SPDX-License-Identifier: AGPL-3.0-only

"""Recherche des prochains passages proches de l'exact pour transits planète → point natal."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple

from astro.aspects import AspectConfig
from astro.julian import datetime_to_julian_day
from astro.swisseph_positions import get_positions_from_swisseph

# Pas de scan : corps rapides vs lents (équilibre précision / coût éphemerides)
_SCAN_STEP_HOURS: Dict[str, float] = {
    "moon": 2.0,
    "sun": 12.0,
    "mercury": 8.0,
    "venus": 12.0,
    "mars": 24.0,
    "jupiter": 72.0,
    "saturn": 120.0,
    "uranus": 336.0,  # 14 j
    "neptune": 336.0,
    "pluto": 504.0,  # 21 j
    "true_node": 24.0,
    "chiron": 48.0,
}


def _ensure_utc(dt: datetime) -> datetime:
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc)


def _angular_separation_deg(lon1: float, lon2: float) -> float:
    d = abs(lon1 - lon2) % 360.0
    return d if d <= 180.0 else 360.0 - d


def _orb_to_aspect_deg(transit_lon: float, natal_lon: float, aspect_angle: float) -> float:
    return abs(_angular_separation_deg(transit_lon, natal_lon) - aspect_angle)


def _orb_at(
    dt_utc: datetime,
    transiting_body: str,
    natal_longitude: float,
    aspect_angle: float,
) -> float:
    jd = datetime_to_julian_day(dt_utc)
    positions = get_positions_from_swisseph(dt_utc, jd)
    key = transiting_body.lower()
    if key not in positions:
        return 999.0
    return _orb_to_aspect_deg(positions[key], natal_longitude, aspect_angle)


def _golden_refine_minimum(
    t_lo: datetime,
    t_hi: datetime,
    transiting_body: str,
    natal_longitude: float,
    aspect_angle: float,
    iterations: int = 42,
) -> Tuple[datetime, float]:
    """Minimise l'orbe sur [t_lo, t_hi] (UTC) par recherche type golden section sur le temps."""
    lo = t_lo.timestamp()
    hi = t_hi.timestamp()
    if hi <= lo:
        dt = _ensure_utc(t_lo)
        return dt, _orb_at(dt, transiting_body, natal_longitude, aspect_angle)

    phi = (1 + 5**0.5) / 2
    resphi = 2 - phi

    for _ in range(iterations):
        if hi - lo < 60:  # moins d'une minute
            break
        d = hi - lo
        m1 = lo + resphi * d
        m2 = hi - resphi * d
        dt1 = datetime.fromtimestamp(m1, tz=timezone.utc)
        dt2 = datetime.fromtimestamp(m2, tz=timezone.utc)
        o1 = _orb_at(dt1, transiting_body, natal_longitude, aspect_angle)
        o2 = _orb_at(dt2, transiting_body, natal_longitude, aspect_angle)
        if o1 < o2:
            hi = m2
        else:
            lo = m1

    mid = (lo + hi) / 2.0
    best_dt = datetime.fromtimestamp(mid, tz=timezone.utc)
    best_orb = _orb_at(best_dt, transiting_body, natal_longitude, aspect_angle)
    # Vérifier les bornes
    for edge_ts in (t_lo.timestamp(), t_hi.timestamp()):
        edt = datetime.fromtimestamp(edge_ts, tz=timezone.utc)
        eo = _orb_at(edt, transiting_body, natal_longitude, aspect_angle)
        if eo < best_orb:
            best_dt, best_orb = edt, eo
    return best_dt, best_orb


def _natal_longitude_for_target(
    natal_body_key: str,
    natal_positions: Dict[str, float],
    angle_longitudes: Optional[Dict[str, float]],
) -> Optional[float]:
    k = natal_body_key.lower().strip()
    if natal_positions and k in natal_positions:
        return float(natal_positions[k])
    if angle_longitudes:
        if k in angle_longitudes:
            return float(angle_longitudes[k])
        # alias éventuels
        alias = {
            "ascendant": "asc",
            "asc": "asc",
            "mc": "mc",
            "midheaven": "mc",
            "ic": "ic",
            "dsc": "dsc",
            "descendant": "dsc",
        }
        mapped = alias.get(k)
        if mapped and mapped in angle_longitudes:
            return float(angle_longitudes[mapped])
    return None


def _effective_horizon_days(transiting_body: str, horizon_days: int) -> int:
    """La Lune exige un pas fin : on limite l'horizon pour rester raisonnable en calculs."""
    b = transiting_body.lower()
    if b == "moon":
        return min(horizon_days, 120)
    if b in ("sun", "mercury", "venus", "mars"):
        return min(horizon_days, 365)
    return horizon_days


def find_next_exact_for_transit(
    transiting_body: str,
    natal_body_key: str,
    aspect_name: str,
    natal_positions: Dict[str, float],
    angle_longitudes: Optional[Dict[str, float]],
    from_utc: datetime,
    horizon_days: int,
    config: Optional[AspectConfig] = None,
    max_orb_report_deg: float = 1.25,
) -> Optional[Dict]:
    """
    Trouve le prochain creux d'orbe (proche de l'exact) pour un transit donné, après from_utc.

    Retourne un dict avec exact_utc (ISO), min_orb_deg, ou None si rien de satisfaisant dans l'horizon.
    """
    if config is None:
        config = AspectConfig()
    aspect_name_l = aspect_name.lower()
    if aspect_name_l not in config.major_aspects:
        return None
    aspect_angle = config.major_aspects[aspect_name_l]

    natal_lon = _natal_longitude_for_target(natal_body_key, natal_positions, angle_longitudes)
    if natal_lon is None:
        return None

    from_utc = _ensure_utc(from_utc)
    horizon_days = _effective_horizon_days(transiting_body, horizon_days)
    end = from_utc + timedelta(days=horizon_days)
    body_key = transiting_body.lower()
    step_hours = _SCAN_STEP_HOURS.get(body_key, 48.0)
    step = timedelta(hours=step_hours)

    t0 = from_utc
    o0 = _orb_at(t0, body_key, natal_lon, aspect_angle)
    t1 = t0 + step

    while t1 <= end:
        o1 = _orb_at(t1, body_key, natal_lon, aspect_angle)
        t2 = t1 + step
        if t2 > end:
            break
        o2 = _orb_at(t2, body_key, natal_lon, aspect_angle)

        # Creux local (échantillonnage grossier) → premier passage proche de l'exact dans le temps
        if o1 <= o0 and o1 <= o2:
            refined_dt, refined_orb = _golden_refine_minimum(
                t0, t2, body_key, natal_lon, aspect_angle
            )
            if refined_orb <= max_orb_report_deg and refined_dt >= from_utc:
                return {
                    "transiting_body": body_key,
                    "natal_body": natal_body_key,
                    "aspect": aspect_name_l,
                    "exact_utc": refined_dt.isoformat().replace("+00:00", "Z"),
                    "min_orb_deg": round(refined_orb, 4),
                }

        t0, o0 = t1, o1
        t1 = t2

    return None


def find_next_exacts_for_hints(
    hints: List[Dict[str, str]],
    natal_positions: Dict[str, float],
    angle_longitudes: Optional[Dict[str, float]],
    from_utc: datetime,
    horizon_days: int = 540,
    config: Optional[AspectConfig] = None,
) -> List[Dict]:
    """
    hints: [{"transiting_body": "saturn", "natal_body": "sun", "aspect": "square"}, ...]
    """
    seen = set()
    out: List[Dict] = []
    for h in hints:
        tb = (h.get("transiting_body") or "").strip().lower()
        nb = (h.get("natal_body") or "").strip().lower()
        asp = (h.get("aspect") or "").strip().lower()
        if not tb or not nb or not asp:
            continue
        key = (tb, nb, asp)
        if key in seen:
            continue
        seen.add(key)
        hit = find_next_exact_for_transit(
            tb,
            nb,
            asp,
            natal_positions,
            angle_longitudes,
            from_utc,
            horizon_days,
            config=config,
        )
        if hit:
            out.append(hit)
    return out
