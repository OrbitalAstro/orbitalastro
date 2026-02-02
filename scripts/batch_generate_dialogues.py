#!/usr/bin/env python3
"""
Script pour générer des dialogues pré-incarnation en lot pour plusieurs personnes.
Génère un PDF distinct pour chaque personne dans un répertoire spécifié.
"""

import os
import sys
import csv
import json
import re
import requests
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import pytz
from timezonefinder import TimezoneFinder
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm, inch
from reportlab.lib.colors import HexColor
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, KeepTogether
from reportlab.platypus.frames import Frame
from reportlab.platypus.doctemplate import PageTemplate, BaseDocTemplate
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY
from reportlab.pdfgen import canvas

# Configuration
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OUTPUT_DIR = os.getenv("OUTPUT_DIR", "dialogues_pdf")

# Couleurs du thème - Noir pour meilleure impression
COLOR_GOLD = HexColor("#000000")  # Noir pour impression
COLOR_DARK_GOLD = HexColor("#000000")  # Noir pour impression
COLOR_WHITE = HexColor("#ffffff")

def geocode_location(city: str, province: str = "", country: str = "") -> Optional[Tuple[float, float, str]]:
    """
    Géocode une localisation en utilisant Nominatim (OpenStreetMap).
    Retourne (latitude, longitude, timezone) ou None si non trouvé.
    """
    # Construire la requête de recherche
    query_parts = []
    if city:
        query_parts.append(city)
    if province:
        query_parts.append(province)
    if country:
        query_parts.append(country)
    
    query = ", ".join(query_parts)
    
    if not query:
        return None
    
    try:
        # Utiliser Nominatim API (gratuit, nécessite un User-Agent)
        url = "https://nominatim.openstreetmap.org/search"
        params = {
            "q": query,
            "format": "json",
            "limit": 1,
            "addressdetails": 1
        }
        headers = {
            "User-Agent": "OrbitalAstro-BatchGenerator/1.0"
        }
        
        print(f"  [GEOCODE] Géocodage de: {query}")
        response = requests.get(url, params=params, headers=headers, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        if not data:
            print(f"  [WARN] Aucun résultat trouvé pour: {query}")
            return None
        
        result = data[0]
        lat = float(result["lat"])
        lon = float(result["lon"])
        
        # Obtenir le timezone à partir des coordonnées
        tf = TimezoneFinder()
        timezone_str = tf.timezone_at(lat=lat, lng=lon)
        
        if not timezone_str:
            # Fallback: estimation basée sur la longitude
            timezone_str = estimate_timezone_from_longitude(lon)
        
        print(f"  [OK] Trouvé: {lat:.6f}, {lon:.6f}, {timezone_str}")
        
        # Respecter les limites de taux de Nominatim (1 req/sec)
        time.sleep(1.1)
        
        return (lat, lon, timezone_str)
        
    except Exception as e:
        print(f"  [ERROR] Erreur de géocodage: {e}")
        return None

def estimate_timezone_from_longitude(longitude: float) -> str:
    """
    Estime le timezone à partir de la longitude (approximation).
    """
    # Zones de timezone approximatives basées sur la longitude
    # UTC offset approximatif: longitude / 15
    offset_hours = round(longitude / 15)
    
    # Mapper vers des timezones communes
    if -75 <= longitude <= -68:  # Est du Canada / USA
        return "America/Toronto"
    elif -68 < longitude <= -52:  # Atlantique
        return "America/Halifax"
    elif -125 <= longitude < -75:  # Ouest du Canada / USA
        return "America/Los_Angeles"
    elif -5 <= longitude <= 10:  # Europe de l'Ouest
        return "Europe/Paris"
    elif 10 < longitude <= 25:  # Europe Centrale
        return "Europe/Berlin"
    else:
        # Timezone UTC avec offset
        if offset_hours >= 0:
            return f"Etc/GMT-{offset_hours}"
        else:
            return f"Etc/GMT+{abs(offset_hours)}"

def calculate_age(birth_date: str, birth_time: str, timezone: str) -> int:
    """Calcule l'âge exact en années complétées."""
    from datetime import datetime, timezone as tz
    import pytz
    
    try:
        birth_datetime_str = f"{birth_date}T{birth_time}:00"
        birth_dt = datetime.fromisoformat(birth_datetime_str)
        
        # Convertir au timezone spécifié
        if timezone:
            tz_obj = pytz.timezone(timezone)
            birth_dt = tz_obj.localize(birth_dt)
        
        # Date actuelle en America/Toronto
        now = datetime.now(pytz.timezone("America/Toronto"))
        birth_toronto = birth_dt.astimezone(pytz.timezone("America/Toronto"))
        
        age = now.year - birth_toronto.year
        if (now.month, now.day) < (birth_toronto.month, birth_toronto.day):
            age -= 1
        
        return max(0, age)
    except Exception as e:
        print(f"Erreur calcul âge: {e}")
        return 0

def get_natal_chart(birth_data: Dict) -> Dict:
    """Récupère le thème natal depuis l'API."""
    url = f"{API_BASE_URL}/natal"
    
    payload = {
        "birth_date": birth_data["birth_date"],
        "birth_time": birth_data["birth_time"],
        "latitude": birth_data["latitude"],
        "longitude": birth_data["longitude"],
        "timezone": birth_data.get("timezone", "UTC"),
        "birth_place": birth_data.get("birth_place", ""),
        "house_system": birth_data.get("house_system", "placidus"),
        "include_aspects": True,
        "include_extra_objects": True,
    }
    
    response = requests.post(url, json=payload, timeout=30)
    response.raise_for_status()
    return response.json()

def get_sign_in_french(sign: str) -> str:
    """Convertit un signe astrologique en français."""
    sign_map = {
        'Aries': 'Bélier',
        'Taurus': 'Taureau',
        'Gemini': 'Gémeaux',
        'Cancer': 'Cancer',
        'Leo': 'Lion',
        'Virgo': 'Vierge',
        'Libra': 'Balance',
        'Scorpio': 'Scorpion',
        'Sagittarius': 'Sagittaire',
        'Capricorn': 'Capricorne',
        'Aquarius': 'Verseau',
        'Pisces': 'Poissons'
    }
    return sign_map.get(sign, sign)

def get_house(planet_data: Dict) -> int:
    """Extrait le numéro de la maison d'une planète."""
    return planet_data.get("house", 0)

def _coerce_house_cusps(houses) -> List[Dict]:
    """
    Normalise les maisons pour accepter plusieurs formats de backend.

    Formats acceptés:
    - dict { "1": 123.4, "2": 150.0, ... } (format actuel de l'API)
    - list[dict] avec clés "cusp"/"longitude" (ancien format)
    - list[float] ou tuple[float] (cusps)
    """
    if not houses:
        return []

    if isinstance(houses, dict):
        out: List[Dict] = []
        for k, v in houses.items():
            try:
                house_num = int(k)
                lon = float(v)
            except (TypeError, ValueError):
                continue
            out.append({"house": house_num, "longitude": lon})
        out.sort(key=lambda item: item["house"])
        return out

    if isinstance(houses, (list, tuple)):
        if not houses:
            return []
        if all(isinstance(h, (int, float)) for h in houses):
            return [{"house": i + 1, "longitude": float(lon)} for i, lon in enumerate(houses)]
        if all(isinstance(h, dict) for h in houses):
            out: List[Dict] = []
            for i, h in enumerate(houses):
                cusp = h.get("cusp") or h.get("longitude")
                if cusp is None:
                    continue
                try:
                    out.append({"house": int(h.get("house", i + 1)), "longitude": float(cusp)})
                except (TypeError, ValueError):
                    continue
            out.sort(key=lambda item: item["house"])
            return out

    return []


def find_house_for_longitude(longitude: float, houses) -> int:
    """Trouve dans quelle maison se trouve une longitude donnée."""
    cusps = _coerce_house_cusps(houses)
    if not cusps:
        return 0
    
    # Normaliser la longitude à 0-360
    normalized_long = float(longitude) % 360.0
    
    for i, house in enumerate(cusps):
        start_long = float(house["longitude"]) % 360.0
        next_house = cusps[(i + 1) % len(cusps)]
        end_long = float(next_house["longitude"]) % 360.0
        
        if start_long <= end_long:
            if start_long <= normalized_long < end_long:
                return int(house.get("house", i + 1))
        else:
            # Wrap-around (ex: 350 -> 10)
            if normalized_long >= start_long or normalized_long < end_long:
                return int(house.get("house", i + 1))
    
    return int(cusps[-1].get("house", 12))

def get_main_aspect(aspects: List[Dict], planet_name: str) -> Optional[str]:
    """Trouve le premier aspect significatif d'une planète."""
    if not aspects:
        return None
    
    planet_aspects = [a for a in aspects 
                     if a.get("planet1", "").lower() == planet_name.lower() 
                     or a.get("planet2", "").lower() == planet_name.lower()]
    
    if not planet_aspects:
        return None
    
    aspect = planet_aspects[0]
    aspect_type_map = {
        'conjunction': 'conjonction',
        'opposition': 'opposition',
        'trine': 'trigone',
        'square': 'carré',
        'sextile': 'sextile'
    }
    
    aspect_type = aspect_type_map.get(aspect.get("type", "").lower(), aspect.get("type", ""))
    other_planet = aspect.get("planet2") if aspect.get("planet1", "").lower() == planet_name.lower() else aspect.get("planet1")
    
    return f"{aspect_type} avec {other_planet}"

def longitude_to_sign(longitude: float) -> str:
    """Convertit une longitude en signe astrologique."""
    signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 
             'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
    normalized = longitude % 360
    sign_index = int(normalized / 30) % 12
    return signs[sign_index]

def generate_dialogue_prompt(birth_data: Dict, chart: Dict) -> tuple[str, str]:
    """Génère le prompt système et utilisateur pour le dialogue."""
    age = calculate_age(birth_data["birth_date"], birth_data["birth_time"], birth_data.get("timezone", "UTC"))
    
    # Extraire les données du thème
    planets = chart.get("planets", {})
    aspects = chart.get("aspects", [])
    
    # Extraire les planètes principales
    sun = planets.get("sun", {})
    moon = planets.get("moon", {})
    venus = planets.get("venus", {})
    mars = planets.get("mars", {})
    saturn = planets.get("saturn", {})
    jupiter = planets.get("jupiter", {})
    true_node = planets.get("true_node") or planets.get("north_node", {})
    
    # Ascendant
    ascendant = chart.get("ascendant")
    if isinstance(ascendant, dict):
        ascendant_sign = ascendant.get("sign")
    elif isinstance(ascendant, (int, float)):
        ascendant_sign = longitude_to_sign(ascendant)
    else:
        ascendant_sign = None
    
    ascendant_house = 1  # L'ascendant est toujours en maison 1
    
    # Talents (Jupiter, Mercure, Vénus, etc.)
    talent_candidates = []
    if jupiter:
        talent_candidates.append({
            'planet': 'Jupiter',
            'sign': get_sign_in_french(jupiter.get("sign", "")),
            'house': get_house(jupiter)
        })
    if planets.get("mercury"):
        mercury = planets["mercury"]
        talent_candidates.append({
            'planet': 'Mercure',
            'sign': get_sign_in_french(mercury.get("sign", "")),
            'house': get_house(mercury)
        })
    if venus:
        talent_candidates.append({
            'planet': 'Vénus',
            'sign': get_sign_in_french(venus.get("sign", "")),
            'house': get_house(venus)
        })
    
    talents = talent_candidates[:3]
    
    # Extraire le Part of Fortune et le Vertex depuis extra_objects
    part_of_fortune_sign = None
    part_of_fortune_house = 0
    part_of_fortune_longitude = None
    vertex_sign = None
    vertex_house = 0
    vertex_longitude = None
    
    extra_objects = chart.get("extra_objects", {}) or chart.get("extraObjects", {}) or {}
    
    # Essayer différentes variantes de noms de clés
    pof_data = extra_objects.get("part_of_fortune") or extra_objects.get("partOfFortune") or extra_objects.get("part-of-fortune")
    vertex_data = extra_objects.get("vertex") or extra_objects.get("Vertex")
    
    if pof_data is not None:
        if isinstance(pof_data, (int, float)):
            part_of_fortune_longitude = float(pof_data)
        elif isinstance(pof_data, dict):
            part_of_fortune_longitude = pof_data.get("longitude") or pof_data.get("longitude_deg")
        
        if part_of_fortune_longitude is not None and not (isinstance(part_of_fortune_longitude, float) and (part_of_fortune_longitude != part_of_fortune_longitude)):  # Check for NaN
            part_of_fortune_sign = longitude_to_sign(part_of_fortune_longitude)
            # Trouver la maison du Part of Fortune
            houses = chart.get("houses", [])
            if houses and len(houses) > 0:
                part_of_fortune_house = find_house_for_longitude(part_of_fortune_longitude, houses)
    
    if vertex_data is not None:
        if isinstance(vertex_data, (int, float)):
            vertex_longitude = float(vertex_data)
        elif isinstance(vertex_data, dict):
            vertex_longitude = vertex_data.get("longitude") or vertex_data.get("longitude_deg")
        
        if vertex_longitude is not None and not (isinstance(vertex_longitude, float) and (vertex_longitude != vertex_longitude)):  # Check for NaN
            vertex_sign = longitude_to_sign(vertex_longitude)
            # Trouver la maison du Vertex
            houses = chart.get("houses", [])
            if houses and len(houses) > 0:
                vertex_house = find_house_for_longitude(vertex_longitude, houses)
    
    # Formatage de la date
    try:
        birth_date_obj = datetime.fromisoformat(f"{birth_data['birth_date']}T{birth_data['birth_time']}:00")
        formatted_date = birth_date_obj.strftime("%d %B %Y")
    except:
        formatted_date = birth_data['birth_date']
    
    formatted_time = birth_data['birth_time']
    formatted_birth_place = birth_data.get('birth_place', '')
    
    # Construire les textes pour la section Chance avec les valeurs remplacées directement
    if part_of_fortune_sign and part_of_fortune_house > 0:
        chance_pof_text = f"Fortune en {get_sign_in_french(part_of_fortune_sign)} (Maison {part_of_fortune_house})"
    else:
        chance_pof_text = "[PointFortune_PlanèteOuPoint] en [PointFortune_Signe] (Maison [PointFortune_Maison])"
    
    if vertex_sign and vertex_house > 0:
        chance_vertex_text = f"Vertex en {get_sign_in_french(vertex_sign)} (Maison {vertex_house})"
    else:
        chance_vertex_text = "[Vertex_PlanèteOuPoint] en [Vertex_Signe] (Maison [Vertex_Maison])"
    
    # Construire le prompt système (version complète) - utiliser f-string pour remplacer les valeurs
    system_prompt = f"""[RÔLE]
Tu es une astrologue psychologique, douce et nuancée. Tu écris en français, dans un style chaleureux, imagé mais simple, accessible pour des non-astrologues. Si un terme astrologique est utilisé, il est traduit en vécu concret. Tu ne fais jamais de prédictions fatalistes, ni médicales : tu parles de tendances, de dynamiques et de potentiel d'évolution.

Tu rédiges le texte COMPLET, en respectant la structure ci-dessous. Tu réponds uniquement avec le texte final du dialogue, sans expliquer ta démarche ni ajouter de commentaires autour.

[TON]
Le ton doit refléter les qualités de l'incarné (plus doux, plus intense, plus joueur, plus posé, etc. selon ce que tu reçois) afin que ça résonne fort. Ne donne pas de faux positif, soit positif directement.

[RÈGLE DE FORMULATION – INCARNÉ (OBLIGATOIRE)]
Si l'incarné exprime une difficulté, une peur, une pression ou une phrase du type "arrêter de / ne plus", je reformule en désir positif direct sous forme "Je veux / Je choisis / Je préfère…". J'évite les formulations négatives.

[RÈGLE DE TEMPS — STRICTE]
Tout ce qui décrit la vie sur Terre / l'incarnation à venir doit être écrit majoritairement au futur (futur simple).
L'astrologie demande au présent et explique au futur.
L'incarné demande au présent et accepte sa vie au futur.
La phrase « Les énergies se rassemblent… » reste au présent.
La section « ICI et MAINTENANT » reste au présent.

[RÈGLE DE LONGUEUR — CIBLE]
Le dialogue final doit faire environ 1700 mots (idéalement 1600–1800).
Pour y arriver, vise le haut des fourchettes de phrases indiquées (ex: 2–5 -> plutôt 4–5) sans ajouter de nouvelles sections et sans changer la structure.

[RÈGLE DE DENSITÉ — CONTENU]
Chaque volet doit avoir de la matière : évite les généralités et le remplissage.
Dans chaque section, ajoute au moins 2 éléments concrets et incarnés (exemples de situations, types de rencontres, contextes, gestes, choix, rythmes, sensations, lieux, façons de parler/agir), tout en restant fidèle au placement (signe + maison).
Ne répète pas la même idée d'un volet à l'autre : chaque section apporte une nuance nouvelle.

[RÈGLE DE RÉPÉTITION – RÉPONSES ASTROLOGIE (OBLIGATOIRE)]
Quand l'astrologie répond après que l'incarné ait exprimé un désir ou une intention, évite de répéter exactement les mêmes mots. Reformule avec des synonymes, des variantes ou des expressions équivalentes. Par exemple, si l'incarné dit "Je veux vivre mes émotions avec intensité", l'astrologie ne doit pas répondre "Tu vivras tes émotions avec intensité" mais plutôt reformuler : "Tu ressentiras profondément, avec une présence à chaque vague émotionnelle" ou une variante similaire. Varie le vocabulaire et la formulation pour éviter les répétitions littérales.

[VERBATIM – intro]
[Prénom], à un moment avant ton arrivée sur Terre, entre un [élément qui convient à la personnalité de la carte] et une [intensité qui convient à la personnalité de la carte] lumière, ton âme s'arrête un instant. L'Astrologie se tient devant toi comme une présence calme et bienveillante, prête à éclairer le choix de ta prochaine aventure. Ce dialogue n'est pas une prédiction : ton libre arbitre fera toujours autorité — au-dessus de toute tendance et de tout symbole — il aura le dernier mot, à chaque instant. C'est un échange symbolique pour éclairer les élans et les tendances de ton plan de jeu astrologique, celui qui influencera ta manière de vivre, de choisir, de grandir. Ici, tu alignes les vibrations que tu calibreras tout au long de ta prochaine vie.

[VERBATIM – Q1]
Astrologie : [Prénom], félicitations! C'est le moment pour nous d'aligner ta prochaine incarnation. Dis-moi comment as-tu envie d'atterrir, quelle essence de présence désire-tu porter dès la première seconde ?

[Prénom] : (2–4 phrases. Désirs concrets de présence, sans astrologie.)

[VERBATIM – Ascendant]
Astrologie : Allons-y donc avec un Ascendant en [Ascendant_Signe] (Maison [Ascendant_Maison]), pour une incarnation où ton premier réflexe, ce sera : "[phrase-réflexe simple et concrète qui traduit l'Ascendant]", au futur.

[Prénom] : (1–3 phrases. Résume le positif de l'Ascendant + le défi choisi)

[VERBATIM – Q Soleil]
Astrologie : Parfait. Maintenant, parlons de ta lumière, comment souhaites-tu rayonner ?

[Prénom] : (2–5 phrases. Identité/valeurs/terrain de vie souhaité, sans astrologie, au présent)

Astrologie : Parfait ce sera un Soleil en [Soleil_Signe] (Maison [Soleil_Maison]), [1–3 phrases qui traduisent signe+maison, au futur].

[VERBATIM – Q Lune]
Astrologie : Et tes émotions, tu veux les vivre comment ?

[Prénom] : (2–5 phrases. Style émotionnel, besoins, sécurité, sans astrologie.)

Astrologie : D'accord, ce sera la Lune en [Lune_Signe] (Maison [Lune_Maison]) qui t'offrira ça.

[VERBATIM – Q Vénus]
Astrologie : Amour, amitié, valeur, sécurité, que choisis-tu comme langage du cœur ?

[Prénom] : (2–5 phrases. Manière d'aimer, besoins relationnels, sans astrologie, au présent)

Astrologie : Ça, ce sera une Vénus en [Venus_Signe] (Maison [Venus_Maison]). [1–3 phrases qui traduisent signe+maison, au futur].

[VERBATIM – Q Mars]
Astrologie : Et ton énergie d'action, ta créativité, comment aimerais-tu la canaliser ?

[Prénom] : (2–5 phrases. Énergie, action, création, défis, sans astrologie, au présent)

Astrologie : Positionnons ton Mars en [Mars_Signe] (Maison [Mars_Maison]). [1–3 phrases qui traduisent signe+maison, au futur].

[VERBATIM – Talents]
Astrologie : Et tes trois plus grands talents ?

[Prénom] : (2–4 phrases. "Je choisis…" + ce que l'âme veut comme ressources, sans astrologie, au présent.)

Astrologie : Alors je t'offre [Talent1_Planète] en [Talent1_Signe] (Maison [Talent1_Maison]), [1 phrase talent concret, au futur]. Tu prendras, aussi [Talent2_Planète] en [Talent2_Signe] (Maison [Talent2_Maison]), [1 phrase talent concret, au futur]. Et finalement, tu auras [Talent3_Planète] en [Talent3_Signe] (Maison [Talent3_Maison]), [1 phrase talent concret, au futur].

[VERBATIM – Chance]
Astrologie : Et ta chance, comment pourrait-elle te surprendre?

[Prénom] : (1–3 phrases. "J'aimerais que ma chance…" sans astrologie, au présent)

Astrologie : D’abord, l’alignement qui permettra à ta chance de te rencontrer sera ta {chance_pof_text}, (1–3 phrases simples et concrètes, au futur, sans astrologie : ce que tu cultiveras en toi, comment tu te placeras intérieurement, quels choix et attitudes ouvriront la porte).

Astrologie : Ensuite, pour les formes par lesquelles la chance viendra vers toi je t'offre {chance_vertex_text}, (1–3 phrases simples et concrètes, au futur, sans astrologie : à quoi ça ressemblera quand ça arrivera — types de rencontres, contextes, invitations, lieux, timing, synchronicités).

IMPORTANT : Ce volet Chance est OBLIGATOIRE et doit TOUJOURS être inclus dans le dialogue. Les valeurs astrologiques dans ce volet (Fortune, Vertex, signes, maisons) sont DÉJÀ REMPLACÉES directement dans le texte ci-dessus. Tu dois utiliser EXACTEMENT ces valeurs telles qu'elles apparaissent, sans les modifier, sans les inventer, sans les remplacer par d'autres valeurs. Par exemple, si tu vois "Fortune en Taureau (Maison 11)" dans le texte ci-dessus, tu dois utiliser EXACTEMENT "Fortune en Taureau (Maison 11)" dans ton dialogue, PAS "Fortune en Balance" ou "Fortune en Cancer" ou toute autre valeur. Même chose pour Vertex : utilise EXACTEMENT la valeur qui apparaît dans le texte ci-dessus. NE JAMAIS inventer, deviner ou modifier ces valeurs astrologiques.

[VERBATIM – Apprentissage]
Astrologie : Que planifies-tu pour ton plus grand apprentissage?

[Prénom] : (1–4 phrases. Valeur, estime, limites, courage, etc. sans astrologie, au présent.)

Astrologie : Alors [Saturne_Signe] sera en (Maison [Saturne_Maison]), [1–3 phrases sur l'apprentissage, au futur].

[VERBATIM – Nœud Nord]
Astrologie : Enfin, quel sera le Nord de la boussole qui guidera ton évolution ?

[Prénom] : (2–5 phrases. Direction de vie, sens, mouvement intérieur, sans astrologie, au présent.)

Astrologie : Ça, ce sera le Nœud Nord en [NoeudNord_Signe] (Maison [NoeudNord_Maison]). C'est pour ce parcours que tout se rejoindra! [1 phrase qui relie Ascendant + phrases : Soleil + Lune + Vénus + Mars + Nœud Nord, en mots simples, au futur, sans astrologie].

[Prénom] : (2–4 phrases finales, style "Oui! J'incarnerai cette vie pour…" sans astrologie, ton profond et doux, au futur.)

[VERBATIM – Atterrissage]
Les énergies se rassemblent, les vibrations se calibrent et ta matière prend forme

5 – 4 – 3 – 2 – 1 … Atterrissage : [date, heure]
[ville, province, pays]

[VERBATIM – Retour]
[RÈGLE — ICI et MAINTENANT (OBLIGATOIRE)
La section "ICI et MAINTENANT" doit être écrite au présent.
Sous le titre ICI et MAINTENANT, tu dois écrire exactement les 2 phrases ci-dessous, verbatim.
AVANT le titre "ICI et MAINTENANT", tu DOIS écrire exactement "***" (trois astérisques) sur une ligne séparée, centrée.

TEXTE VERBATIM À UTILISER (2 phrases seulement) :
Maintenant que je suis là, depuis près de [ÂGE] ans, je sais que j'ai mon libre arbitre : je peux continuer à [verbe + éléments importants pour l'incarné.e].
Je me rappelle aussi que mon allié le plus terrien, c'est mon Ascendant [ASCENDANT_SIGNE].

[1 phrase finale "outil Ascendant" style " Je reviens à mon souffle, à ma curiosité, à mes questions : une conversation à la fois, un pas à la fois, et je laisse cette clarté guider mes décisions sans me presser."

[VERBATIM – Fin]
Ce dialogue est symbolique, un échange interprété pour le plaisir et la réflexion : il est offert à des fins de divertissement et d'inspiration, sans prétention de vérité absolue ni de certitude. OrbitalAstro.ca"""

    # Construire le prompt utilisateur avec les données astrologiques
    user_prompt_lines = [
        "====================================================",
        "",
        "INPUT (à fournir par l'utilisateur à chaque lecture)",
        "",
        f"[Prénom] : {birth_data.get('first_name', 'Non spécifié')}",
        f"Naissance : {formatted_date}, {formatted_time} — {formatted_birth_place}",
        "",
        "[Aspects et placements fournis par l'utilisateur — à insérer ici]",
        "",
        f"Ascendant_Signe : {get_sign_in_french(ascendant_sign) if ascendant_sign else 'Non spécifié'}",
        f"Ascendant_Maison : {ascendant_house}",
        f"Soleil_Signe : {get_sign_in_french(sun.get('sign', '')) if sun else 'Non spécifié'}",
        f"Soleil_Maison : {get_house(sun) if sun else 'Non spécifié'}",
    ]
    
    sun_aspect = get_main_aspect(aspects, 'sun')
    if sun_aspect:
        user_prompt_lines.append(f"Soleil_Aspect : {sun_aspect}")
    
    user_prompt_lines.extend([
        f"Lune_Signe : {get_sign_in_french(moon.get('sign', '')) if moon else 'Non spécifié'}",
        f"Lune_Maison : {get_house(moon) if moon else 'Non spécifié'}",
    ])
    
    moon_aspect = get_main_aspect(aspects, 'moon')
    if moon_aspect:
        user_prompt_lines.append(f"Lune_Aspect : {moon_aspect}")
    
    user_prompt_lines.extend([
        f"Venus_Signe : {get_sign_in_french(venus.get('sign', '')) if venus else 'Non spécifié'}",
        f"Venus_Maison : {get_house(venus) if venus else 'Non spécifié'}",
    ])
    
    venus_aspect = get_main_aspect(aspects, 'venus')
    if venus_aspect:
        user_prompt_lines.append(f"Venus_Aspect : {venus_aspect}")
    
    user_prompt_lines.extend([
        f"Mars_Signe : {get_sign_in_french(mars.get('sign', '')) if mars else 'Non spécifié'}",
        f"Mars_Maison : {get_house(mars) if mars else 'Non spécifié'}",
    ])
    
    mars_aspect = get_main_aspect(aspects, 'mars')
    if mars_aspect:
        user_prompt_lines.append(f"Mars_Aspect : {mars_aspect}")
    
    user_prompt_lines.extend([
        f"Jupiter_Signe : {get_sign_in_french(jupiter.get('sign', '')) if jupiter else 'Non spécifié'}",
        f"Jupiter_Maison : {get_house(jupiter) if jupiter else 'Non spécifié'}",
        f"Saturne_Signe : {get_sign_in_french(saturn.get('sign', '')) if saturn else 'Non spécifié'}",
        f"Saturne_Maison : {get_house(saturn) if saturn else 'Non spécifié'}",
    ])
    
    saturn_aspect = get_main_aspect(aspects, 'saturn')
    if saturn_aspect:
        user_prompt_lines.append(f"Saturne_Aspect : {saturn_aspect}")
    
    user_prompt_lines.extend([
        f"NoeudNord_Signe : {get_sign_in_french(true_node.get('sign', '')) if true_node else 'Non spécifié'}",
        f"NoeudNord_Maison : {get_house(true_node) if true_node else 'Non spécifié'}",
    ])
    
    # Talents
    for i, talent in enumerate(talents, 1):
        user_prompt_lines.extend([
            f"Talent{i}_Planète : {talent['planet']}",
            f"Talent{i}_Signe : {talent['sign']}",
            f"Talent{i}_Maison : {talent['house']}",
        ])
    
    # Point de Fortune (Part of Fortune)
    user_prompt_lines.extend([
        f"PointFortune_PlanèteOuPoint : {'Fortune' if part_of_fortune_sign else 'Non spécifié'}",
        f"PointFortune_Signe : {get_sign_in_french(part_of_fortune_sign) if part_of_fortune_sign else 'Non spécifié'}",
        f"PointFortune_Maison : {part_of_fortune_house if part_of_fortune_house else 'Non spécifié'}",
        f"Vertex_PlanèteOuPoint : {'Vertex' if vertex_sign else 'Non spécifié'}",
        f"Vertex_Signe : {get_sign_in_french(vertex_sign) if vertex_sign else 'Non spécifié'}",
        f"Vertex_Maison : {vertex_house if vertex_house else 'Non spécifié'}",
        "",
        f"[ÂGE] : {age}",
        f"[ASCENDANT_SIGNE] : {get_sign_in_french(ascendant_sign) if ascendant_sign else 'Non spécifié'}",
        f"[Date atterrissage] : {formatted_date}",
        f"[Heure atterrissage] : {formatted_time}",
        f"[Lieu atterrissage] : {formatted_birth_place}",
        "",
        "====================================================",
        "",
        "RAPPEL FINAL",
        "",
        "Tu produis uniquement le texte final du dialogue, sans aucun autre texte.",
    ])
    
    user_prompt = "\n".join(user_prompt_lines)
    
    return system_prompt, user_prompt

def generate_dialogue(birth_data: Dict, chart: Dict) -> str:
    """Génère le dialogue pré-incarnation via l'API AI."""
    system_prompt, user_prompt = generate_dialogue_prompt(birth_data, chart)
    
    url = f"{API_BASE_URL}/ai/interpret"
    
    payload = {
        "prompt": user_prompt,
        "system_instruction": system_prompt,
        "temperature": 0.7,
        "max_output_tokens": 8192
    }
    
    headers = {
        "Content-Type": "application/json",
        "Referer": "http://localhost:3000"
    }
    
    response = requests.post(url, json=payload, headers=headers, timeout=120)
    response.raise_for_status()
    result = response.json()
    return result.get("content", "")

class NumberedCanvas(canvas.Canvas):
    """Canvas personnalisé pour ajouter le cadre et la pagination."""
    def __init__(self, *args, **kwargs):
        canvas.Canvas.__init__(self, *args, **kwargs)
        self._page_count = 0

    def draw_frame_and_pagination(self):
        """Dessine le cadre doré et la pagination."""
        # Cadre à 20 points de chaque côté
        frame_margin = 20
        page_width = A4[0]
        page_height = A4[1]
        
        # Cadre doré
        self.setStrokeColor(HexColor('#b8860b'))
        self.setLineWidth(2)
        self.rect(
            frame_margin,
            frame_margin,
            page_width - 2 * frame_margin,
            page_height - 2 * frame_margin,
            stroke=1,
            fill=0
        )
        
        # Pagination
        self.saveState()
        self.setFont('Helvetica', 10)
        self.setFillColor(HexColor('#b8860b'))
        page_num = self.getPageNumber()
        text = f"{page_num}"
        self.drawCentredString(page_width / 2, 10, text)
        self.restoreState()

    def showPage(self):
        self.draw_frame_and_pagination()
        canvas.Canvas.showPage(self)

    def save(self):
        # Compter le nombre total de pages
        self._page_count = self.getPageNumber()
        self.draw_frame_and_pagination()
        canvas.Canvas.save(self)

def create_pdf(dialogue: str, birth_data: Dict, output_path: Path):
    """Crée le PDF du dialogue avec le formatage approprié (même format que l'application web)."""
    # Utiliser BaseDocTemplate pour avoir plus de contrôle
    class DialogueDocTemplate(BaseDocTemplate):
        def __init__(self, filename, **kw):
            BaseDocTemplate.__init__(self, filename, **kw)
            template = PageTemplate('normal', [
                Frame(
                    30*mm, 30*mm,  # left, bottom
                    A4[0] - 60*mm, A4[1] - 60*mm,  # width, height
                    leftPadding=0,
                    bottomPadding=0,
                    rightPadding=0,
                    topPadding=0,
                )
            ], onPage=self.add_page_decorations)
            self.addPageTemplates(template)
        
        def add_page_decorations(self, canvas, doc):
            """Ajoute le cadre et la pagination à chaque page."""
            # Cadre doré
            frame_margin = 20
            page_width = A4[0]
            page_height = A4[1]
            
            canvas.setStrokeColor(HexColor('#b8860b'))  # Doré
            canvas.setLineWidth(2)
            canvas.rect(
                frame_margin,
                frame_margin,
                page_width - 2 * frame_margin,
                page_height - 2 * frame_margin,
                stroke=1,
                fill=0
            )
            
            # Pagination
            canvas.saveState()
            canvas.setFont('Helvetica', 10)
            canvas.setFillColor(HexColor('#b8860b'))  # Doré
            page_num = canvas.getPageNumber()
            # Note: Le total de pages sera disponible seulement après le build
            # Pour l'instant, on affiche juste le numéro de page
            text = f"{page_num}"
            canvas.drawCentredString(page_width / 2, 10, text)
            canvas.restoreState()
    
    doc = DialogueDocTemplate(
        str(output_path),
        pagesize=A4,  # Format portrait (A4)
        rightMargin=20*mm,  # Réduit pour mobile
        leftMargin=20*mm,  # Réduit pour mobile
        topMargin=20*mm,  # Réduit pour mobile
        bottomMargin=20*mm  # Réduit pour mobile
    )
    
    # Styles
    styles = getSampleStyleSheet()
    
    # Styles personnalisés - correspondant exactement au format web
    # Style pour "Orbital" (script/italique) - correspond au format web
    brand_script_style = ParagraphStyle(
        'BrandScript',
        parent=styles['Normal'],
        fontSize=34,
        textColor=COLOR_GOLD,  # #b8860b
        fontName='Times-Italic',  # Simule GreatVibes (fallback)
        alignment=TA_CENTER,
        spaceAfter=0,
        leading=34,
    )
    
    # Style pour "ASTRO" - correspond au format web
    brand_sans_style = ParagraphStyle(
        'BrandSans',
        parent=styles['Normal'],
        fontSize=16,
        textColor=COLOR_DARK_GOLD,  # #8b6914
        fontName='Times-Roman',
        alignment=TA_CENTER,
        spaceAfter=0,
        leading=16,
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Normal'],
        fontSize=9,
        textColor=COLOR_DARK_GOLD,
        fontName='Times-Roman',
        alignment=TA_CENTER,
        spaceAfter=20,
        leading=9,
    )
    
    paragraph_style = ParagraphStyle(
        'CustomParagraph',
        parent=styles['Normal'],
        fontSize=14,  # Augmenté pour mobile
        textColor=COLOR_GOLD,  # #b8860b
        fontName='Helvetica',
        alignment=TA_JUSTIFY,
        leading=22.4,  # lineHeight 1.6
        spaceAfter=10,
    )
    
    # Styles pour les bulles de dialogue
    dialogue_bubble_speaker_style = ParagraphStyle(
        'DialogueBubbleSpeaker',
        parent=styles['Normal'],
        fontSize=13,
        textColor=COLOR_GOLD,
        fontName='Helvetica-Oblique',
        alignment=TA_LEFT,
        spaceAfter=4,
        leading=13,
    )
    
    dialogue_bubble_user_speaker_style = ParagraphStyle(
        'DialogueBubbleUserSpeaker',
        parent=dialogue_bubble_speaker_style,
        alignment=TA_RIGHT,
        textColor=COLOR_DARK_GOLD,
    )
    
    dialogue_bubble_text_style = ParagraphStyle(
        'DialogueBubbleText',
        parent=styles['Normal'],
        fontSize=14,  # Augmenté pour mobile
        textColor=HexColor('#000000'),
        fontName='Helvetica',
        alignment=TA_LEFT,
        leading=23.8,  # lineHeight 1.7
        spaceAfter=0,
        leftIndent=0,
        rightIndent=0,
    )
    
    center_style = ParagraphStyle(
        'CustomCenter',
        parent=paragraph_style,
        alignment=TA_CENTER,
    )
    
    # Style pour "ICI et MAINTENANT"
    ici_maintenant_style = ParagraphStyle(
        'IciMaintenant',
        parent=styles['Normal'],
        fontSize=16,  # Augmenté pour mobile
        textColor=HexColor('#000000'),
        fontName='Helvetica-Bold',
        alignment=TA_CENTER,
        spaceAfter=10,
        leading=16,
    )
    
    landing_style = ParagraphStyle(
        'CustomLanding',
        parent=styles['Normal'],
        fontSize=14,  # Augmenté pour mobile
        textColor=COLOR_GOLD,
        fontName='Helvetica-Oblique',
        alignment=TA_CENTER,
        leading=19.6,  # lineHeight 1.4
        spaceAfter=8,
    )
    
    footnote_style = ParagraphStyle(
        'CustomFootnote',
        parent=styles['Normal'],
        fontSize=9,
        textColor=COLOR_DARK_GOLD,
        fontName='Helvetica',
        alignment=TA_CENTER,
        spaceAfter=10,
    )
    
    # Construire le contenu
    story = []
    
    # En-tête avec lignes décoratives (même format que web)
    # Lignes dorées en haut - première ligne légèrement plus épaisse
    content_width = A4[0] - 60*mm
    
    # Première ligne dorée (légèrement plus épaisse)
    line1 = Table([['']], colWidths=[content_width], rowHeights=[1.5])
    line1.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_GOLD),  # #b8860b
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(line1)
    story.append(Spacer(1, 2))
    
    # Deuxième ligne dorée (plus fine)
    line2 = Table([['']], colWidths=[content_width], rowHeights=[1])
    line2.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), COLOR_DARK_GOLD),  # #8b6914
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('LEFTPADDING', (0, 0), (-1, -1), 0),
        ('RIGHTPADDING', (0, 0), (-1, -1), 0),
    ]))
    story.append(line2)
    story.append(Spacer(1, 8))
    
    # Brand line : "Orbital" (script) et "ASTRO" (majuscules) côte à côte, alignés baseline
    # Orbital en Times-Italic 34px, ASTRO en Times-Roman 16px bold, marginLeft: 4, marginBottom: -4
    # Utiliser un tableau pour simuler flexDirection: row, justifyContent: center, alignItems: baseline
    brand_table = Table([
        [
            Paragraph('<font name="Times-Italic" size="34" color="#000000">Orbital</font>', brand_script_style),
            Paragraph('<font name="Times-Roman" size="16" color="#000000"><b>ASTRO</b></font>', brand_sans_style)
        ]
    ], colWidths=[None, None])
    brand_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'BOTTOM'),  # alignItems: baseline
        ('LEFTPADDING', (0, 0), (0, 0), 0),
        ('RIGHTPADDING', (0, 0), (0, 0), 0),
        ('LEFTPADDING', (1, 0), (1, 0), 4),  # marginLeft: 4
        ('RIGHTPADDING', (1, 0), (1, 0), 0),
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 0), (0, 0), 0),  # marginBottom: -4 pour Orbital
        ('BOTTOMPADDING', (1, 0), (1, 0), 0),
        ('GRID', (0, 0), (-1, -1), 0, 'transparent'),
    ]))
    story.append(brand_table)
    story.append(Spacer(1, 6))  # marginTop: 6 pour le subtitle
    
    # Subtitle : "DIALOGUE PRÉ-INCARNATION"
    story.append(Paragraph("DIALOGUE PRÉ-INCARNATION", subtitle_style))
    story.append(Spacer(1, 20))
    
    # Traiter le dialogue par paragraphes (même logique que DialoguePdf.tsx)
    paragraphs = re.split(r'\n\s*\n', dialogue or '')
    processed_paragraphs = []
    
    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        
        # Supprimer les lignes qui ne contiennent que des # (###, ##, #, etc.)
        if re.match(r'^#{1,6}\s*$', para):
            continue  # Ignorer ces lignes
        
        # Nettoyer les marqueurs Markdown
        cleaned = re.sub(r'^#{1,6}\s+', '', para)
        # Nettoyer les astérisques échappés et les caractères parasites
        cleaned = cleaned.replace('\\*', '*')
        cleaned = cleaned.replace('|', '')
        
        processed_paragraphs.append(cleaned)
    
    # Traiter chaque paragraphe selon le format web
    for para in processed_paragraphs:
        lower = para.lower()
        trimmed = para.strip()
        
        # Nettoyer les astérisques échappés ou mal formés
        cleaned_trimmed = trimmed.replace('\\*', '*').replace('|', '')
        
        # Détecter les types de paragraphes (même logique que DialoguePdf.tsx)
        isLanding = (
            'les énergies se rassemblent' in lower or
            'les vibrations se calibrent' in lower or
            'ta matière prend forme' in lower or
            'atterrissage' in lower
        )
        
        isFootnote = lower.startswith('ce dialogue est symbolique')
        
        isIciMaintenant = (
            cleaned_trimmed == 'ici et maintenant' or
            cleaned_trimmed == 'ici et maintenan' or
            'ici et maintenant' in cleaned_trimmed.lower()
        )
        
        isAsterisks = bool(re.match(r'^\*{2,}$', cleaned_trimmed))
        
        # Détecter les dialogues (qui commencent par "Astrologie" ou un prénom suivi de ":")
        speaker_match = re.match(r'^([^\n:]{2,24})\s*:\s*(.*)$', trimmed)
        isDialogue = False
        isAstro = False
        
        if speaker_match:
            speaker = speaker_match.group(1).strip()
            speaker_lower = speaker.lower()
            isAstro = (
                speaker_lower == 'astrologie' or
                speaker_lower == 'astrology' or
                speaker_lower == 'astrología' or
                speaker_lower == 'astrologia'
            )
            looks_like_first_name = (
                re.match(r'^[\p{L}\'’-]+$', speaker, re.UNICODE) and
                len(speaker) <= 16 and
                speaker_lower not in ['naissance', 'atterrissage']
            )
            isDialogue = isAstro or looks_like_first_name
        
        # Si c'est un dialogue, créer une bulle
        if isDialogue and speaker_match:
            speaker = speaker_match.group(1).strip()
            content = speaker_match.group(2).strip()
            
            # Créer une bulle de dialogue avec Table
            bubble_width = content_width * 0.85  # 85% de la largeur
            bubble_data = [
                [Paragraph(speaker, dialogue_bubble_user_speaker_style if not isAstro else dialogue_bubble_speaker_style)],
                [Paragraph(content, dialogue_bubble_text_style)]
            ]
            
            bubble_table = Table(bubble_data, colWidths=[bubble_width])
            
            # Style de la bulle selon le locuteur
            if isAstro:
                # Bulle Astrologie (à gauche)
                bubble_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 1), (-1, -1), HexColor('#FAF5FF')),  # Fond mauve clair
                    ('TEXTCOLOR', (0, 0), (-1, -1), COLOR_GOLD),
                    ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 12),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 12),
                    ('TOPPADDING', (0, 0), (-1, -1), 12),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                    ('GRID', (0, 0), (-1, -1), 1, COLOR_GOLD),  # Bordure dorée
                    ('ROWBACKGROUNDS', (0, 0), (-1, -1), [None, HexColor('#FAF5FF')]),
                ]))
            else:
                # Bulle utilisateur (à droite)
                bubble_table.setStyle(TableStyle([
                    ('BACKGROUND', (0, 1), (-1, -1), HexColor('#FCF8FF')),  # Fond mauve très clair
                    ('TEXTCOLOR', (0, 0), (-1, -1), COLOR_DARK_GOLD),
                    ('ALIGN', (0, 0), (-1, -1), 'RIGHT'),
                    ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                    ('LEFTPADDING', (0, 0), (-1, -1), 12),
                    ('RIGHTPADDING', (0, 0), (-1, -1), 12),
                    ('TOPPADDING', (0, 0), (-1, -1), 12),
                    ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
                    ('GRID', (0, 0), (-1, -1), 1, COLOR_GOLD),  # Bordure dorée
                    ('ROWBACKGROUNDS', (0, 0), (-1, -1), [None, HexColor('#FCF8FF')]),
                ]))
            
            # Wrapper pour aligner la bulle à gauche ou à droite
            wrapper_data = [[bubble_table]] if isAstro else [[Spacer(1, 0), bubble_table]]
            wrapper_table = Table(wrapper_data, colWidths=[content_width * 0.15, bubble_width] if not isAstro else [bubble_width])
            wrapper_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'LEFT' if isAstro else 'RIGHT'),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 0),
                ('RIGHTPADDING', (0, 0), (-1, -1), 0),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ]))
            
            # Envelopper la bulle dans KeepTogether pour éviter qu'elle soit coupée entre deux pages
            story.append(KeepTogether(wrapper_table))
            story.append(Spacer(1, 16))
        elif isIciMaintenant:
            story.append(Paragraph(para, ici_maintenant_style))
            story.append(Spacer(1, 10))
        elif isLanding:
            story.append(Paragraph(para, landing_style))
            story.append(Spacer(1, 6))
        elif isAsterisks:
            # Les astérisques doivent être centrés
            story.append(Paragraph('***', center_style))
            story.append(Spacer(1, 6))
        elif isFootnote:
            story.append(Paragraph(para, footnote_style))
        else:
            isCenter = (
                len(para) < 90 and
                (re.search(r'\d\s*[–-]\s*\d', para) or
                 re.search(r'\d{1,2}\s+\w+\s+\d{2,4}', para, re.IGNORECASE) or
                 (',' in para and len(para) < 80 and 'astrologie' not in lower))
            )
            if isCenter:
                story.append(Paragraph(para, center_style))
                story.append(Spacer(1, 6))
            else:
                story.append(Paragraph(para, paragraph_style))
                story.append(Spacer(1, 6))
    
    # Note de bas de page si absente
    if not any('ce dialogue est symbolique' in p.lower() for p in paragraphs):
        story.append(Spacer(1, 20))
        story.append(Paragraph(
            "Ce dialogue est symbolique, un échange interprété pour le plaisir et la réflexion : il est offert à des fins de divertissement et d'inspiration, sans prétention de vérité absolue ni de certitude. OrbitalAstro.ca",
            footnote_style
        ))
    
    # Générer le PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    
    # Mettre à jour la pagination avec le nombre total de pages
    # (ReportLab ne peut pas le faire automatiquement, donc on doit le faire manuellement)
    # Pour l'instant, on laisse juste le numéro de page

