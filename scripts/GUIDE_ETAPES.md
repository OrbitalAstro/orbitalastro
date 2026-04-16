# Guide étape par étape - Génération de dialogues en lot

## 📋 Prérequis

1. **Backend API en cours d'exécution**
2. **Python 3.10+ installé**
3. **Dépendances Python installées**

## 🚀 Étapes détaillées

### Étape 1 : Installer les dépendances

Ouvrez un terminal PowerShell dans le dossier du projet et activez l'environnement virtuel :

```powershell
# Activer l'environnement virtuel
.venv\Scripts\Activate.ps1

# Installer les nouvelles dépendances
pip install timezonefinder reportlab pytz
```

Ou installez toutes les dépendances :
```powershell
pip install -r requirements.txt
```

### Étape 2 : Démarrer le backend API

Dans un terminal PowerShell :

```powershell
# Activer l'environnement virtuel (si pas déjà fait)
.venv\Scripts\Activate.ps1

# Démarrer le backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Laissez ce terminal ouvert. Le backend doit être accessible sur `http://localhost:8000`.

### Étape 3 : Préparer votre fichier CSV

Créez un fichier CSV avec les données des personnes. Vous avez deux options :

#### Option A : Format simplifié (avec géocodage automatique) ⭐ Recommandé

Créez un fichier `mes_personnes.csv` avec ce format :

```csv
first_name,birth_date,birth_time,city,province,country
Jean,1976-10-26,14:30:00,Montréal,Québec,Canada
Marie,1990-05-15,09:00:00,Paris,,France
Pierre,1985-12-01,18:45:00,Québec,Québec,Canada
```

**Colonnes obligatoires :**
- `first_name` : Prénom
- `birth_date` : Date (YYYY-MM-DD)
- `birth_time` : Heure (HH:MM ou HH:MM:SS) - ex: `14:30` ou `14:30:00`
- `city` : Ville
- `country` : Pays

**Colonnes optionnelles :**
- `province` : Province/État (recommandé pour meilleure précision)
- `house_system` : Système de maisons (défaut: placidus)

#### Option B : Format avec coordonnées manuelles

Si vous préférez fournir les coordonnées directement :

```csv
first_name,birth_date,birth_time,birth_place,latitude,longitude,timezone,house_system
Jean,1976-10-26,14:30:00,Montréal,45.5017,-73.5673,America/Toronto,placidus
```

### Étape 4 : Lancer le script

Dans un **nouveau terminal PowerShell** (gardez le backend ouvert dans l'autre) :

```powershell
# Activer l'environnement virtuel
.venv\Scripts\Activate.ps1

# Naviguer vers le dossier du projet (si pas déjà dedans)
cd C:\Users\isabe\orbitalastro

# Lancer le script
python scripts/batch_generate_dialogues.py mes_personnes.csv --output-dir dialogues_pdf
```

**Options disponibles :**
- `--output-dir DIR` : Répertoire de sortie (défaut: `dialogues_pdf`)
- `--api-url URL` : URL de l'API (défaut: `http://localhost:8000`)

### Étape 5 : Attendre la génération

Le script va :
1. ✅ Lire le fichier CSV
2. 🔍 Géocoder chaque lieu (si nécessaire)
3. 📊 Calculer le thème natal pour chaque personne
4. 🤖 Générer le dialogue pré-incarnation
5. 📄 Créer le PDF
6. 💾 Sauvegarder dans le répertoire de sortie

**Temps estimé :** ~30-60 secondes par personne (selon la vitesse de l'API Gemini)

### Étape 6 : Récupérer les PDFs

Les PDFs seront dans le répertoire spécifié (par défaut `dialogues_pdf/`) :

```
dialogues_pdf/
  ├── Dialogue-pre-incarnation-Jean.pdf
  ├── Dialogue-pre-incarnation-Marie.pdf
  └── Dialogue-pre-incarnation-Pierre.pdf
```

## 📝 Exemple complet

```powershell
# Terminal 1 : Backend
.venv\Scripts\Activate.ps1
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Terminal 2 : Script de génération
.venv\Scripts\Activate.ps1
cd C:\Users\isabe\orbitalastro
python scripts/batch_generate_dialogues.py mes_personnes.csv
```

## ⚠️ Notes importantes

1. **Backend requis** : Le backend doit être démarré avant de lancer le script
2. **GEMINI_API_KEY** : Doit être configurée dans le fichier `.env` à la racine
3. **Limite de taux** : Le géocodage respecte 1 requête/seconde (délai automatique)
4. **Erreurs** : Si une personne échoue, le script continue avec les suivantes

## 🐛 Dépannage

### Erreur : "Connection refused"
→ Vérifiez que le backend est bien démarré sur le port 8000

### Erreur : "GEMINI_API_KEY not set"
→ Vérifiez le fichier `.env` à la racine du projet

### Erreur : "Module not found"
→ Installez les dépendances : `pip install timezonefinder reportlab pytz`

### Géocodage échoue
→ Vérifiez que la ville/province/pays sont corrects, ou fournissez latitude/longitude manuellement

## ✅ Vérification

Pour vérifier que tout fonctionne :

1. Vérifiez que le backend répond : Ouvrez `http://localhost:8000/docs` dans votre navigateur
2. Testez avec le fichier d'exemple :
   ```powershell
   python scripts/batch_generate_dialogues.py scripts/people_example.csv
   ```

