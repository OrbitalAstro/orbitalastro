from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from flatlib.chart import Chart
from flatlib.datetime import Datetime
from flatlib.geopos import GeoPos
from flatlib import const
import math

app = FastAPI(title="OrbitalAstro API (Flatlib)", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PLANETS = [
    const.SUN, const.MOON, const.MERCURY, const.VENUS, const.MARS,
    const.JUPITER, const.SATURN, const.URANUS, const.NEPTUNE, const.PLUTO
]

ASPECTS = {
    "Conjunction": 0,
    "Sextile": 60,
    "Square": 90,
    "Trine": 120,
    "Opposition": 180
}

def make_chart(date: str, time: str, latitude: float, longitude: float):
    try:
        dt = Datetime(date, time, "+00:00")  # UTC
        pos = GeoPos(str(latitude), str(longitude))
        chart = Chart(dt, pos)
        return chart
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur création du thème: {e}")

@app.get("/")
async def root():
    return {
        "message": "Bienvenue sur OrbitalAstro API (Flatlib)",
        "version": "2.0",
        "endpoints": ["/planets", "/houses", "/aspects", "/all"]
    }

@app.get("/planets")
async def get_planets(date: str, time: str = "12:00", latitude: float = 0.0, longitude: float = 0.0):
    chart = make_chart(date, time, latitude, longitude)
    results = []
    for name in PLANETS:
        obj = chart.getObject(name)
        results.append({
            "planet": name,
            "sign": obj.sign,
            "longitude": obj.lon,
            "latitude": obj.lat,
            "house": obj.house
        })
    return results

@app.get("/houses")
async def get_houses(date: str, time: str = "12:00", latitude: float = 0.0, longitude: float = 0.0):
    chart = make_chart(date, time, latitude, longitude)
    houses = []
    for i, cusp in enumerate(chart.houses.cusps):
        houses.append({"house_number": i + 1, "longitude": cusp})
    return houses

@app.get("/aspects")
async def get_aspects(date: str, time: str = "12:00", latitude: float = 0.0, longitude: float = 0.0, orb_tolerance: float = 6.0):
    chart = make_chart(date, time, latitude, longitude)
    results = []
    for i in range(len(PLANETS)):
        for j in range(i + 1, len(PLANETS)):
            p1, p2 = chart.getObject(PLANETS[i]), chart.getObject(PLANETS[j])
            diff = abs(p1.lon - p2.lon)
            if diff > 180:
                diff = 360 - diff
            for name, angle in ASPECTS.items():
                orb = abs(diff - angle)
                if orb <= orb_tolerance:
                    results.append({
                        "planet1": p1.id,
                        "planet2": p2.id,
                        "aspect_name": name,
                        "orb": round(orb, 2)
                    })
    return results

@app.get("/all")
async def get_all(date: str, time: str = "12:00", latitude: float = 0.0, longitude: float = 0.0):
    chart = make_chart(date, time, latitude, longitude)
    return {
        "date": date,
        "time": time,
        "planets": await get_planets(date, time, latitude, longitude),
        "houses": await get_houses(date, time, latitude, longitude),
        "aspects": await get_aspects(date, time, latitude, longitude),
    }
