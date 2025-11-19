# Schéma OpenAPI pour Configuration GPT

Ce fichier contient le schéma OpenAPI à copier dans la configuration de votre GPT personnalisé.

## Instructions

1. Copiez le contenu du fichier `openapi.json`
2. Dans votre configuration GPT (OpenAI GPTs), allez dans "Actions" ou "Configure"
3. Ajoutez une nouvelle Action et collez le schéma OpenAPI
4. Mettez à jour l'URL du serveur dans le schéma :
   - Pour le développement local : `http://localhost:8000`
   - Pour la production : remplacez `https://your-domain.com` par votre URL réelle

## Structure du Schéma

Le schéma OpenAPI décrit 4 endpoints principaux :

### 1. GET `/planets`
Récupère les positions des planètes pour une date/heure donnée.

**Paramètres requis :**
- `date` : Date au format YYYY-MM-DD

**Paramètres optionnels :**
- `time` : Heure au format HH:MM:SS (défaut: 12:00:00)
- `planets` : Liste de planètes séparées par des virgules (ex: Sun,Moon,Venus)

**Exemple de requête :**
```
GET /planets?date=2024-01-15&time=14:30:00
```

### 2. GET `/houses`
Récupère les maisons astrologiques pour une date, heure et localisation.

**Paramètres requis :**
- `date` : Date au format YYYY-MM-DD
- `latitude` : Latitude en degrés (-90 à 90)
- `longitude` : Longitude en degrés (-180 à 180)

**Paramètres optionnels :**
- `time` : Heure au format HH:MM:SS (défaut: 12:00:00)
- `system` : Système de maisons (P=Placidus, K=Koch, R=Regiomontanus, C=Campanus, E=Equal)

**Exemple de requête :**
```
GET /houses?date=2024-01-15&latitude=48.8566&longitude=2.3522&system=P
```

### 3. GET `/aspects`
Récupère les aspects astrologiques entre les planètes.

**Paramètres requis :**
- `date` : Date au format YYYY-MM-DD

**Paramètres optionnels :**
- `time` : Heure au format HH:MM:SS (défaut: 12:00:00)
- `orb_tolerance` : Tolérance d'orbe (défaut: 1.0)

**Exemple de requête :**
```
GET /aspects?date=2024-01-15&time=14:30:00&orb_tolerance=1.5
```

### 4. GET `/all`
Récupère toutes les données astrologiques en une seule requête.

**Paramètres requis :**
- `date` : Date au format YYYY-MM-DD

**Paramètres optionnels :**
- `time` : Heure au format HH:MM:SS (défaut: 12:00:00)
- `latitude` : Latitude en degrés (pour les maisons)
- `longitude` : Longitude en degrés (pour les maisons)
- `system` : Système de maisons
- `orb_tolerance` : Tolérance d'orbe pour les aspects

**Exemple de requête :**
```
GET /all?date=2024-01-15&latitude=48.8566&longitude=2.3522
```

## Planètes disponibles

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

## Aspects supportés

- Conjunction (Conjonction) : 0°
- Sextile (Sextile) : 60°
- Square (Carré) : 90°
- Trine (Trine) : 120°
- Opposition : 180°

## Note importante

Assurez-vous que :
1. L'API est démarrée et accessible
2. L'URL du serveur dans le schéma correspond à l'URL réelle de votre API
3. Pour un GPT OpenAI, vous devrez peut-être déployer l'API sur un serveur accessible publiquement (pas localhost)



