# Générateur de Dialogues Pré-incarnation en Lot

Ce script permet de générer automatiquement des dialogues pré-incarnation en PDF pour plusieurs personnes à partir d'un fichier CSV.

## Prérequis

1. **Backend API en cours d'exécution** : Le script nécessite que l'API backend soit accessible (par défaut sur `http://localhost:8000`)

2. **Variables d'environnement** :
   - `GEMINI_API_KEY` : Clé API Google Gemini (déjà configurée dans le backend)
   - `API_BASE_URL` : URL de l'API backend (défaut: `http://localhost:8000`)
   - `OUTPUT_DIR` : Répertoire de sortie pour les PDFs (défaut: `dialogues_pdf`)

3. **Dépendances Python** :
   ```bash
   pip install requests reportlab pytz timezonefinder
   ```
   
   Ou installez toutes les dépendances du projet :
   ```bash
   pip install -r requirements.txt
   ```

## Format du fichier CSV

Le fichier CSV peut utiliser **deux formats** :

### Format 1 : Avec géocodage automatique (Recommandé)

Si vous fournissez `city`, `province` et `country`, le script calculera automatiquement `latitude`, `longitude` et `timezone` :

| Colonne | Description | Exemple | Obligatoire |
|---------|-------------|---------|-------------|
| `first_name` | Prénom ou surnom | Jean | ✅ |
| `birth_date` | Date de naissance (YYYY-MM-DD) | 1976-10-26 | ✅ |
| `birth_time` | Heure de naissance (HH:MM ou HH:MM:SS) | `14:30` ou `14:30:00` | ✅ |
| `city` | Ville de naissance | Montréal | ✅ |
| `province` | Province/État | Québec | ⚠️ Recommandé |
| `country` | Pays | Canada | ✅ |
| `birth_place` | Lieu complet (optionnel, construit automatiquement) | Montréal, Québec, Canada | ❌ |
| `latitude` | Latitude (optionnel si city fourni) | 45.5017 | ❌ |
| `longitude` | Longitude (optionnel si city fourni) | -73.5673 | ❌ |
| `timezone` | Fuseau horaire (optionnel si city fourni) | America/Toronto | ❌ |
| `house_system` | Système de maisons (optionnel, défaut: placidus) | placidus | ❌ |

### Format 2 : Avec coordonnées manuelles

Si vous préférez fournir les coordonnées directement :

| Colonne | Description | Exemple | Obligatoire |
|---------|-------------|---------|-------------|
| `first_name` | Prénom ou surnom | Jean | ✅ |
| `birth_date` | Date de naissance (YYYY-MM-DD) | 1976-10-26 | ✅ |
| `birth_time` | Heure de naissance (HH:MM ou HH:MM:SS) | `14:30` ou `14:30:00` | ✅ |
| `birth_place` | Lieu de naissance | Montréal | ✅ |
| `latitude` | Latitude en degrés | 45.5017 | ✅ |
| `longitude` | Longitude en degrés | -73.5673 | ✅ |
| `timezone` | Fuseau horaire | America/Toronto | ⚠️ Recommandé |
| `house_system` | Système de maisons (optionnel, défaut: placidus) | placidus | ❌ |

### Exemple de fichier CSV

Voir `people_example.csv` pour un exemple complet.

## Utilisation

### 1. Préparer le fichier CSV

Créez un fichier CSV avec les données des personnes (voir `people_example.csv` pour un exemple).

### 2. Lancer le script

```bash
python scripts/batch_generate_dialogues.py people.csv --output-dir dialogues_pdf
```

### 3. Options

```bash
python scripts/batch_generate_dialogues.py [FICHIER_CSV] [OPTIONS]

Options:
  --output-dir DIR     Répertoire de sortie pour les PDFs (défaut: dialogues_pdf)
  --api-url URL        URL de l'API backend (défaut: http://localhost:8000)
  -h, --help           Affiche l'aide
```

### 4. Résultat

Les PDFs seront générés dans le répertoire spécifié, avec le format :
```
Dialogue-pre-incarnation-[Prénom].pdf
```

## Exemple complet

```bash
# 1. Créer le fichier CSV avec les données
# (voir people_example.csv)

# 2. Démarrer le backend (dans un autre terminal)
cd orbitalastro
.venv\Scripts\Activate.ps1
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# 3. Lancer le script de génération
python scripts/batch_generate_dialogues.py scripts/people_example.csv --output-dir dialogues_pdf

# 4. Les PDFs seront dans le répertoire dialogues_pdf/
```

## Notes importantes

- Le script fait une pause d'1 seconde entre chaque personne pour éviter de surcharger l'API
- En cas d'erreur pour une personne, le script continue avec les suivantes
- Les PDFs générés suivent le même format que ceux générés par l'application web
- Le script nécessite que le backend soit accessible et que `GEMINI_API_KEY` soit configurée

## Dépannage

### Erreur : "Connection refused"
- Vérifiez que le backend est bien démarré sur le port 8000
- Vérifiez l'URL de l'API avec `--api-url`

### Erreur : "GEMINI_API_KEY not set"
- Vérifiez que la variable d'environnement est bien configurée dans le backend
- Vérifiez le fichier `.env` à la racine du projet

### Erreur : "Module not found"
- Installez les dépendances : `pip install requests reportlab pytz`

### PDFs mal formatés
- Le script utilise une version simplifiée du formatage PDF
- Pour un formatage exact, il faudrait utiliser la même logique que le frontend React

