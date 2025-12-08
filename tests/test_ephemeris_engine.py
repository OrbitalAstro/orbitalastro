import json
from pathlib import Path

import pytest

from api.natal import NatalRequest, natal_chart


@pytest.mark.asyncio
@pytest.mark.parametrize("case_index", [0, 1])
async def test_against_golden_master(case_index: int) -> None:
    golden_path = Path("tests/golden_master.json")
    payload = json.loads(golden_path.read_text(encoding="utf-8"))
    case = payload["cases"][case_index]

    birth_datetime = case["datetime_utc"]
    time_only = birth_datetime.split("T")[1].replace("Z", "")
    request = NatalRequest(
        birth_date=case["datetime_utc"].split("T")[0],
        birth_time=time_only,
        latitude=case["latitude"],
        longitude=case["longitude"],
        timezone="UTC",
    )

    response = await natal_chart(request)

    for planet, expected_longitude in case["planets"].items():
        actual = response.planets[planet].longitude
        assert abs(actual - expected_longitude) < 0.2, f"{planet} longitude drift"

    assert len(response.houses) == 12
