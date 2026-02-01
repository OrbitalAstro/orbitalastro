# Configurer Stripe maintenant - Guide étape par étape

## ✅ Ce qui fonctionne déjà

- ✅ Page `/pricing` s'affiche
- ✅ Les 3 plans sont visibles
- ⚠️ Le bouton "S'abonner" affiche une alerte (normal, Stripe pas configuré)

## 📋 Pour activer Stripe (15-20 minutes)

### Étape 1 : Créer un compte Stripe (5 min)

1. Allez sur **https://stripe.com**
2. Cliquez sur **"S'inscrire"** ou **"Sign up"**
3. Remplissez :
   - Email
   - Mot de passe
   - Pays : **Canada**
4. Complétez votre profil entreprise (nom, adresse, etc.)

### Étape 2 : Récupérer les clés API (2 min)

1. Une fois connecté, allez sur le **Dashboard Stripe**
2. Cliquez sur **"Developers"** dans le menu de gauche
3. Cliquez sur **"API keys"**
4. Vous verrez deux clés :
   - **Publishable key** : Commence par `pk_test_...` (pour le frontend)
   - **Secret key** : Commence par `sk_test_...` (pour le backend - NE JAMAIS exposer)

**Important** : Utilisez les clés **TEST** (`pk_test_` / `sk_test_`) pour commencer.

### Étape 3 : Créer les produits dans Stripe (5 min)

1. Dans le Dashboard Stripe, allez sur **"Products"**
2. Cliquez sur **"Add product"**

#### Produit 1 : Mensuel

- **Name** : `Orbital Astro - Mensuel`
- **Description** : `Abonnement mensuel - Calculs astrologiques illimités`
- **Pricing** :
  - **Price** : `9.99`
  - **Currency** : `CAD` (Canadian Dollar)
  - **Billing period** : `Recurring` → `Monthly`
- Cliquez sur **"Save product"**
- **Copiez le Price ID** : Il commence par `price_...` (ex: `price_1ABC123...`)

#### Produit 2 : Annuel

- **Name** : `Orbital Astro - Annuel`
- **Description** : `Abonnement annuel - 2 mois gratuits`
- **Pricing** :
  - **Price** : `99.99`
  - **Currency** : `CAD`
  - **Billing period** : `Recurring` → `Yearly`
- Cliquez sur **"Save product"**
- **Copiez le Price ID** : Il commence par `price_...` (ex: `price_1XYZ789...`)

### Étape 4 : Ajouter les clés dans .env.local (2 min)

Ouvrez `web/.env.local` et ajoutez :

```bash
# Stripe (clés TEST)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_ICI
```

**Important** : Remplacez `pk_test_VOTRE_CLE_ICI` par votre vraie clé publishable.

### Étape 5 : Mettre à jour les Price IDs (2 min)

Ouvrez `web/lib/stripe.ts` et remplacez les `stripePriceId` vides :

```typescript
{
  id: 'monthly',
  name: 'Mensuel',
  price: 9.99,
  currency: 'cad',
  interval: 'month',
  features: [...],
  stripePriceId: 'price_1ABC123...', // ← Votre Price ID mensuel ici
},
{
  id: 'yearly',
  name: 'Annuel',
  price: 99.99,
  currency: 'cad',
  interval: 'year',
  features: [...],
  stripePriceId: 'price_1XYZ789...', // ← Votre Price ID annuel ici
},
```

### Étape 6 : Ajouter la clé secrète (backend) (1 min)

Créez ou modifiez `.env` à la racine du projet (pas dans `web/`) :

```bash
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE_ICI
```

**Important** : Remplacez `sk_test_VOTRE_CLE_SECRETE_ICI` par votre vraie clé secrète.

### Étape 7 : Redémarrer le serveur (1 min)

1. Arrêtez le serveur (Ctrl+C dans le terminal)
2. Redémarrez :
   ```powershell
   npm run dev:fast
   ```

## ✅ Test après configuration

1. Allez sur **http://localhost:3000/pricing**
2. Cliquez sur **"S'abonner"** pour le plan mensuel
3. Vous devriez être redirigé vers **Stripe Checkout**
4. Utilisez une **carte de test Stripe** :
   - Numéro : `4242 4242 4242 4242`
   - Date : N'importe quelle date future (ex: 12/25)
   - CVC : N'importe quel 3 chiffres (ex: 123)
   - ZIP : N'importe quel code postal
5. Complétez le paiement
6. Vous serez redirigé vers `/pricing?success=true`

## 🎯 Résumé des fichiers à modifier

1. **`web/.env.local`** : Ajouter `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
2. **`.env`** (racine) : Ajouter `STRIPE_SECRET_KEY`
3. **`web/lib/stripe.ts`** : Remplir les `stripePriceId`

## ⚠️ Notes importantes

- **Mode TEST** : Utilisez les clés `pk_test_` et `sk_test_` pour tester
- **Pas de vrais paiements** : En mode test, aucun vrai argent n'est débité
- **Production** : Quand vous serez prêt, passez aux clés `pk_live_` et `sk_live_`

## 🆘 Besoin d'aide ?

Si vous avez des questions pendant la configuration, dites-moi où vous êtes bloqué !