def process_person(birth_data: Dict, output_dir: Path) -> bool:
    """Traite une personne : génère le thème, le dialogue et le PDF."""
    try:
        first_name = birth_data.get('first_name', 'lecture')
        print(f"\n[PROCESS] Traitement de {first_name}...")
        
        # 1. Obtenir le thème natal
        print("  [WORK] Calcul du thème natal...")
        chart = get_natal_chart(birth_data)
        print("  [OK] Thème natal calculé")
        
        # 2. Générer le dialogue
        print("  [WORK] Génération du dialogue...")
        dialogue = generate_dialogue(birth_data, chart)
        print("  [OK] Dialogue généré")
        
        # 3. Créer le PDF
        print("  [WORK] Création du PDF...")
        safe_name = "".join(c for c in first_name if c.isalnum() or c in (' ', '-', '_')).strip()
        pdf_filename = f"Dialogue-pre-incarnation-{safe_name}.pdf"
        pdf_path = output_dir / pdf_filename
        
        create_pdf(dialogue, birth_data, pdf_path)
        print(f"  [OK] PDF créé : {pdf_path}")
        
        return True
    except Exception as e:
        print(f"  [ERROR] Erreur : {e}")
        import traceback
        traceback.print_exc()
        return False

def normalize_time(time_str: str) -> str:
    """
    Normalise le format de l'heure pour accepter HH:MM ou HH:MM:SS.
    Retourne toujours HH:MM:SS.
    """
    if not time_str:
        return "12:00:00"
    
    time_str = time_str.strip()
    
    # Si c'est déjà au format HH:MM:SS, retourner tel quel
    if len(time_str.split(':')) == 3:
        return time_str
    
    # Si c'est au format HH:MM, ajouter :00
    if len(time_str.split(':')) == 2:
        return f"{time_str}:00"
    
    # Sinon, essayer de parser et reformater
    try:
        # Essayer de parser différents formats
        if ':' in time_str:
            parts = time_str.split(':')
            if len(parts) == 2:
                return f"{parts[0]}:{parts[1]}:00"
            elif len(parts) == 3:
                return time_str
        # Si c'est un nombre seul (ex: "14" pour 14:00)
        if time_str.isdigit() and len(time_str) <= 2:
            return f"{time_str.zfill(2)}:00:00"
    except:
        pass
    
    # Par défaut, retourner 12:00:00
    print(f"  [WARN] Format d'heure non reconnu: {time_str}, utilisation de 12:00:00")
    return "12:00:00"

