# Migration vers Swiss Ephemeris - Documentation

## Résumé
L'application utilise maintenant **Swiss Ephemeris exclusivement** pour tous les calculs astrologiques.

## Changements effectués

### 1. Calculs des positions planétaires
- **Nouveau module**: `astro/swisseph_positions.py`
- **Fonction**: `get_positions_from_swisseph()` - calcule toutes les positions directement avec `swe.calc_ut()`
- **Remplacement**: Tous les usages de `EphemerisRepository.get_positions()` ont été remplacés

### 2. Calculs des maisons astrologiques
- **Module**: `astro/houses_multi.py`
- **Fonction**: `compute_houses()` utilise maintenant uniquement `swe.houses()`
- **Systèmes supportés**: Tous les systèmes utilisent Swiss Ephemeris (P, K, R, C, E, W, A, V, X, T)

### 3. Calcul de l'Ascendant et du MC
- **Source**: Retournés directement par `swe.houses()` via `compute_houses()`
- **Plus d'utilisation**: `compute_asc_mc()` (Python pur) n'est plus utilisé dans le code de production

### 4. Fichiers modifiés

#### API (Production)
- ✅ `api/natal.py` - Thème natal
- ✅ `api/transits.py` - Transits

#### Astro (Calculs)
- ✅ `astro/transits.py` - Calculs de transits
- ✅ `astro/solar_returns.py` - Retours solaires
- ✅ `astro/progressions.py` - Progressions
- ✅ `astro/rectification.py` - Rectification de l'heure de naissance
- ✅ `astro/aspects.py` - Calcul de vitesse pour aspects
- ✅ `astro/parallax.py` - Correction parallaxe lunaire
- ✅ `astro/houses_multi.py` - Tous les systèmes de maisons

## Fichiers non utilisés en production

Les fichiers suivants contiennent encore des références à l'ancien système mais ne sont **pas utilisés** dans le code de production :
- `astro/ephemeris_loader.py` - Contient `EphemerisRepository` et fallback Skyfield (utilisé uniquement pour génération de cache, qui n'est plus utilisé)
- `astro/houses.py` - Contient `compute_asc_mc()` (fonction Python pur, plus utilisée)
- Fichiers de test - Utilisent parfois l'ancien système mais n'affectent pas la production

## Résultat

✅ **Tous les calculs de production utilisent Swiss Ephemeris exclusivement**
✅ **Cohérence**: Une seule source de calcul
✅ **Précision**: Résultats alignés avec les standards astrologiques
✅ **Ascendant corrigé**: Calculs corrects (ex: Gémeaux au lieu de Taureau)


