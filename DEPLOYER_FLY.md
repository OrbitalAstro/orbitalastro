# 🚀 Déployer sur Fly.io - Guide complet

## ✅ Prérequis

1. **Fly CLI installé** :
   ```powershell
   # Vérifier si installé
   flyctl version
   
   # Si non installé, installer :
   # Télécharger depuis https://fly.io/docs/hands-on/install-flyctl/
   # Ou via PowerShell :
   iwr https://fly.io/install.ps1 -useb | iex
   ```

2. **Connecté à Fly.io** :
   ```powershell
   flyctl auth login
   ```

## 📋 Déploiement du Frontend (Web)

### Étape 1 : Aller dans le dossier web

```powershell
cd web
```

### Étape 2 : Vérifier la configuration

Le fichier `web/fly.toml` contient la configuration de votre application.

### Étape 3 : Configurer les variables d'environnement

**IMPORTANT** : Avant de déployer, configurez les variables d'environnement Stripe :

```powershell
# Configurer la clé publique Stripe (frontend)
flyctl secrets set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_PUBLIQUE_ICI -a orbitalastro-web

# Configurer la clé secrète Stripe (backend - si nécessaire)
# Note: La clé secrète est normalement dans l'API, pas dans le frontend
```

**Autres variables d'environnement** (si nécessaire) :
```powershell
# URL de l'API backend
flyctl secrets set NEXT_PUBLIC_API_URL=https://api.orbitalastro.ca -a orbitalastro-web
```

### Étape 4 : Déployer

```powershell
flyctl deploy -a orbitalastro-web
```

Le déploiement va :
1. Construire l'image Docker
2. Déployer sur Fly.io
3. Mettre à jour votre application

### Étape 5 : Vérifier le déploiement

```powershell
# Voir les logs
flyctl logs -a orbitalastro-web

# Voir le statut
flyctl status -a orbitalastro-web

# Ouvrir l'application
flyctl open -a orbitalastro-web
```

## 🔧 Déploiement de l'API (si nécessaire)

Si vous devez aussi déployer l'API :

```powershell
# Depuis la racine du projet
cd ..

# Configurer les secrets de l'API (si nécessaire)
flyctl secrets set STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE_ICI -a orbitalastro-api

# Déployer l'API
flyctl deploy -a orbitalastro-api
```

## 📝 Checklist avant déploiement

- [ ] Tous les changements sont commités dans Git
- [ ] Les variables d'environnement Stripe sont configurées
- [ ] Les Price IDs sont corrects dans `web/lib/stripe.ts`
- [ ] Le code fonctionne en local (`npm run dev:fast`)

## 🧪 Tester après déploiement

1. **Page d'accueil** : `https://www.orbitalastro.ca/`
   - Vérifier que le bouton "Tarifs" est visible

2. **Page de tarification** : `https://www.orbitalastro.ca/pricing`
   - Vérifier que les 3 produits s'affichent
   - Vérifier que les prix sont corrects

3. **Test de paiement** :
   - Cliquer sur "Acheter maintenant" pour un produit
   - Vérifier la redirection vers Stripe Checkout
   - Utiliser une carte de test : `4242 4242 4242 4242`

## 🔄 Déploiement rapide (une seule commande)

Si vous avez déjà tout configuré :

```powershell
cd web
flyctl deploy -a orbitalastro-web
```

## 📊 Voir les logs en temps réel

```powershell
flyctl logs -a orbitalastro-web --follow
```

## 🐛 Dépannage

### Erreur : "App not found"

Vérifiez que l'application existe :
```powershell
flyctl apps list
```

Si elle n'existe pas, créez-la :
```powershell
flyctl launch -a orbitalastro-web
```

### Erreur : "Secrets not found"

Vérifiez les secrets configurés :
```powershell
flyctl secrets list -a orbitalastro-web
```

### Erreur de build

Vérifiez les logs de build :
```powershell
flyctl logs -a orbitalastro-web
```

### Variables d'environnement manquantes

Ajoutez-les :
```powershell
flyctl secrets set VARIABLE_NAME=valeur -a orbitalastro-web
```

## ⚡ Commandes utiles

```powershell
# Voir toutes les applications
flyctl apps list

# Voir les secrets
flyctl secrets list -a orbitalastro-web

# Voir les machines (instances)
flyctl machines list -a orbitalastro-web

# Redémarrer l'application
flyctl apps restart orbitalastro-web

# Ouvrir l'application dans le navigateur
flyctl open -a orbitalastro-web

# SSH dans l'application (pour debug)
flyctl ssh console -a orbitalastro-web
```

## 🎯 Résumé rapide

```powershell
# 1. Aller dans web/
cd web

# 2. Configurer les secrets Stripe (une seule fois)
flyctl secrets set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... -a orbitalastro-web

# 3. Déployer
flyctl deploy -a orbitalastro-web

# 4. Vérifier
flyctl open -a orbitalastro-web
```

## ✅ C'est tout !

Une fois déployé, votre site sera accessible sur `https://www.orbitalastro.ca` avec la page de tarification fonctionnelle !