def load_people_from_csv(csv_path: Path) -> List[Dict]:
    """Charge les données des personnes depuis un fichier CSV."""
    people = []
    
    # Essayer différents encodages
    encodings = ['utf-8', 'utf-8-sig', 'latin-1', 'cp1252', 'iso-8859-1']
    encoding_used = None
    
    for encoding in encodings:
        try:
            with open(csv_path, 'r', encoding=encoding) as f:
                # Lire juste la première ligne pour tester
                first_line = f.readline()
                f.seek(0)
                reader = csv.DictReader(f)
                # Tester en lisant une ligne
                try:
                    next(reader)
                    encoding_used = encoding
                    f.seek(0)
                    reader = csv.DictReader(f)
                    break
                except:
                    continue
        except:
            continue
    
    if not encoding_used:
        raise ValueError(f"Impossible de lire le fichier CSV avec les encodages testés: {encodings}")
    
    print(f"[INFO] Encodage détecté: {encoding_used}")
    
    with open(csv_path, 'r', encoding=encoding_used) as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Normaliser l'heure (accepter HH:MM ou HH:MM:SS)
            # Gérer les fautes de frappe dans les noms de colonnes
            birth_time_raw = (
                row.get('birth_time', '').strip() or 
                row.get('birth:_time', '').strip() or  # Avec deux-points
                row.get('birt:_time', '').strip() or 
                row.get('birt_time', '').strip()
            )
            birth_time = normalize_time(birth_time_raw)
            
            person = {
                'first_name': row.get('first_name', '').strip(),
                'birth_date': row.get('birth_date', '').strip(),
                'birth_time': birth_time,
                'house_system': row.get('house_system', 'placidus').strip(),
            }
            
            # Construire le lieu de naissance
            city = row.get('city', '').strip()
            province = row.get('province', '').strip()
            country = row.get('country', '').strip()
            
            # Si birth_place est fourni directement, l'utiliser
            birth_place = row.get('birth_place', '').strip()
            if not birth_place and (city or province or country):
                birth_place_parts = [p for p in [city, province, country] if p]
                birth_place = ", ".join(birth_place_parts)
            person['birth_place'] = birth_place
            
            # Vérifier si les coordonnées sont fournies directement
            latitude_str = row.get('latitude', '').strip()
            longitude_str = row.get('longitude', '').strip()
            timezone_str = row.get('timezone', '').strip()
            
            if latitude_str and longitude_str:
                # Coordonnées fournies directement
                try:
                    person['latitude'] = float(latitude_str)
                    person['longitude'] = float(longitude_str)
                    person['timezone'] = timezone_str if timezone_str else 'UTC'
                except ValueError:
                    print(f"[WARN] Coordonnées invalides pour {person['first_name']}, tentative de géocodage...")
                    # Fallback: géocoder
                    coords = geocode_location(city, province, country)
                    if coords:
                        person['latitude'], person['longitude'], person['timezone'] = coords
                    else:
                        raise ValueError(f"Impossible de géocoder {birth_place}")
            else:
                # Géocoder automatiquement à partir de la ville/province/pays
                print(f"[GEOCODE] Géocodage automatique pour {person['first_name']}...")
                coords = geocode_location(city, province, country)
                if coords:
                    person['latitude'], person['longitude'], person['timezone'] = coords
                else:
                    raise ValueError(f"Impossible de géocoder {birth_place}. Vérifiez les données ou fournissez latitude/longitude manuellement.")
            
            people.append(person)
    
    return people

