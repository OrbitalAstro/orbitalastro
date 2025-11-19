# Problème d'authentification Vercel - Solution

## 🔴 Problème actuel

Votre API est protégée par **Deployment Protection** de Vercel, ce qui empêche votre GPT personnalisé d'y accéder.

Quand le GPT essaie d'appeler l'API, il reçoit une page d'authentification au lieu de la réponse JSON.

## ✅ Solution : Désactiver la protection d'authentification

### Option 1 : Via l'interface web Vercel (Recommandé)

1. Allez sur : https://vercel.com/jo-divers-projects/orbitalastro-api/settings
2. Cliquez sur **"Deployment Protection"** dans le menu de gauche
3. Désactivez la protection pour la production (Production environment)
4. Cliquez sur **"Save"**

### Option 2 : Via Vercel CLI

```powershell
# Vérifier les paramètres actuels
vercel project ls

# Les protections sont généralement dans les paramètres du projet
# Vous devrez les désactiver via l'interface web
```

### Option 3 : Configurer un token de bypass (Alternative)

Si vous voulez garder la protection mais autoriser votre GPT :

1. Allez sur : https://vercel.com/jo-divers-projects/orbitalastro-api/settings
2. Section **"Deployment Protection"**
3. Créez un **Protection Bypass Token**
4. Utilisez ce token dans l'URL de votre API :
   ```
   https://orbitalastro-606wd6ee6-jo-divers-projects.vercel.app?x-vercel-protection-bypass=VOTRE_TOKEN
   ```

## 🧪 Vérification après désactivation

Après avoir désactivé la protection, testez l'API :

```powershell
Invoke-WebRequest -Uri "https://orbitalastro-606wd6ee6-jo-divers-projects.vercel.app/planets?date=2024-01-15" -Method GET | Select-Object -ExpandProperty Content
```

Vous devriez recevoir du JSON au lieu d'une page d'authentification.

## 📝 Mise à jour du schéma OpenAPI (si vous utilisez un token)

Si vous choisissez d'utiliser un token de bypass, mettez à jour `openapi.json` :

```json
"servers": [
  {
    "url": "https://orbitalastro-606wd6ee6-jo-divers-projects.vercel.app?x-vercel-protection-bypass=VOTRE_TOKEN",
    "description": "Serveur Vercel de production - OrbitalAstro API"
  }
]
```

## ⚠️ Recommandation

Pour un GPT personnalisé qui doit accéder à l'API publiquement, **il est recommandé de désactiver complètement la protection** pour l'environnement de production, car :
- Les endpoints sont déjà protégés par votre logique métier
- Vercel n'authentifie pas les utilisateurs finaux
- C'est plus simple pour l'intégration avec le GPT


