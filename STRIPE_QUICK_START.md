# Configuration Stripe - Guide rapide

## ✅ Fichiers créés

- ✅ `web/lib/stripe.ts` - Client Stripe et configuration des plans
- ✅ `web/app/api/stripe/checkout/route.ts` - Route API pour créer une session de checkout
- ✅ `web/app/pricing/page.tsx` - Page de pricing avec les plans
- ✅ Dépendances Stripe installées (`@stripe/stripe-js`, `stripe`)

## 📋 Prochaines étapes pour activer Stripe

### 1. Créer un compte Stripe (5 min)

1. Allez sur **https://stripe.com**
2. Créez un compte (gratuit)
3. Récupérez vos clés API : **Dashboard → Developers → API keys**
   - **Publishable key** : `pk_test_...` (pour le frontend)
   - **Secret key** : `sk_test_...` (pour le backend)

### 2. Créer les produits dans Stripe (5 min)

1. **Dashboard Stripe → Products → Add product**

**Produit 1 : Mensuel**
- Name: `Orbital Astro - Mensuel`
- Price: `9.99` CAD
- Billing: `Recurring` → `Monthly`
- **Copiez le Price ID** (`price_...`)

**Produit 2 : Annuel**
- Name: `Orbital Astro - Annuel`
- Price: `99.99` CAD
- Billing: `Recurring` → `Yearly`
- **Copiez le Price ID** (`price_...`)

### 3. Ajouter les clés dans `.env.local` (2 min)

Dans `web/.env.local`, ajoutez :

```bash
# Stripe (clés TEST)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_ICI
```

### 4. Mettre à jour les Price IDs (2 min)

Ouvrez `web/lib/stripe.ts` et remplissez les `stripePriceId` :

```typescript
{
  id: 'monthly',
  // ...
  stripePriceId: 'price_1ABC123...', // ← Votre Price ID mensuel
},
{
  id: 'yearly',
  // ...
  stripePriceId: 'price_1XYZ789...', // ← Votre Price ID annuel
},
```

### 5. Ajouter la clé secrète backend (1 min)

Créez/modifiez `.env` à la racine du projet :

```bash
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE_ICI
```

### 6. Redémarrer le serveur

```powershell
Ctrl+C  # Arrêter
npm run dev:fast  # Redémarrer
```

## ✅ Test

1. Allez sur **http://localhost:3000/pricing**
2. Cliquez sur **"S'abonner"** (plan mensuel ou annuel)
3. Vous serez redirigé vers Stripe Checkout
4. Utilisez une **carte de test** : `4242 4242 4242 4242`

## 📚 Documentation

Consultez les fichiers pour plus de détails.

