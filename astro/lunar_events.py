# SPDX-License-Identifier: AGPL-3.0-only

"""Prochaines lunaisons (nouvelle / pleine lune) via élongation Soleil–Lune (Swiss Ephemeris)."""

from __future__ import annotations

import math
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Tuple

from astro.julian import datetime_to_julian_day, julian_day_to_datetime_utc
from astro.swisseph_positions import get_positions_from_swisseph

SIGN_EN = (
    "aries",
    "taurus",
    "gemini",
    "cancer",
    "leo",
    "virgo",
    "libra",
    "scorpio",
    "sagittarius",
    "capricorn",
    "aquarius",
    "pisces",
)

SIGN_FR = (
    "Bélier",
    "Taureau",
    "Gémeaux",
    "Cancer",
    "Lion",
    "Vierge",
    "Balance",
    "Scorpion",
    "Sagittaire",
    "Capricorne",
    "Verseau",
    "Poissons",
)


def normalize_moon_sign_token(raw: Optional[str]) -> Optional[str]:
    """Accepte EN ou FR (insensible à la casse) ; retourne la clé anglaise ou None."""
    if not raw:
        return None
    s = raw.strip().lower()
    fr_to_en = {
        "bélier": "aries",
        "belier": "aries",
        "taureau": "taurus",
        "gémeaux": "gemini",
        "gemeaux": "gemini",
        "cancer": "cancer",
        "lion": "leo",
        "vierge": "virgo",
        "balance": "libra",
        "scorpion": "scorpio",
        "sagittaire": "sagittarius",
        "capricorne": "capricorn",
        "verseau": "aquarius",
        "poissons": "pisces",
    }
    if s in fr_to_en:
        return fr_to_en[s]
    if s in SIGN_EN:
        return s
    return None


def _moon_sun(jd: float) -> Tuple[float, float]:
    dt = julian_day_to_datetime_utc(jd)
    pos = get_positions_from_swisseph(dt, jd)
    moon = float(pos.get("moon", 0.0)) % 360.0
    sun = float(pos.get("sun", 0.0)) % 360.0
    return moon, sun


def _elongation_deg(jd: float) -> float:
    """Élongation Lune–Soleil [0,360). 0 = nouvelle, 180 = pleine."""
    moon, sun = _moon_sun(jd)
    return (moon - sun + 360.0) % 360.0


def _lunar_scalar_err(jd: float, event: str) -> float:
    """
    Erreur scalaire positive, nulle à l'instant exact.
    1 - cos(elong) pour la nouvelle lune ; 1 + cos(elong) pour la pleine lune.
    Évite la fausse racine « pleine lune » à la nouvelle lune (wrap 0°/360°).
    """
    elong = _elongation_deg(jd)
    rad = math.radians(elong)
    if event == "new_moon":
        return 1.0 - math.cos(rad)
    return 1.0 + math.cos(rad)


def _validate_lunar_root(jd: float, event: str) -> bool:
    """Rejette les racines numériques qui ne correspondent pas à la phase demandée."""
    elong = _elongation_deg(jd)
    if event == "new_moon":
        return elong <= 4.0 or elong >= 356.0
    return 176.0 <= elong <= 184.0


def _bisect_lunar_scalar(event: str, jd_lo: float, jd_hi: float, iterations: int = 56) -> float:
    """jd_lo / jd_hi encadrent un passage de l'erreur scalaire vers zéro."""
    for _ in range(iterations):
        mid = (jd_lo + jd_hi) * 0.5
        err_mid = _lunar_scalar_err(mid, event)
        err_lo = _lunar_scalar_err(jd_lo, event)
        if err_lo <= 1e-14:
            return jd_lo
        if err_mid <= 1e-14:
            return mid
        if err_lo < err_mid:
            jd_hi = mid
        else:
            jd_lo = mid
    return (jd_lo + jd_hi) * 0.5


_LUNAR_CROSS_ERR = 1e-5
_LUNAR_COARSE_STEP_H = 6.0
_LUNAR_REFINE_STEP_MIN = 15.0


def _refine_lunar_minimum_jd(jd_lo: float, jd_hi: float, event: str) -> Optional[float]:
    """Cherche le minimum d'erreur scalaire entre jd_lo et jd_hi (pas de 15 min)."""
    step = _LUNAR_REFINE_STEP_MIN / (24.0 * 60.0)
    best_jd: Optional[float] = None
    best_err = float("inf")
    jd = jd_lo
    while jd <= jd_hi:
        err = _lunar_scalar_err(jd, event)
        if err < best_err:
            best_err = err
            best_jd = jd
        jd += step
    if best_jd is not None and best_err <= _LUNAR_CROSS_ERR and _validate_lunar_root(best_jd, event):
        return best_jd
    if best_jd is not None and best_err <= _LUNAR_CROSS_ERR:
        return _bisect_lunar_scalar(event, max(jd_lo, best_jd - step), min(jd_hi, best_jd + step))
    return None


