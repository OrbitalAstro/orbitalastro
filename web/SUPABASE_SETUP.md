# 🗄️ Configuration Supabase - Guide complet

## 📋 Étape 1 : Créer un compte Supabase

1. Allez sur [https://supabase.com](https://supabase.com)
2. Cliquez sur **"Start your project"** ou **"Sign up"**
3. Créez un compte (gratuit pour commencer)
4. Créez un nouveau projet :
   - **Nom du projet** : `orbitalastro` (ou votre choix)
   - **Mot de passe de la base de données** : Choisissez un mot de passe fort
   - **Région** : Choisissez la région la plus proche (ex: `Canada (Central)`)

## 📋 Étape 2 : Créer les tables

1. Dans votre projet Supabase, allez dans **"SQL Editor"** (menu de gauche)
2. Cliquez sur **"New query"**
3. Copiez le contenu du fichier `web/database/schema.sql`
4. Collez-le dans l'éditeur SQL
5. Cliquez sur **"Run"** (ou `Ctrl+Enter`)

Vous devriez voir :
- ✅ Table `payments` créée
- ✅ Table `user_access` créée
- ✅ Index créés
- ✅ Triggers créés
- ✅ Vue `active_access` créée

## 📋 Étape 3 : Récupérer les clés API

1. Dans Supabase, allez dans **"Settings"** → **"API"**
2. Copiez les informations suivantes :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **Service Role Key** : `eyJhbGc...` (⚠️ SECRET - ne jamais exposer au frontend)

## 📋 Étape 4 : Configurer les variables d'environnement

### En local (`.env.local` dans `web/`)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Service Role Key (SECRET)
```

### En production (Fly.io)

```powershell
# Configurer les secrets dans Fly.io
flyctl secrets set NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co -a orbitalastro-web
flyctl secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... -a orbitalastro-web
```

## 📋 Étape 5 : Configurer le webhook Stripe

1. Allez dans [Stripe Dashboard](https://dashboard.stripe.com) → **"Developers"** → **"Webhooks"**
2. Cliquez sur **"+ Add endpoint"**
3. **Endpoint URL** : `https://www.orbitalastro.ca/api/webhooks/stripe`
   - Ou pour tester : `https://orbitalastro-web.fly.dev/api/webhooks/stripe`
4. **Events to send** : Sélectionnez ces événements :
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `charge.refunded`
5. Cliquez sur **"Add endpoint"**
6. **Copiez le "Signing secret"** (commence par `whsec_...`)

### Ajouter le secret du webhook

```powershell
# En production
flyctl secrets set STRIPE_WEBHOOK_SECRET=whsec_... -a orbitalastro-web
```

## 📋 Étape 6 : Tester

1. **Tester le webhook** :
   - Dans Stripe Dashboard → Webhooks → Votre endpoint
   - Cliquez sur **"Send test webhook"**
   - Sélectionnez `checkout.session.completed`
   - Vérifiez les logs dans Supabase → **"Logs"** → **"Postgres Logs"**

2. **Tester un paiement** :
   - Achetez un produit sur `/pricing`
   - Vérifiez dans Supabase → **"Table Editor"** → `payments`
   - Vérifiez dans `user_access` que l'accès a été créé

## ✅ Vérification

### Vérifier que les tables existent

Dans Supabase → **"Table Editor"**, vous devriez voir :
- ✅ `payments`
- ✅ `user_access`

### Vérifier un paiement

1. Allez dans **"Table Editor"** → `payments`
2. Vous devriez voir les paiements enregistrés
3. Allez dans `user_access` pour voir les accès créés

## 🔒 Sécurité

- ⚠️ **NE JAMAIS** exposer `SUPABASE_SERVICE_ROLE_KEY` au frontend
- ⚠️ Utilisez uniquement `NEXT_PUBLIC_SUPABASE_URL` dans le frontend
- ⚠️ Toutes les opérations de base de données doivent passer par les API routes

## 📝 Notes

- Les webhooks Stripe peuvent prendre quelques secondes pour être traités
- Les accès sont créés automatiquement après un paiement réussi
- Les abonnements mensuels expirent après 1 mois
- Les achats uniques n'expirent pas

