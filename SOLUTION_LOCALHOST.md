# ✅ Solution pour localhost:3000

## Problème résolu

Le projet ne fonctionnait pas sur localhost:3000 car il manquait la configuration et les scripts de démarrage.

## Ce qui a été fait

### 1. ✅ Script de démarrage automatique
Créé `start_local.ps1` qui :
- Vérifie Python et Node.js
- Crée/active le virtualenv
- Installe les dépendances Python et Node.js
- Crée le fichier `.env.local` si nécessaire
- Démarre le backend (port 8000) et le frontend (port 3000) dans des fenêtres séparées

### 2. ✅ Fichier de configuration
Le fichier `web/.env.local` existe et contient :
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. ✅ Documentation
Créé `DEMARRAGE_LOCAL.md` avec les instructions complètes.

## Comment démarrer maintenant

### Option 1 : Script automatique (Recommandé)
```powershell
.\start_local.ps1
```

### Option 2 : Démarrage manuel

**Terminal 1 - Backend :**
```powershell
.\.venv\Scripts\Activate.ps1
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 - Frontend :**
```powershell
cd web
npm run dev
```

## Vérification

1. ✅ Backend accessible sur http://localhost:8000
2. ✅ Frontend accessible sur http://localhost:3000
3. ✅ API Docs sur http://localhost:8000/docs

## Si ça ne fonctionne toujours pas

### Vérifier que les deux serveurs tournent
- Backend : Vous devriez voir des logs dans la fenêtre PowerShell du backend
- Frontend : Vous devriez voir "Ready" dans la fenêtre PowerShell du frontend

### Vérifier le fichier .env.local
```powershell
Get-Content web\.env.local
```
Doit afficher : `NEXT_PUBLIC_API_URL=http://localhost:8000`

### Vérifier les ports
- Port 8000 : Backend FastAPI
- Port 3000 : Frontend Next.js

Si un port est occupé, arrêtez le processus qui l'utilise ou changez le port.

### Réinstaller les dépendances
```powershell
# Backend
pip install -r requirements.txt

# Frontend
cd web
npm install
```

## Prochaines étapes

1. Exécutez `.\start_local.ps1`
2. Attendez que les deux serveurs démarrent
3. Ouvrez http://localhost:3000 dans votre navigateur
4. Testez une fonctionnalité (ex: calculer un thème natal)