def _find_previous_lunar_exact(
    from_dt_utc: datetime,
    event: str,
    max_days: float = 50.0,
) -> Optional[float]:
    """JD (UT) de la dernière lunaison valide du type demandé strictement avant from_dt_utc."""
    from_dt_utc = from_dt_utc.astimezone(timezone.utc)
    jd0 = datetime_to_julian_day(from_dt_utc)
    step = _LUNAR_COARSE_STEP_H / 24.0
    jd_limit = jd0 - max_days
    jd = jd0
    prev_jd = jd0
    prev_err = _lunar_scalar_err(jd0, event)

    while jd > jd_limit:
        jd -= step
        err = _lunar_scalar_err(jd, event)
        if prev_err > _LUNAR_CROSS_ERR and err <= _LUNAR_CROSS_ERR:
            jd_exact = _bisect_lunar_scalar(event, jd, prev_jd)
            if _validate_lunar_root(jd_exact, event):
                return jd_exact
        if err > prev_err and prev_err <= _LUNAR_CROSS_ERR * 20.0:
            jd_exact = _refine_lunar_minimum_jd(jd, prev_jd, event)
            if jd_exact is not None and jd_exact < jd0:
                return jd_exact
        prev_jd, prev_err = jd, err
    return None


def _find_next_lunar_exact(
    from_dt_utc: datetime,
    event: str,
    max_days: float = 450.0,
) -> Optional[float]:
    """JD (UT) de la prochaine lunaison valide du type demandé strictement après from_dt_utc."""
    from_dt_utc = from_dt_utc.astimezone(timezone.utc)
    jd0 = datetime_to_julian_day(from_dt_utc)
    step = _LUNAR_COARSE_STEP_H / 24.0
    jd_end = jd0 + max_days
    jd = jd0
    prev_jd = jd0
    prev_err = _lunar_scalar_err(jd0, event)

    while jd < jd_end:
        jd += step
        err = _lunar_scalar_err(jd, event)
        if prev_err > _LUNAR_CROSS_ERR and err <= _LUNAR_CROSS_ERR:
            jd_exact = _bisect_lunar_scalar(event, prev_jd, jd)
            if _validate_lunar_root(jd_exact, event):
                return jd_exact
        if err > prev_err and prev_err <= _LUNAR_CROSS_ERR * 20.0:
            jd_exact = _refine_lunar_minimum_jd(prev_jd, jd, event)
            if jd_exact is not None and jd_exact > jd0:
                return jd_exact
        prev_jd, prev_err = jd, err
    return None


@dataclass
class LunarHit:
    exact_utc: datetime
    jd: float
    event: str  # "full_moon" | "new_moon"
    moon_longitude_deg: float
    sun_longitude_deg: float
    moon_sign_en: str
    moon_sign_fr: str
    sun_sign_fr: str


