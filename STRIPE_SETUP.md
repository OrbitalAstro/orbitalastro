# Configuration Stripe - Orbital Astro

Ce guide vous accompagne pour configurer Stripe dans votre application Orbital Astro.

## 📋 Prérequis

1. **Compte Stripe** : Créez un compte sur [stripe.com](https://stripe.com)
2. **Clés API** : Récupérez vos clés API depuis le Dashboard Stripe

## 🔑 Étape 1 : Créer un compte Stripe

1. Allez sur [https://stripe.com](https://stripe.com)
2. Cliquez sur **"S'inscrire"** ou **"Sign up"**
3. Remplissez vos informations (email, mot de passe, pays)
4. Complétez votre profil entreprise (nom, adresse, etc.)

## 🔐 Étape 2 : Récupérer les clés API

1. Allez sur le **Dashboard Stripe** : https://dashboard.stripe.com
2. Cliquez sur **"Developers"** dans le menu de gauche
3. Cliquez sur **"API keys"**
4. Vous verrez deux clés :
   - **Publishable key** (commence par `pk_test_` ou `pk_live_`) : Pour le frontend
   - **Secret key** (commence par `sk_test_` ou `sk_live_`) : Pour le backend (NE JAMAIS exposer)

### Mode Test vs Production

- **Mode Test** (`pk_test_` / `sk_test_`) : Pour le développement, transactions gratuites
- **Mode Production** (`pk_live_` / `sk_live_`) : Pour les vrais paiements (activer après tests)

## ⚙️ Étape 3 : Configurer les variables d'environnement

### Frontend (Next.js)

Créez ou modifiez `.env.local` dans le dossier `web/` :

```bash
# Stripe Frontend (publishable key)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Stripe Webhook Secret (pour valider les webhooks)
NEXT_PUBLIC_STRIPE_WEBHOOK_SECRET=whsec_...

# NextAuth (pour l'authentification)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=... # Générez avec: openssl rand -base64 32
```

### Backend (FastAPI)

Créez ou modifiez `.env` à la racine du projet :

```bash
# Stripe Backend (secret key)
STRIPE_SECRET_KEY=sk_test_...

# Database (pour stocker les utilisateurs et abonnements)
DATABASE_URL=postgresql://user:password@host:port/database
# OU utilisez Supabase (gratuit) :
# DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
```

## 🌐 Étape 4 : Configurer les variables sur Fly.io/Vercel

### Frontend (Fly.io ou Vercel)

**Fly.io** :
```powershell
flyctl secrets set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... -a orbitalastro-web
flyctl secrets set NEXTAUTH_SECRET=... -a orbitalastro-web
```

**Vercel** :
1. Allez sur https://vercel.com/dashboard
2. Sélectionnez votre projet `orbitalastro-web`
3. Settings → Environment Variables
4. Ajoutez les variables :
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `NEXTAUTH_SECRET`

### Backend (Fly.io)

```powershell
flyctl secrets set STRIPE_SECRET_KEY=sk_test_... -a orbitalastro-api
flyctl secrets set DATABASE_URL=... -a orbitalastro-api
```

## 📦 Étape 5 : Installer les dépendances

### Frontend

```powershell
cd web
npm install
```

### Backend

```powershell
pip install -r requirements.txt
```

## ✅ Vérification

Vérifiez que tout est installé :

```powershell
# Frontend
cd web
npm list stripe @stripe/stripe-js next-auth

# Backend
pip list | findstr stripe
```

## 🔗 Étape 6 : Configurer les webhooks Stripe

Les webhooks permettent à Stripe de notifier votre application lors d'événements (paiement réussi, abonnement annulé, etc.)

### Pour le développement local

1. Installez **Stripe CLI** : https://stripe.com/docs/stripe-cli
2. Connectez-vous :
   ```bash
   stripe login
   ```
3. Écoutez les webhooks :
   ```bash
   stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
   ```
   Cela affichera un `whsec_...` secret à copier dans `.env.local`

### Pour la production

1. Allez sur **Dashboard Stripe** → **Developers** → **Webhooks**
2. Cliquez sur **"Add endpoint"**
3. URL : `https://www.orbitalastro.ca/api/webhooks/stripe`
4. Événements à écouter :
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. Copiez le **Signing secret** (`whsec_...`) et ajoutez-le à vos variables d'environnement

## 🎯 Prochaines étapes

Une fois Stripe configuré, nous allons :

1. ✅ Configurer l'authentification (NextAuth.js)
2. ✅ Créer la base de données pour les utilisateurs/abonnements
3. ✅ Créer les pages de pricing/checkout
4. ✅ Protéger les routes API avec vérification d'abonnement
5. ✅ Implémenter les webhooks pour gérer les événements

## 📚 Ressources

- [Documentation Stripe](https://stripe.com/docs)
- [Stripe + Next.js](https://stripe.com/docs/payments/quickstart)
- [Stripe Billing (Abonnements)](https://stripe.com/docs/billing/subscriptions/overview)
- [NextAuth.js Documentation](https://next-auth.js.org/)

