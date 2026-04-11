# SPDX-License-Identifier: AGPL-3.0-only

from __future__ import annotations

import argparse
from dataclasses import dataclass
from datetime import datetime
from zoneinfo import ZoneInfo

import swisseph as swe


SIGNS_EN = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces",
]

SIGNS_FR = {
    "Aries": "Bélier",
    "Taurus": "Taureau",
    "Gemini": "Gémeaux",
    "Cancer": "Cancer",
    "Leo": "Lion",
    "Virgo": "Vierge",
    "Libra": "Balance",
    "Scorpio": "Scorpion",
    "Sagittarius": "Sagittaire",
    "Capricorn": "Capricorne",
    "Aquarius": "Verseau",
    "Pisces": "Poissons",
}

HOUSE_SYSTEM_TO_SWISSEPH_CODE = {
    "placidus": "P",
    "whole_sign": "W",
    "equal": "E",
    "koch": "K",
    "porphyry": "O",
    "regiomontanus": "R",
    "campanus": "C",
    "alcabitius": "B",
    "meridian": "X",
    "topocentric": "T",
}


def _normalize_deg(deg: float) -> float:
    return float(deg % 360.0)


def _sign_from_longitude(longitude_deg: float) -> str:
    lon = _normalize_deg(longitude_deg)
    return SIGNS_EN[int(lon // 30) % 12]


def _house_number_for_longitude(longitude_deg: float, cusps_deg: list[float]) -> int:
    if len(cusps_deg) != 12:
        raise ValueError(f"Expected 12 cusps, got {len(cusps_deg)}")

    lon_norm = _normalize_deg(longitude_deg)
    cusps_norm = [_normalize_deg(c) for c in cusps_deg]

    for index in range(12):
        start = cusps_norm[index]
        end = cusps_norm[(index + 1) % 12]

        if start <= end:
            if start <= lon_norm < end:
                return index + 1
        else:
            if lon_norm >= start or lon_norm < end:
                return index + 1

    for index in range(12):
        if abs(lon_norm - cusps_norm[index]) < 0.0001:
            return index + 1

    return 12


def _format_lon(longitude_deg: float) -> str:
    lon = _normalize_deg(longitude_deg)
    sign = _sign_from_longitude(lon)
    sign_fr = SIGNS_FR.get(sign, sign)
    deg_in_sign = lon % 30.0
    return f"{lon:.6f}° ({sign_fr} {deg_in_sign:.3f}°)"


@dataclass(frozen=True)
class Inputs:
    date: str
    time: str
    timezone: str
    latitude: float
    longitude: float
    house_system: str


def _parse_inputs() -> Inputs:
    parser = argparse.ArgumentParser(
        description="Swiss Ephemeris reference calculation (ASC/Vertex/Part of Fortune)."
    )
    parser.add_argument("--date", default="2007-01-14", help="YYYY-MM-DD")
    parser.add_argument("--time", default="16:08", help="HH:MM (local time)")
    parser.add_argument("--timezone", default="America/Toronto", help="IANA timezone name")
    parser.add_argument("--latitude", type=float, default=45.2037, help="Latitude in degrees")
    parser.add_argument("--longitude", type=float, default=-72.7475, help="Longitude in degrees (west negative)")
    parser.add_argument(
        "--house-system",
        default="placidus",
        choices=sorted(HOUSE_SYSTEM_TO_SWISSEPH_CODE.keys()),
        help="House system",
    )
    args = parser.parse_args()
    return Inputs(
        date=args.date,
        time=args.time,
        timezone=args.timezone,
        latitude=args.latitude,
        longitude=args.longitude,
        house_system=args.house_system,
    )


def main() -> None:
    inputs = _parse_inputs()

    tz = ZoneInfo(inputs.timezone)
    local_dt = datetime.strptime(f"{inputs.date} {inputs.time}", "%Y-%m-%d %H:%M").replace(tzinfo=tz)
    utc_dt = local_dt.astimezone(ZoneInfo("UTC"))
    ut_hours = (
        utc_dt.hour
        + utc_dt.minute / 60.0
        + utc_dt.second / 3600.0
        + utc_dt.microsecond / 3_600_000_000.0
    )

    jd_ut = float(swe.julday(utc_dt.year, utc_dt.month, utc_dt.day, ut_hours))

    flags = swe.FLG_SWIEPH
    sun_lon = float(swe.calc_ut(jd_ut, swe.SUN, flags)[0][0])
    moon_lon = float(swe.calc_ut(jd_ut, swe.MOON, flags)[0][0])

    hs_code = HOUSE_SYSTEM_TO_SWISSEPH_CODE.get(inputs.house_system, "P")
    cusps, ascmc = swe.houses(jd_ut, inputs.latitude, inputs.longitude, hs_code.encode("ascii"))

    asc = float(ascmc[0])
    mc = float(ascmc[1])
    vertex = float(ascmc[3])

    cusps_list = [float(c) for c in cusps]  # 1..12
    sun_house = _house_number_for_longitude(sun_lon, cusps_list)
    is_day_chart = sun_house >= 7

    if is_day_chart:
        pof = _normalize_deg(asc + moon_lon - sun_lon)
        pof_formula = "ASC + Moon - Sun (jour)"
    else:
        pof = _normalize_deg(asc + sun_lon - moon_lon)
        pof_formula = "ASC + Sun - Moon (nuit)"

    pof_house = _house_number_for_longitude(pof, cusps_list)
    vertex_house = _house_number_for_longitude(vertex, cusps_list)

    print("=== Swiss Ephemeris reference ===")
    print(f"Timezone local : {inputs.timezone}")
    print(f"Local datetime : {local_dt.isoformat()}")
    print(f"UTC datetime   : {utc_dt.isoformat()}")
    print(f"Latitude/Long. : {inputs.latitude}, {inputs.longitude}")
    print(f"House system   : {inputs.house_system} (swe '{hs_code}')")
    print(f"JD (UT)        : {jd_ut:.10f}")
    print("")
    print(f"Sun  (swe.calc_ut) : {_format_lon(sun_lon)} | House {sun_house}")
    print(f"Moon (swe.calc_ut) : {_format_lon(moon_lon)}")
    print("")
    print(f"ASC    (swe.houses) : {_format_lon(asc)}")
    print(f"MC     (swe.houses) : {_format_lon(mc)}")
    print(f"Vertex (swe.houses) : {_format_lon(vertex)} | House {vertex_house}")
    print("")
    print(f"Day chart? : {is_day_chart} (Sun in house {sun_house})")
    print(f"Part of Fortune = {pof_formula}")
    if is_day_chart:
        print(f"  = {_normalize_deg(asc):.6f} + {_normalize_deg(moon_lon):.6f} - {_normalize_deg(sun_lon):.6f}")
    else:
        print(f"  = {_normalize_deg(asc):.6f} + {_normalize_deg(sun_lon):.6f} - {_normalize_deg(moon_lon):.6f}")
    print(f"  = {_format_lon(pof)} | House {pof_house}")


if __name__ == "__main__":
    main()

