from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime
import swisseph as swe
import os
import math

# Initialisation de FastAPI
app = FastAPI(
    title="OrbitalAstro API",
    description="API pour accéder aux données astrologiques via Swiss Ephemeris",
    version="1.0.1"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifiez les domaines autorisés
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Fonction pour convertir une date et une heure en jour julien
def get_julian_day(date_str: str, time_str: str = "12:00:00") -> float:
    try:
        dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M:%S")
        utc = dt.hour + dt.minute/60.0 + dt.second/3600.0
        jul_day = swe.julday(dt.year, dt.month, dt.day, utc, swe.GREG_CAL)
        return jul_day
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Format de date ou heure invalide. Utilisez YYYY-MM-DD et HH:MM:SS. Erreur: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur lors de la conversion de la date: {str(e)}")

# Liste des planètes
PLANETS = {
    "Sun": swe.SUN,
    "Moon": swe.MOON,
    "Mercury": swe.MERCURY,
    "Venus": swe.VENUS,
    "Mars": swe.MARS,
    "Jupiter": swe.JUPITER,
    "Saturn": swe.SATURN,
    "Uranus": swe.URANUS,
    "Neptune": swe.NEPTUNE,
    "Pluto": swe.PLUTO
}

@app.get("/")
async def root():
    return {
        "message": "Bienvenue sur l'API OrbitalAstro",
        "version": "1.0.1",
        "endpoints": {
            "planets": "/planets",
            "houses": "/houses",
            "aspects": "/aspects",
            "all": "/all"
        }
    }

@app.get("/planets")
async def get_planets(
    date: str, 
    time: str = "12:00:00", 
    planets: Optional[str] = None
):
    """Récupère les positions des planètes"""
    jul_day = get_julian_day(date, time)
    
    if planets:
        requested_planets = [p.strip() for p in planets.split(",")]
        invalid_planets = [p for p in requested_planets if p not in PLANETS]
        if invalid_planets:
            raise HTTPException(status_code=400, detail=f"Planètes invalides: {', '.join(invalid_planets)}")
        target_planets = {name: pid for name, pid in PLANETS.items() if name in requested_planets}
    else:
        target_planets = PLANETS
        
    results = []
    for name, pid in target_planets.items():
        try:
            xx, ret = swe.calc_ut(jul_day, pid, swe.FLG_SPEED)
            if ret < 0:
                raise HTTPException(status_code=500, detail=f"Erreur lors du calcul de {name}. Code: {ret}")
            results.append({
                "planet": name,
                "longitude": xx[0],
                "latitude": xx[1],
                "distance": xx[2],
                "speed_longitude": xx[3]
            })
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erreur lors du calcul de {name}: {str(e)}")
    return results

@app.get("/houses")
async def get_houses(
    date: str,
    latitude: float,
    longitude: float,
    time: str = "12:00:00",
    system: str = "P"
):
    """Récupère les maisons astrologiques"""
    if latitude < -90 or latitude > 90:
        raise HTTPException(status_code=400, detail="Latitude doit être entre -90 et 90 degrés")
    if longitude < -180 or longitude > 180:
        raise HTTPException(status_code=400, detail="Longitude doit être entre -180 et 180 degrés")

    jul_day = get_julian_day(date, time)

    # 🌍 Conversion locale → UTC approximative
    utc_offset = longitude / 15.0 * -1  # 15° = 1 heure
    jul_day_utc = jul_day - (utc_offset / 24.0)

    valid_systems = ["P", "K", "R", "C", "E", "W", "X", "H", "T", "B", "V", "A", "M", "N", "O", "F", "G", "I", "J", "L", "S", "U", "Y", "Z"]
    if system not in valid_systems:
        raise HTTPException(status_code=400, detail=f"Système invalide. Valides: {', '.join(valid_systems)}")

    hsys = system.encode("ascii")

        try:
        cusps, ascmc = swe.houses(jul_day_utc, latitude, longitude, hsys)
        if cusps is None or len(cusps) < 13:
            raise ValueError("Aucune cuspide valide retournée")
    except Exception as e:
        # 🔍 Log clair et retour complet de l’erreur
        print("ERREUR SWISSEPH:", e)
        raise HTTPException(status_code=500, detail=f"Erreur lors du calcul des maisons: {repr(e)}")


    houses_list = [{"house_number": i, "longitude": cusps[i]} for i in range(1, 13)]
    return houses_list

@app.get("/aspects")
async def get_aspects(
    date: str,
    time: str = "12:00:00",
    orb_tolerance: float = 1.0
):
    """Récupère les aspects entre planètes"""
    if orb_tolerance < 0.1 or orb_tolerance > 5.0:
        raise HTTPException(status_code=400, detail="orb_tolerance doit être entre 0.1 et 5.0")
    
    planet_positions = await get_planets(date, time)
    if len(planet_positions) < 2:
        return []
    
    aspects_list = []
    ASPECT_defs = {
        "Conjunction": (0, 8.0),
        "Sextile": (60, 6.0),
        "Square": (90, 7.0),
        "Trine": (120, 7.0),
        "Opposition": (180, 8.0)
    }
    seen_aspects = set()
    for i in range(len(planet_positions)):
        p1 = planet_positions[i]
        for j in range(i + 1, len(planet_positions)):
            p2 = planet_positions[j]
            diff = abs(p1["longitude"] - p2["longitude"])
            if diff > 180:
                diff = 360 - diff
            for asp_name, (angle, base_orb) in ASPECT_defs.items():
                orb = base_orb * orb_tolerance
                angle_diff = abs(diff - angle)
                if angle_diff <= orb:
                    aspect_key = tuple(sorted([p1["planet"], p2["planet"]]) + [asp_name])
                    if aspect_key not in seen_aspects:
                        seen_aspects.add(aspect_key)
                        aspects_list.append({
                            "planet1": p1["planet"],
                            "planet2": p2["planet"],
                            "aspect_name": asp_name,
                            "orb": round(angle_diff, 2)
                        })
                        break
    return aspects_list

@app.get("/all")
async def get_all_data(
    date: str,
    time: str = "12:00:00",
    latitude: Optional[float] = None,
    longitude: Optional[float] = None,
    system: str = "P",
    orb_tolerance: float = 1.0
):
    """Récupère toutes les données astrologiques"""
    if (latitude is not None and longitude is None) or (latitude is None and longitude is not None):
        raise HTTPException(status_code=400, detail="Si vous fournissez latitude ou longitude, fournissez les deux.")
    
    jul_day = get_julian_day(date, time)
    try:
        planets_data = await get_planets(date, time)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur planètes: {str(e)}")
    
    houses_data = []
    if latitude is not None and longitude is not None:
        try:
            houses_data = await get_houses(date, latitude, longitude, time, system)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erreur maisons: {str(e)}")
        
    try:
        aspects_data = await get_aspects(date, time, orb_tolerance)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur aspects: {str(e)}")
    
    return {
        "date": date,
        "time": time,
        "julian_day": round(jul_day, 6),
        "planets": planets_data,
        "houses": houses_data,
        "aspects": aspects_data
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
