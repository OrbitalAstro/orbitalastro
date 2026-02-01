# 🗄️ Configuration de la Base de Données - Guide Rapide

## ✅ Ce qui a été créé

1. **Schéma de base de données** (`web/database/schema.sql`)
   - Table `payments` : Enregistre tous les paiements
   - Table `user_access` : Gère les accès utilisateurs
   - Triggers automatiques : Crée l'accès après paiement
   - Vue `active_access` : Vérifie rapidement les accès actifs

2. **Webhook Stripe** (`web/app/api/webhooks/stripe/route.ts`)
   - Enregistre automatiquement les paiements dans la base de données
   - Gère les événements : `checkout.session.completed`, `charge.refunded`

3. **API de vérification** (`web/app/api/payments/check-access/route.ts`)
   - Vérifie si un utilisateur a accès à un produit
   - Utilise la base de données Supabase

4. **Système de vérification amélioré** (`web/lib/checkPayment.ts`)
   - Vérifie d'abord le cache local (localStorage)
   - Puis vérifie dans la base de données
   - Utilise l'email comme identifiant

## 🚀 Étapes pour activer la base de données

### 1. Créer un compte Supabase (5 minutes)

1. Allez sur [https://supabase.com](https://supabase.com)
2. Créez un compte gratuit
3. Créez un nouveau projet :
   - Nom : `orbitalastro`
   - Mot de passe : Choisissez un mot de passe fort
   - Région : Canada (Central) ou la plus proche

### 2. Créer les tables (2 minutes)

1. Dans Supabase → **"SQL Editor"**
2. Cliquez sur **"New query"**
3. Ouvrez le fichier `web/database/schema.sql`
4. Copiez tout le contenu
5. Collez dans l'éditeur SQL
6. Cliquez sur **"Run"**

✅ Vous devriez voir : Tables créées, Index créés, Triggers créés

### 3. Récupérer les clés API (1 minute)

1. Dans Supabase → **"Settings"** → **"API"**
2. Copiez :
   - **Project URL** : `https://xxxxx.supabase.co`
   - **Service Role Key** : `eyJhbGc...` (⚠️ SECRET)

### 4. Configurer les variables d'environnement

#### En local (`web/.env.local`)

```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
```

#### En production (Fly.io)

```powershell
flyctl secrets set NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co -a orbitalastro-web
flyctl secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... -a orbitalastro-web
```

### 5. Configurer le webhook Stripe (3 minutes)

1. Allez dans [Stripe Dashboard](https://dashboard.stripe.com) → **"Webhooks"**
2. Cliquez sur **"+ Add endpoint"**
3. **Endpoint URL** : `https://www.orbitalastro.ca/api/webhooks/stripe`
4. **Events** : Sélectionnez :
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `charge.refunded`
5. Cliquez sur **"Add endpoint"**
6. **Copiez le "Signing secret"** (commence par `whsec_...`)

#### Ajouter le secret du webhook

```powershell
flyctl secrets set STRIPE_WEBHOOK_SECRET=whsec_... -a orbitalastro-web
```

### 6. Redéployer

```powershell
cd web
flyctl deploy -a orbitalastro-web
```

## ✅ Vérification

### Vérifier que les tables existent

Dans Supabase → **"Table Editor"**, vous devriez voir :
- ✅ `payments`
- ✅ `user_access`

### Tester un paiement

1. Achetez un produit sur `/pricing`
2. Vérifiez dans Supabase → **"Table Editor"** → `payments`
   - Un nouveau paiement devrait apparaître
3. Vérifiez dans `user_access`
   - Un accès devrait être créé automatiquement

### Tester la vérification

1. Allez sur `/dialogues` avec l'email utilisé pour le paiement
2. Le formulaire devrait être activé
3. Vous pouvez générer le dialogue

## 📊 Structure de la base de données

### Table `payments`
- `id` : UUID unique
- `stripe_session_id` : ID de la session Stripe
- `customer_email` : Email du client
- `product_id` : ID du produit ('dialogue', 'reading-2026', etc.)
- `amount_paid` : Montant payé
- `status` : Statut du paiement ('paid', 'pending', etc.)

### Table `user_access`
- `id` : UUID unique
- `customer_email` : Email du client
- `product_id` : ID du produit
- `payment_id` : Référence au paiement
- `expires_at` : Date d'expiration (NULL pour les achats uniques)

## 🔄 Flux complet

1. **Utilisateur paie** → Stripe Checkout
2. **Stripe envoie webhook** → `/api/webhooks/stripe`
3. **Webhook enregistre** → Table `payments`
4. **Trigger automatique** → Crée l'accès dans `user_access`
5. **Utilisateur génère** → Vérifie dans `user_access`
6. **Accès confirmé** → Génération autorisée

## ⚠️ Important

- ⚠️ **NE JAMAIS** exposer `SUPABASE_SERVICE_ROLE_KEY` au frontend
- ⚠️ Utilisez uniquement `NEXT_PUBLIC_SUPABASE_URL` dans le frontend
- ⚠️ Toutes les opérations de base de données passent par les API routes

## 🎯 Résultat

Une fois configuré :
- ✅ Les paiements sont enregistrés automatiquement
- ✅ Les accès sont créés automatiquement
- ✅ La vérification utilise la base de données
- ✅ Les accès persistent entre appareils
- ✅ Les remboursements sont gérés automatiquement