def main():
    """Fonction principale."""
    import argparse
    
    parser = argparse.ArgumentParser(description="Génère des dialogues pré-incarnation en lot")
    parser.add_argument('input_file', help='Fichier CSV contenant les données des personnes')
    parser.add_argument('--output-dir', default=OUTPUT_DIR, help='Répertoire de sortie pour les PDFs')
    parser.add_argument('--api-url', default=API_BASE_URL, help='URL de l\'API backend')
    
    args = parser.parse_args()
    
    # Créer le répertoire de sortie
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    print(f"[INFO] Répertoire de sortie : {output_dir.absolute()}")
    
    # Charger les personnes
    input_path = Path(args.input_file)
    if not input_path.exists():
        print(f"[ERROR] Fichier introuvable : {input_path}")
        sys.exit(1)
    
    print(f"[INFO] Chargement des données depuis {input_path}...")
    people = load_people_from_csv(input_path)
    print(f"[OK] {len(people)} personne(s) trouvée(s)")
    
    # Traiter chaque personne
    success_count = 0
    for i, person in enumerate(people, 1):
        print(f"\n[{i}/{len(people)}]")
        if process_person(person, output_dir):
            success_count += 1
        time.sleep(1)  # Pause pour éviter de surcharger l'API
    
    print(f"\n[OK] Terminé : {success_count}/{len(people)} dialogue(s) généré(s) avec succès")
    print(f"[INFO] PDFs sauvegardés dans : {output_dir.absolute()}")

if __name__ == "__main__":
    main()
