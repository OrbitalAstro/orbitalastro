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
    version="1.0.0"
)

# Configuration CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En production, spécifiez les domaines autorisés
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration de Swiss Ephemeris
# Définir le chemin vers les fichiers d'éphémérides si nécessaire
# swe.set_ephe_path('/path/to/ephe')

def get_julian_day(date_str: str, time_str: str = "12:00:00") -> float:
    """Convertit date et heure en jour julien"""
    try:
        dt = datetime.strptime(f"{date_str} {time_str}", "%Y-%m-%d %H:%M:%S")
        # Utilisation de swe.julday avec calcul précis de l'heure UTC
        utc = dt.hour + dt.minute/60.0 + dt.second/3600.0
        # swe.julday(year, month, day, hour, calflag) où calflag = swe.GREG_CAL pour calendrier grégorien
        jul_day = swe.julday(dt.year, dt.month, dt.day, utc, swe.GREG_CAL)
        return jul_day
    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Format de date ou heure invalide. Utilisez YYYY-MM-DD et HH:MM:SS. Erreur: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Erreur lors de la conversion de la date: {str(e)}")

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
        "version": "1.0.0",
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
        # Validation des noms de planètes
        invalid_planets = [p for p in requested_planets if p not in PLANETS]
        if invalid_planets:
            raise HTTPException(
                status_code=400, 
                detail=f"Planètes invalides: {', '.join(invalid_planets)}. Planètes disponibles: {', '.join(PLANETS.keys())}"
            )
        target_planets = {name: pid for name, pid in PLANETS.items() if name in requested_planets}
    else:
        target_planets = PLANETS
        
    results = []
    for name, pid in target_planets.items():
        try:
            # calcul avec indicateur de vitesse (flag FLG_SPEED)
            xx, ret = swe.calc_ut(jul_day, pid, swe.FLG_SPEED)
            if ret < 0:
                # Erreur dans le calcul
                raise HTTPException(
                    status_code=500, 
                    detail=f"Erreur lors du calcul de la position de {name}. Code d'erreur: {ret}"
                )
            results.append({
                "planet": name,
                "longitude": xx[0],
                "latitude": xx[1],
                "distance": xx[2],
                "speed_longitude": xx[3]
            })
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Erreur lors du calcul de la position de {name}: {str(e)}"
            )
        
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
    # Validation des coordonnées géographiques
    if latitude < -90 or latitude > 90:
        raise HTTPException(status_code=400, detail="Latitude doit être entre -90 et 90 degrés")
    if longitude < -180 or longitude > 180:
        raise HTTPException(status_code=400, detail="Longitude doit être entre -180 et 180 degrés")
    
    jul_day = get_julian_day(date, time)
    
    # Validation du système de maisons
    valid_systems = ["P", "K", "R", "C", "E", "W", "X", "H", "T", "B", "V", "A", "M", "N", "O", "F", "G", "I", "J", "L", "S", "U", "Y", "Z"]
    if system not in valid_systems:
        raise HTTPException(status_code=400, detail=f"Système de maisons invalide. Systèmes valides: {', '.join(valid_systems)}")
    
    # hsys: P=Placidus, K=Koch, R=Regiomontanus, etc.
    # Swiss Ephemeris attend un caractère unique encodé en bytes
    hsys = system.encode('ascii')
    
    try:
        cusps, ascmc = swe.houses(jul_day, latitude, longitude, hsys)
        if cusps is None or len(cusps) < 13:
            raise HTTPException(status_code=500, detail="Erreur: le calcul des maisons n'a pas retourné de résultats valides")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du calcul des maisons: {str(e)}")
    
    houses_list = []
    # cusps contient 13 éléments: cusps[0] est toujours 0, cusps[1] à cusps[12] sont les cuspides des maisons 1 à 12
    for i in range(1, 13):
        if i < len(cusps):
            houses_list.append({
                "house_number": i,
                "longitude": cusps[i]
            })
        else:
            raise HTTPException(status_code=500, detail=f"Erreur: cuspide de la maison {i} manquante")
        
    return houses_list

@app.get("/aspects")
async def get_aspects(
    date: str,
    time: str = "12:00:00",
    orb_tolerance: float = 1.0
):
    """Récupère les aspects entre planètes"""
    # Validation de la tolérance d'orbe
    if orb_tolerance < 0.1 or orb_tolerance > 5.0:
        raise HTTPException(status_code=400, detail="orb_tolerance doit être entre 0.1 et 5.0")
    
    # Récupérer d'abord les positions
    planet_positions = await get_planets(date, time)
    
    if len(planet_positions) < 2:
        return []
    
    aspects_list = []
    # Définition simple des aspects (angle, orbe de base)
    ASPECT_defs = {
        "Conjunction": (0, 8.0),
        "Sextile": (60, 6.0),
        "Square": (90, 7.0),
        "Trine": (120, 7.0),
        "Opposition": (180, 8.0)
    }
    
    # Utiliser un set pour éviter les doublons
    seen_aspects = set()
    
    for i in range(len(planet_positions)):
        p1 = planet_positions[i]
        for j in range(i + 1, len(planet_positions)):
            p2 = planet_positions[j]
            
            # Calcul de la différence d'angle (le plus court chemin sur le cercle)
            diff = abs(p1["longitude"] - p2["longitude"])
            if diff > 180:
                diff = 360 - diff
            
            # Vérifier chaque aspect possible
            for asp_name, (angle, base_orb) in ASPECT_defs.items():
                orb = base_orb * orb_tolerance
                angle_diff = abs(diff - angle)
                
                # Vérifier si l'aspect est dans l'orbe
                if angle_diff <= orb:
                    # Créer une clé unique pour éviter les doublons
                    aspect_key = tuple(sorted([p1["planet"], p2["planet"]]) + [asp_name])
                    if aspect_key not in seen_aspects:
                        seen_aspects.add(aspect_key)
                        aspects_list.append({
                            "planet1": p1["planet"],
                            "planet2": p2["planet"],
                            "aspect_name": asp_name,
                            "orb": round(angle_diff, 2)
                        })
                        # Un seul aspect par paire de planètes (le plus proche)
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
    """Récupère toutes les données"""
    # Validation: si latitude ou longitude est fourni, les deux doivent l'être
    if (latitude is not None and longitude is None) or (latitude is None and longitude is not None):
        raise HTTPException(
            status_code=400, 
            detail="Si vous fournissez latitude ou longitude, vous devez fournir les deux pour calculer les maisons"
        )
    
    jul_day = get_julian_day(date, time)
    
    try:
        planets_data = await get_planets(date, time)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des planètes: {str(e)}")
    
    houses_data = []
    if latitude is not None and longitude is not None:
        try:
            houses_data = await get_houses(date, latitude, longitude, time, system)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des maisons: {str(e)}")
        
    try:
        aspects_data = await get_aspects(date, time, orb_tolerance)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des aspects: {str(e)}")
    
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
