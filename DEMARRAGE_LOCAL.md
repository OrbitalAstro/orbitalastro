# 🚀 Guide de démarrage en local

Ce guide vous explique comment démarrer le projet OrbitalAstro en local sur votre machine.

## Prérequis

- **Python 3.10+** installé
- **Node.js 18+** et **npm** installés
- **PowerShell** (sur Windows)

## Démarrage rapide

### Option 1 : Script automatique (Recommandé)

Exécutez simplement :

```powershell
.\start_local.ps1
```

Ce script va :
1. ✅ Vérifier et créer le virtualenv si nécessaire
2. ✅ Installer les dépendances Python
3. ✅ Installer les dépendances Node.js
4. ✅ Créer le fichier `.env.local` pour le frontend
5. ✅ Démarrer le backend (port 8000) dans une fenêtre
6. ✅ Démarrer le frontend (port 3000) dans une autre fenêtre

### Option 2 : Démarrage manuel

#### Étape 1 : Backend (API)

1. Créez et activez un virtualenv :
   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

2. Installez les dépendances :
   ```powershell
   pip install -r requirements.txt
   ```

3. Démarrez le serveur :
   ```powershell
   python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```

Le backend sera accessible sur : **http://localhost:8000**
- API : http://localhost:8000
- Documentation Swagger : http://localhost:8000/docs

#### Étape 2 : Frontend (Web App)

1. Naviguez vers le dossier `web` :
   ```powershell
   cd web
   ```

2. Installez les dépendances (si pas déjà fait) :
   ```powershell
   npm install
   ```

3. Créez le fichier `.env.local` :
   ```powershell
   echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
   ```

4. Démarrez le serveur de développement :
   ```powershell
   npm run dev
   ```

Le frontend sera accessible sur : **http://localhost:3000**

## Vérification

Une fois les deux serveurs démarrés :

1. ✅ Ouvrez http://localhost:3000 dans votre navigateur
2. ✅ Vous devriez voir la page d'accueil d'OrbitalAstro
3. ✅ Testez une fonctionnalité (ex: calculer un thème natal)

## Dépannage

### Le frontend ne se connecte pas au backend

1. Vérifiez que le backend est bien démarré sur le port 8000
2. Vérifiez le fichier `web/.env.local` contient bien :
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
3. Redémarrez le serveur frontend après modification de `.env.local`

### Erreur "Module not found" (Python)

Réinstallez les dépendances :
```powershell
pip install -r requirements.txt
```

### Erreur "Module not found" (Node.js)

Réinstallez les dépendances :
```powershell
cd web
npm install
```

### Le port 8000 ou 3000 est déjà utilisé

- **Port 8000** : Arrêtez le processus qui utilise ce port ou changez le port dans la commande uvicorn
- **Port 3000** : Arrêtez le processus qui utilise ce port ou changez le port dans `package.json`

## URLs importantes

- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:8000
- **API Documentation** : http://localhost:8000/docs
- **API ReDoc** : http://localhost:8000/redoc

## Arrêter les serveurs

Appuyez sur `Ctrl+C` dans chaque fenêtre PowerShell où les serveurs tournent.

