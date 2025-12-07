from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from flatlib.chart import Chart
from flatlib.datetime import Datetime
from flatlib.geopos import GeoPos
from flatlib import const

# ---------------------------
# Initialisation de l'application
# ---------------------------
app = FastAPI(
    title="OrbitalAstro API (Flatlib)",
    description="API astrologique utilisant Flatlib (compatible Render)",
    version="2.0"
)

# ---------------------------
# Configuration CORS
# ---------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------
# Données de base
# ---------------------------
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

# ---------------------------
# Fonctions utilitaires
# ---------------------------
def make_chart(date: str, time: str, latitude: float, longitude: float):
    """Crée la carte du ciel pour la date et position données."""
    try:
        dt = Datetime(date, time, "+00:00")  # UTC
        pos = GeoPos(str(latitude), str(longitude))
        chart = Chart(dt, pos)
        return chart
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur création du thème: {e}")

# ---------------------------
# Endpoints principaux
# ---------------------------
@app.get("/")
async def root():
    return {
        "message": "Bienvenue sur OrbitalAstro API (Flatlib)",
        "version": "2.0",
        "endpoints": ["/planets", "/houses", "/aspects", "/all", "/debug"]
    }

@app.get("/planets")
async def get_planets(
    date: str,
    time: str = "12:00",
    latitude: float = 0.0,
    longitude: float = 0.0
):
    """Retourne les positions planétaires."""
    chart = make_chart(date, time, latitude, longitude)
    results = []
    for name in PLANETS:
        obj = chart.getObject(name)
        results.append({
            "planet": obj.id,
            "sign": obj.sign,
            "longitude": round(obj.lon, 2),
            "latitude": round(obj.lat, 2),
            "house": obj.house
        })
    return results

@app.get("/houses")
async def get_houses(
    date: str,
    time: str = "12:00",
    latitude: float = 0.0,
    longitude: float = 0.0
):
    """Retourne les cuspides des 12 maisons."""
    chart = make_chart(date, time, latitude, longitude)
    houses = []
    for i, cusp in enumerate(chart.houses.cusps):
        houses.append({"house_number": i + 1, "longitude": round(cusp, 2)})
    return houses

@app.get("/aspects")
async def get_aspects(
    date: str,
    time: str = "12:00",
    latitude: float = 0.0,
    longitude: float = 0.0,
    orb_tolerance: float = 6.0
):
    """Retourne les aspects entre les planètes principales."""
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
async def get_all(
    date: str,
    time: str = "12:00",
    latitude: float = 0.0,
    longitude: float = 0.0
):
    """Retourne planètes, maisons et aspects."""
    return {
        "date": date,
        "time": time,
        "planets": await get_planets(date, time, latitude, longitude),
        "houses": await get_houses(date, time, latitude, longitude),
        "aspects": await get_aspects(date, time, latitude, longitude)
    }

# ---------------------------
# Endpoint DEBUG
# ---------------------------
@app.get("/debug")
async def debug_chart(
    date: str = "2025-12-07",
    time: str = "12:00",
    latitude: float = 45.5,
    longitude: float = -73.6
):
    """Affiche le thème complet (planètes + maisons + aspects) pour validation."""
    chart = make_chart(date, time, latitude, longitude)

    planets_data = [
        {
            "planet": obj.id,
            "sign": obj.sign,
            "longitude": round(obj.lon, 2),
            "latitude": round(obj.lat, 2),
            "house": obj.house
        }
        for obj in chart.objects
    ]

    houses_data = [
        {"house_number": i + 1, "longitude": round(cusp, 2)}
        for i, cusp in enumerate(chart.houses.cusps)
    ]

    aspects_data = []
    for i in range(len(PLANETS)):
        for j in range(i + 1, len(PLANETS)):
            p1, p2 = chart.getObject(PLANETS[i]), chart.getObject(PLANETS[j])
            diff = abs(p1.lon - p2.lon)
            if diff > 180:
                diff = 360 - diff
            for name, angle in ASPECTS.items():
                orb = abs(diff - angle)
                if orb <= 6:
                    aspects_data.append({
                        "planet1": p1.id,
                        "planet2": p2.id,
                        "aspect_name": name,
                        "orb": round(orb, 2)
                    })

    return {
        "date": date,
        "time": time,
        "latitude": latitude,
        "longitude": longitude,
        "planets": planets_data,
        "houses": houses_data,
        "aspects": aspects_data
    }

# ---------------------------
# Lancement local (optionnel)
# ---------------------------
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=10000)
