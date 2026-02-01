# Configuration Stripe - Vente à la pièce

## 📋 Nouveau modèle de pricing

- ✅ **Pas de plan gratuit**
- ✅ **Vente à la pièce** (paiement unique, pas d'abonnement)
- ✅ **2 produits** :
  - Dialogue Pré-Incarnation : 9,99$ CAD (offre de lancement)
  - Lecture 2026 : 9,99$ CAD (offre de lancement)
- ✅ **Codes promo** : Codes uniques pour la Lecture 2026 (pour les personnes ayant répondu au sondage)

## 🔧 Configuration Stripe

### 1. Créer un compte Stripe

1. Allez sur **https://stripe.com**
2. Créez un compte (gratuit)
3. Récupérez vos clés API : **Dashboard → Developers → API keys**
   - **Publishable key** : `pk_test_...` (pour le frontend)
   - **Secret key** : `sk_test_...` (pour le backend)

### 2. Créer les produits dans Stripe (Paiement unique)

1. **Dashboard Stripe → Products → Add product**

**Produit 1 : Dialogue Pré-Incarnation**
- **Name** : `Dialogue Pré-Incarnation`
- **Description** : `Générez votre dialogue mythopoétique entre votre âme et le conseil cosmique avant votre naissance.`
- **Pricing** :
  - **Price** : `9.99`
  - **Currency** : `CAD` (Canadian Dollar)
  - **Billing period** : `One time` (pas "Recurring")
- Cliquez sur **"Save product"**
- **Copiez le Price ID** : Il commence par `price_...` (ex: `price_1ABC123...`)

**Produit 2 : Lecture 2026**
- **Name** : `Lecture 2026`
- **Description** : `Votre lecture astrologique complète pour l'année 2026, basée sur votre thème natal et les transits à venir.`
- **Pricing** :
  - **Price** : `9.99`
  - **Currency** : `CAD`
  - **Billing period** : `One time` (pas "Recurring")
- Cliquez sur **"Save product"**
- **Copiez le Price ID** : Il commence par `price_...` (ex: `price_1XYZ789...`)

### 3. Créer les codes promo dans Stripe (Optionnel)

Pour les codes promo uniques pour la Lecture 2026 :

1. **Dashboard Stripe → Products → Coupons**
2. Cliquez sur **"Create coupon"**
3. Pour chaque personne ayant répondu au sondage :
   - **Code** : Le code unique (ex: `SONDAGE2026-ABC123`)
   - **Discount** : Le pourcentage ou montant (ex: 100% = gratuit, ou 50% = 4,99$)
   - **Duration** : `Once` (utilisable une seule fois)
   - **Redeem by** : Date d'expiration (optionnel)
4. Cliquez sur **"Create coupon"**

**Note** : Vous pouvez aussi gérer les codes promo dans votre base de données si vous préférez.

### 4. Ajouter les clés dans `.env.local`

Dans `web/.env.local`, ajoutez :

```bash
# Stripe (clés TEST)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_ICI
```

### 5. Mettre à jour les Price IDs

Ouvrez `web/lib/stripe.ts` et remplissez les `stripePriceId` :

```typescript
{
  id: 'dialogue',
  // ...
  stripePriceId: 'price_1ABC123...', // ← Votre Price ID Dialogue
},
{
  id: 'reading-2026',
  // ...
  stripePriceId: 'price_1XYZ789...', // ← Votre Price ID Lecture 2026
},
```

### 6. Ajouter la clé secrète backend

Créez/modifiez `.env` à la racine du projet :

```bash
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE_ICI
```

### 7. Redémarrer le serveur

```powershell
Ctrl+C  # Arrêter
npm run dev:fast  # Redémarrer
```

## ✅ Test

1. Allez sur **http://localhost:3000/pricing**
2. Vous devriez voir les 2 produits (Dialogue et Lecture 2026)
3. Testez le code promo (si configuré)
4. Cliquez sur **"Acheter maintenant"**
5. Vous serez redirigé vers Stripe Checkout
6. Utilisez une **carte de test** : `4242 4242 4242 4242`

## 📝 Gestion des codes promo

### Option 1 : Codes promo Stripe (Recommandé)

- Créez les coupons dans Stripe Dashboard
- Le code sera validé automatiquement par Stripe
- Avantage : Gestion centralisée dans Stripe

### Option 2 : Codes promo personnalisés (Base de données)

- Stockez les codes dans votre base de données
- Validez via l'API `/api/stripe/validate-promo`
- Avantage : Plus de contrôle, peut lier aux utilisateurs

## 🎯 Prochaines étapes

1. ✅ Configuration Stripe (compte + produits)
2. ⏳ Créer les codes promo uniques
3. ⏳ Tester le flux de paiement
4. ⏳ Gérer l'accès aux produits après paiement (webhooks)

## 📚 Fichiers créés

- `web/lib/stripe.ts` - Configuration des produits
- `web/app/pricing/page.tsx` - Page de pricing avec code promo
- `web/app/api/stripe/checkout/route.ts` - Route API pour paiement unique
- `web/app/api/stripe/validate-promo/route.ts` - Route API pour valider les codes promo