def _hit_from_jd(jd: float, event: str) -> LunarHit:
    dt = julian_day_to_datetime_utc(jd)
    moon, sun = _moon_sun(jd)
    idx_m = int(moon // 30) % 12
    idx_s = int(sun // 30) % 12
    return LunarHit(
        exact_utc=dt,
        jd=jd,
        event=event,
        moon_longitude_deg=moon,
        sun_longitude_deg=sun,
        moon_sign_en=SIGN_EN[idx_m],
        moon_sign_fr=SIGN_FR[idx_m],
        sun_sign_fr=SIGN_FR[idx_s],
    )


def _collect_lunar_hits(
    from_dt_utc: datetime,
    event: str,
    max_moons_to_scan: int,
) -> List[LunarHit]:
    """Dernière + prochaine lunaison valide, puis balayage pour couvrir filtres par signe."""
    from_dt_utc = from_dt_utc.astimezone(timezone.utc)
    scanned: List[LunarHit] = []
    seen_jd: set[float] = set()

    def add_jd(jd: Optional[float]) -> None:
        if jd is None:
            return
        if not _validate_lunar_root(jd, event):
            return
        key = round(jd, 5)
        if key in seen_jd:
            return
        seen_jd.add(key)
        scanned.append(_hit_from_jd(jd, event))

    add_jd(_find_previous_lunar_exact(from_dt_utc, event))
    add_jd(_find_next_lunar_exact(from_dt_utc, event))

    cursor = from_dt_utc - timedelta(seconds=1)
    for _ in range(max_moons_to_scan):
        jd_prev = _find_previous_lunar_exact(cursor, event)
        if jd_prev is None:
            break
        add_jd(jd_prev)
        cursor = julian_day_to_datetime_utc(jd_prev) - timedelta(hours=2)

    cursor = from_dt_utc + timedelta(seconds=1)
    for _ in range(max_moons_to_scan):
        jd_next = _find_next_lunar_exact(cursor, event)
        if jd_next is None:
            break
        add_jd(jd_next)
        cursor = julian_day_to_datetime_utc(jd_next) + timedelta(hours=2)

    scanned.sort(key=lambda h: abs((h.exact_utc - from_dt_utc).total_seconds()))
    return scanned


_LUNAR_NEAR_DAYS = 45.0


def _nearest_lunar_hit(from_dt_utc: datetime, event: str, max_days: float = _LUNAR_NEAR_DAYS) -> Optional[LunarHit]:
    """Dernière ou prochaine lunaison du type, la plus proche de from_dt_utc."""
    hits: List[LunarHit] = []
    for jd in (
        _find_previous_lunar_exact(from_dt_utc, event, max_days),
        _find_next_lunar_exact(from_dt_utc, event, max_days),
    ):
        if jd is not None:
            hits.append(_hit_from_jd(jd, event))
    if not hits:
        return None
    return min(hits, key=lambda h: abs((h.exact_utc - from_dt_utc).total_seconds()))


def _closest_lunar_phase_hits(from_dt_utc: datetime) -> Tuple[Optional[LunarHit], Optional[LunarHit]]:
    """Nouvelle et pleine lune les plus proches dans le temps (4 recherches max)."""
    return (
        _nearest_lunar_hit(from_dt_utc, "new_moon"),
        _nearest_lunar_hit(from_dt_utc, "full_moon"),
    )


def lunar_event_relevant_utc(
    from_dt_utc: datetime,
    event: str,
    moon_sign_en: Optional[str] = None,
    max_moons_to_scan: int = 36,
    *,
    prefer_current: bool = False,
) -> Tuple[Optional[LunarHit], List[LunarHit], bool]:
    """
    Lunaison pertinente par rapport à from_dt_utc.

    - prefer_current=False : prochaine occurrence après l'instant (comportement historique).
    - prefer_current=True : lunaison **la plus proche dans le temps** pour la phase réelle du ciel ;
      si le type demandé (ex. pleine lune) ne correspond pas à la phase actuelle (ex. nouvelle lune),
      retourne la lunaison réelle et phase_mismatch=True.

    Retour : (hit, scanned, phase_mismatch).
    """
    from_dt_utc = from_dt_utc.astimezone(timezone.utc)
    wanted = normalize_moon_sign_token(moon_sign_en) if moon_sign_en else None

    if prefer_current:
        closest_new, closest_full = _closest_lunar_phase_hits(from_dt_utc)
        candidates = [h for h in (closest_new, closest_full) if h is not None]
        if not candidates:
            return None, [], False
        actual = min(candidates, key=lambda h: abs((h.exact_utc - from_dt_utc).total_seconds()))
        phase_mismatch = actual.event != event

        scanned = [h for h in (closest_new, closest_full) if h is not None]
        if wanted:
            scanned = _collect_lunar_hits(
                from_dt_utc, actual.event, min(8, max_moons_to_scan)
            ) or scanned
            for hit in scanned:
                if hit.moon_sign_en == wanted:
                    return hit, scanned, phase_mismatch
            return None, scanned, phase_mismatch

        return actual, scanned, phase_mismatch

    hit, scanned = next_lunar_event_utc(from_dt_utc, event, moon_sign_en, max_moons_to_scan)
    return hit, scanned, False


def next_lunar_event_utc(
    from_dt_utc: datetime,
    event: str,
    moon_sign_en: Optional[str] = None,
    max_moons_to_scan: int = 36,
) -> Tuple[Optional[LunarHit], List[LunarHit]]:
    """
    Prochaine nouvelle ou pleine lune après from_dt_utc.
    Si moon_sign_en est fourni (ex. 'scorpio'), retourne la première occurrence dont la Lune est dans ce signe.
    Retourne aussi une liste des premières lunaisons scannées (pour message de secours).
    """
    from_dt_utc = from_dt_utc.astimezone(timezone.utc)
    scanned: List[LunarHit] = []
    cursor = from_dt_utc + timedelta(seconds=30)

    wanted = normalize_moon_sign_token(moon_sign_en) if moon_sign_en else None

    for _ in range(max_moons_to_scan):
        jd_next = _find_next_lunar_exact(cursor, event)
        if jd_next is None:
            break
        hit = _hit_from_jd(jd_next, event)
        scanned.append(hit)
        if wanted is None or hit.moon_sign_en == wanted:
            return hit, scanned
        cursor = hit.exact_utc + timedelta(hours=2)

    return None, scanned
