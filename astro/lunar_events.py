# SPDX-License-Identifier: AGPL-3.0-only

"""Prochaines lunaisons (nouvelle / pleine lune) via élongation Soleil–Lune (Swiss Ephemeris)."""

from __future__ import annotations

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


def _elong_err_to_target(elong: float, target_elong: float) -> float:
    """Écart signé elong - target dans (-180, 180] ; zéro à l'instant exact cible."""
    return (elong - target_elong + 540.0) % 360.0 - 180.0


def _bisect_lunar(target_elong: float, jd_lo: float, jd_hi: float, iterations: int = 56) -> float:
    """jd_lo / jd_hi encadrent un passage de l'erreur d'élongation par zéro."""
    for _ in range(iterations):
        mid = (jd_lo + jd_hi) * 0.5
        e_mid = _elongation_deg(mid)
        err_mid = _elong_err_to_target(e_mid, target_elong)
        e_lo = _elongation_deg(jd_lo)
        err_lo = _elong_err_to_target(e_lo, target_elong)
        if err_lo == 0.0:
            return jd_lo
        if err_mid == 0.0:
            return mid
        if (err_lo < 0.0 and err_mid < 0.0) or (err_lo > 0.0 and err_mid > 0.0):
            jd_lo = mid
        else:
            jd_hi = mid
    return (jd_lo + jd_hi) * 0.5


def _find_next_lunar_exact(from_dt_utc: datetime, target_elong: float, max_days: float = 450.0) -> Optional[float]:
    """
    Retourne le JD (UT) de la prochaine occurrence où l'élongation vaut target_elong (0 ou 180),
    strictement après from_dt_utc.
    """
    from_dt_utc = from_dt_utc.astimezone(timezone.utc)
    jd0 = datetime_to_julian_day(from_dt_utc)
    step = 6.0 / 24.0
    jd_end = jd0 + max_days
    jd = jd0
    prev_e = _elongation_deg(jd0)
    prev_err = _elong_err_to_target(prev_e, target_elong)
    prev_jd = jd0

    while jd < jd_end:
        jd += step
        e = _elongation_deg(jd)
        err = _elong_err_to_target(e, target_elong)
        # Passage par zéro : changement de signe de l'erreur (hors plat)
        if prev_err < 0.0 and err >= 0.0:
            return _bisect_lunar(target_elong, prev_jd, jd)
        prev_jd, prev_e, prev_err = jd, e, err
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
    target_elong = 180.0 if event == "full_moon" else 0.0
    scanned: List[LunarHit] = []
    cursor = from_dt_utc + timedelta(seconds=30)

    wanted = normalize_moon_sign_token(moon_sign_en) if moon_sign_en else None

    for _ in range(max_moons_to_scan):
        jd_next = _find_next_lunar_exact(cursor, target_elong)
        if jd_next is None:
            break
        hit = _hit_from_jd(jd_next, event)
        scanned.append(hit)
        if wanted is None or hit.moon_sign_en == wanted:
            return hit, scanned
        cursor = hit.exact_utc + timedelta(hours=2)

    return None, scanned
