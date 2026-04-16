# Configuration Stripe - Guide étape par étape

Vous avez créé un compte Stripe ! Suivez ces étapes pour tout configurer.

## 📋 Étape 1 : Récupérer les clés API (2 minutes)

1. **Connectez-vous à votre compte Stripe** : https://dashboard.stripe.com
2. **Cliquez sur "Developers"** dans le menu de gauche
3. **Cliquez sur "API keys"**
4. **Vous verrez deux clés** :
   - **Publishable key** : Commence par `pk_test_...` (pour le frontend)
   - **Secret key** : Commence par `sk_test_...` (pour le backend - NE JAMAIS exposer)

**Important** : Utilisez les clés **TEST** (`pk_test_` / `sk_test_`) pour commencer.

### Copier les clés

- **Publishable key** : `pk_test_...` → Copiez cette clé
- **Secret key** : Cliquez sur "Reveal test key" → Copiez cette clé

## 📋 Étape 2 : Créer les produits dans Stripe (10 minutes)

### Produit 1 : Dialogue Pré-Incarnation (Paiement unique)

1. **Dashboard Stripe → Products → Add product**
2. **Remplissez** :
   - **Name** : `Dialogue Pré-Incarnation`
   - **Description** : `Générez votre dialogue mythopoétique entre votre âme et le conseil cosmique avant votre naissance.`
3. **Pricing** :
   - **Price** : `9.99`
   - **Currency** : `CAD` (Canadian Dollar)
   - **Billing period** : **`One time`** ⚠️ (IMPORTANT : pas "Recurring")
4. **Cliquez sur "Save product"**
5. **Copiez le Price ID** : Il commence par `price_...` (ex: `price_1ABC123def456...`)
   - Vous le trouverez dans la section "Pricing" du produit créé

### Produit 2 : Lecture 2026 (Paiement unique)

1. **Dashboard Stripe → Products → Add product**
2. **Remplissez** :
   - **Name** : `Lecture 2026`
   - **Description** : `Votre lecture astrologique complète pour l'année 2026, basée sur votre thème natal et les transits à venir.`
3. **Pricing** :
   - **Price** : `9.99`
   - **Currency** : `CAD`
   - **Billing period** : **`One time`** ⚠️ (IMPORTANT : pas "Recurring")
4. **Cliquez sur "Save product"**
5. **Copiez le Price ID** : `price_...`

### Produit 3 : Abonnement Mensuel (Abonnement récurrent)

1. **Dashboard Stripe → Products → Add product**
2. **Remplissez** :
   - **Name** : `Abonnement Mensuel Orbital Astro`
   - **Description** : `Accès complet à toutes les fonctionnalités astrologiques.`
3. **Pricing** :
   - **Price** : `12.99`
   - **Currency** : `CAD`
   - **Billing period** : **`Recurring`** → Sélectionnez **`Monthly`** ⚠️ (IMPORTANT : c'est un abonnement)
4. **Cliquez sur "Save product"**
5. **Copiez le Price ID** : `price_...`

## 📋 Étape 3 : Ajouter les clés dans `.env.local` (2 minutes)

1. **Ouvrez le fichier** `web/.env.local` (créez-le s'il n'existe pas)
2. **Ajoutez** :

```bash
# Stripe (clés TEST)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_PUBLISHABLE_ICI
```

**Remplacez** `pk_test_VOTRE_CLE_PUBLISHABLE_ICI` par votre vraie clé publishable.

## 📋 Étape 4 : Ajouter la clé secrète backend (1 minute)

1. **Créez ou modifiez** le fichier `.env` à la **racine du projet** (pas dans `web/`)
2. **Ajoutez** :

```bash
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE_ICI
```

**Remplacez** `sk_test_VOTRE_CLE_SECRETE_ICI` par votre vraie clé secrète.

## 📋 Étape 5 : Mettre à jour les Price IDs (2 minutes)

1. **Ouvrez** `web/lib/stripe.ts`
2. **Trouvez** les sections avec `stripePriceId: ''`
3. **Remplacez** par vos Price IDs :

```typescript
// Produits à la pièce
{
  id: 'dialogue',
  // ...
  stripePriceId: 'price_1ABC123def456...', // ← Votre Price ID Dialogue
},
{
  id: 'reading-2026',
  // ...
  stripePriceId: 'price_1XYZ789ghi012...', // ← Votre Price ID Lecture 2026
},

// Abonnements
{
  id: 'monthly',
  // ...
  stripePriceId: 'price_1DEF456jkl345...', // ← Votre Price ID Abonnement Mensuel
},
```

## 📋 Étape 6 : Redémarrer le serveur (1 minute)

1. **Arrêtez le serveur** : `Ctrl+C` dans le terminal
2. **Redémarrez** :
   ```powershell
   npm run dev:fast
   ```

## ✅ Test

1. **Allez sur** : http://localhost:3000/pricing
2. **Cliquez sur "Acheter maintenant"** (Dialogue ou Lecture 2026)
3. **Vous devriez être redirigé vers Stripe Checkout** ! 🎉
4. **Utilisez une carte de test Stripe** :
   - Numéro : `4242 4242 4242 4242`
   - Date : N'importe quelle date future (ex: 12/25)
   - CVC : N'importe quel 3 chiffres (ex: 123)
   - ZIP : N'importe quel code postal
5. **Complétez le paiement**
6. **Vous serez redirigé vers** `/pricing?success=true`

## 🎯 Checklist

- [ ] Clés API récupérées (publishable + secret)
- [ ] 3 produits créés dans Stripe :
  - [ ] Dialogue Pré-Incarnation (One time, 9.99$ CAD)
  - [ ] Lecture 2026 (One time, 9.99$ CAD)
  - [ ] Abonnement Mensuel (Recurring Monthly, 12.99$ CAD)
- [ ] Price IDs copiés
- [ ] Clé publishable ajoutée dans `web/.env.local`
- [ ] Clé secrète ajoutée dans `.env` (racine)
- [ ] Price IDs mis à jour dans `web/lib/stripe.ts`
- [ ] Serveur redémarré
- [ ] Test réussi : redirection vers Stripe Checkout

## 🆘 Besoin d'aide ?

Si vous êtes bloqué à une étape, dites-moi où vous en êtes et je vous aiderai !

## 📝 Notes importantes

- **Mode TEST** : Utilisez les clés `pk_test_` et `sk_test_` pour tester
- **Pas de vrais paiements** : En mode test, aucun vrai argent n'est débité
- **Production** : Quand vous serez prêt, passez aux clés `pk_live_` et `sk_live_`

