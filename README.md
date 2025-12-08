# OrbitalAstro API

API REST pour accéder aux données astrologiques via Flatlib. Cette API permet à votre GPT personnalisé d'importer facilement les données astrologiques pour des analyses et des calculs.

## 🚀 Installation

### Prérequis

- Python 3.8+
- Git

### Installation des dépendances

```bash
pip install -r requirements.txt
```

## 📖 Utilisation

### Démarrer l'API

```bash
python main.py
```

L'API sera disponible sur `http://localhost:8000`

### Documentation interactive

Une fois l'API démarrée, accédez à la documentation interactive Swagger sur :
- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc

## 🔌 Endpoints

### GET `/`

Informations générales sur l'API et liste des endpoints disponibles.

### GET `/planets`

Récupère les positions des planètes pour une date et heure donnée.

**Paramètres :**
- `date` (requis) : Date au format `YYYY-MM-DD`
- `time` (optionnel) : Heure au format `HH:MM:SS` (par défaut: `12:00:00`)
- `planets` (optionnel) : Liste de planètes séparées par des virgules (ex: `Sun,Moon,Venus`)

**Exemple :**
```bash
GET /planets?date=2024-01-15&time=14:30:00
GET /planets?date=2024-01-15&planets=Sun,Moon,Venus
```

**Réponse :**
```json
[
  {
    "planet": "Sun",
    "longitude": 294.5,
    "latitude": 0.0,
    "distance": 0.983,
    "speed_longitude": 1.02
  },
  ...
]
```

### GET `/houses`

Récupère les maisons astrologiques pour une date, heure et localisation.

**Paramètres :**
- `date` (requis) : Date au format `YYYY-MM-DD`
- `time` (optionnel) : Heure au format `HH:MM:SS` (par défaut: `12:00:00`)
- `latitude` (requis) : Latitude en degrés
- `longitude` (requis) : Longitude en degrés
- `system` (optionnel) : Système de maisons (`P`=Placidus, `K`=Koch, `R`=Regiomontanus, etc.)

**Exemple :**
```bash
GET /houses?date=2024-01-15&latitude=48.8566&longitude=2.3522&system=P
```

### GET `/aspects`

Récupère les aspects astrologiques entre les planètes.

**Paramètres :**
- `date` (requis) : Date au format `YYYY-MM-DD`
- `time` (optionnel) : Heure au format `HH:MM:SS` (par défaut: `12:00:00`)
- `orb_tolerance` (optionnel) : Tolérance d'orbe (par défaut: `1.0`)

**Exemple :**
```bash
GET /aspects?date=2024-01-15&time=14:30:00&orb_tolerance=1.5
```

**Réponse :**
```json
[
  {
    "planet1": "Sun",
    "planet2": "Moon",
    "aspect_name": "Trine",
    "orb": 2.5
  },
  ...
]
```

### GET `/all`

Récupère toutes les données astrologiques en une seule requête (planètes, maisons, aspects).

**Paramètres :**
- `date` (requis) : Date au format `YYYY-MM-DD`
- `time` (optionnel) : Heure au format `HH:MM:SS` (par défaut: `12:00:00`)
- `latitude` (optionnel) : Latitude en degrés (pour les maisons)
- `longitude` (optionnel) : Longitude en degrés (pour les maisons)
- `system` (optionnel) : Système de maisons
- `orb_tolerance` (optionnel) : Tolérance d'orbe pour les aspects

**Exemple :**
```bash
GET /all?date=2024-01-15&latitude=48.8566&longitude=2.3522
```

## 📊 Planètes et points astrologiques disponibles

### Planètes principales
- Sun (Soleil)
- Moon (Lune)
- Mercury (Mercure)
- Venus (Vénus)
- Mars
- Jupiter
- Saturn (Saturne)
- Uranus
- Neptune
- Pluto (Pluton)

### Points astrologiques additionnels
- Chiron (astéroïde/planète mineure)
- Lilith (Lune noire moyenne - apogée de la Lune)
- NorthNode (Nœud Nord - True Node)
- SouthNode (Nœud Sud - opposé du Nœud Nord)
- PartOfFortune (Part de Fortune - AS + Lune - Soleil) - nécessite Ascendant
- Vertex (Point des Destinées) - nécessite latitude/longitude
- AntiVertex (Anti-Vertex - opposé du Vertex) - nécessite latitude/longitude
- PartOfSpirit (Part de l'Esprit - AS + Soleil - Lune) - nécessite Ascendant
- PartOfMarriage (Part du Mariage - AS + Vénus - Jupiter) - nécessite Ascendant

## 🔗 Aspects supportés

- Conjunction (Conjonction) : 0° (orbe: 8°)
- Sextile (Sextile) : 60° (orbe: 6°)
- Square (Carré) : 90° (orbe: 7°)
- Trine (Trine) : 120° (orbe: 7°)
- Opposition : 180° (orbe: 8°)

## 🏠 Systèmes de maisons

- **P** : Placidus (par défaut)
- **K** : Koch
- **R** : Regiomontanus
- **C** : Campanus
- **E** : Equal
- Et d'autres systèmes disponibles dans Swiss Ephemeris

## 🔧 Configuration

L'API peut être configurée dans `main.py` pour modifier :
- Le port d'écoute (par défaut: 8000)
- Les origines CORS autorisées
- Les orbes des aspects
- Les systèmes de maisons disponibles

## 📝 Exemples d'utilisation avec Python

```python
import requests

# Obtenir les positions planétaires
response = requests.get("http://localhost:8000/planets", params={
    "date": "2024-01-15",
    "time": "14:30:00"
})
planets = response.json()

# Obtenir toutes les données astrologiques
response = requests.get("http://localhost:8000/all", params={
    "date": "2024-01-15",
    "latitude": 48.8566,
    "longitude": 2.3522
})
data = response.json()
```

## 🔐 Intégration avec GPT personnalisé

Cette API peut être intégrée avec votre GPT personnalisé pour :
- Récupérer des données astrologiques en temps réel
- Effectuer des analyses astrologiques
- Générer des thèmes astraux
- Calculer des transits et progressions

## 📄 Licence

Voir le fichier LICENSE pour plus de détails.
