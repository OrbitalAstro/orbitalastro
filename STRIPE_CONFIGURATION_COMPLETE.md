# Configuration Stripe - Modèle complet (Vente à la pièce + Abonnement)

## 📋 Modèle de pricing

### Services à la pièce (Paiement unique)
- ✅ **Dialogue Pré-Incarnation** : 9,99$ CAD (offre de lancement)
- ✅ **Lecture 2026** : 9,99$ CAD (offre de lancement)
- ✅ **Codes promo** : Pour la Lecture 2026 (personnes ayant répondu au sondage)

### Abonnement
- ✅ **Abonnement Mensuel** : 12,99$ CAD / mois
  - Lectures astrologiques illimitées
  - Suivi des transits en temps réel
  - Dialogues pré-incarnation
  - Calculs de thème natal avancés
  - Progressions et retours solaires
  - Export PDF de vos analyses
  - Support prioritaire

## 🔧 Configuration Stripe

### 1. Créer un compte Stripe

1. Allez sur **https://stripe.com**
2. Créez un compte (gratuit)
3. Récupérez vos clés API : **Dashboard → Developers → API keys**
   - **Publishable key** : `pk_test_...` (pour le frontend)
   - **Secret key** : `sk_test_...` (pour le backend)

### 2. Créer les produits dans Stripe

#### Produit 1 : Dialogue Pré-Incarnation (Paiement unique)

1. **Dashboard Stripe → Products → Add product**
- **Name** : `Dialogue Pré-Incarnation`
- **Description** : `Générez votre dialogue mythopoétique entre votre âme et le conseil cosmique avant votre naissance.`
- **Pricing** :
  - **Price** : `9.99`
  - **Currency** : `CAD`
  - **Billing period** : `One time` ⚠️ (pas "Recurring")
- Cliquez sur **"Save product"**
- **Copiez le Price ID** : `price_...`

#### Produit 2 : Lecture 2026 (Paiement unique)

1. **Dashboard Stripe → Products → Add product**
- **Name** : `Lecture 2026`
- **Description** : `Votre lecture astrologique complète pour l'année 2026, basée sur votre thème natal et les transits à venir.`
- **Pricing** :
  - **Price** : `9.99`
  - **Currency** : `CAD`
  - **Billing period** : `One time` ⚠️ (pas "Recurring")
- Cliquez sur **"Save product"**
- **Copiez le Price ID** : `price_...`

#### Produit 3 : Abonnement Mensuel (Abonnement récurrent)

1. **Dashboard Stripe → Products → Add product**
- **Name** : `Abonnement Mensuel Orbital Astro`
- **Description** : `Accès complet à toutes les fonctionnalités astrologiques.`
- **Pricing** :
  - **Price** : `12.99`
  - **Currency** : `CAD`
  - **Billing period** : `Recurring` → `Monthly` ⚠️ (c'est un abonnement)
- Cliquez sur **"Save product"**
- **Copiez le Price ID** : `price_...`

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

### 4. Ajouter les clés dans `.env.local`

Dans `web/.env.local`, ajoutez :

```bash
# Stripe (clés TEST)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_ICI
```

### 5. Mettre à jour les Price IDs

Ouvrez `web/lib/stripe.ts` et remplissez les `stripePriceId` :

```typescript
// Produits à la pièce
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

// Abonnements
{
  id: 'monthly',
  // ...
  stripePriceId: 'price_1DEF456...', // ← Votre Price ID Abonnement Mensuel
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
2. Vous devriez voir :
   - **Section "Services à la pièce"** : Dialogue et Lecture 2026
   - **Section "Abonnement"** : Abonnement Mensuel
3. Testez le code promo (si configuré)
4. Cliquez sur **"Acheter maintenant"** ou **"S'abonner maintenant"**
5. Vous serez redirigé vers Stripe Checkout
6. Utilisez une **carte de test** : `4242 4242 4242 4242`

## 📝 Différences importantes

### Paiement unique vs Abonnement

- **Paiement unique** (`mode: 'payment'`) :
  - Dialogue Pré-Incarnation
  - Lecture 2026
  - Paiement une seule fois
  - Pas de renouvellement

- **Abonnement** (`mode: 'subscription'`) :
  - Abonnement Mensuel
  - Paiement récurrent chaque mois
  - Renouvellement automatique
  - Peut être annulé à tout moment

## 🎯 Prochaines étapes

1. ✅ Configuration Stripe (compte + produits)
2. ⏳ Créer les codes promo uniques
3. ⏳ Tester le flux de paiement (paiement unique et abonnement)
4. ⏳ Gérer l'accès aux produits après paiement (webhooks)
5. ⏳ Gérer l'accès aux fonctionnalités selon l'abonnement

## 📚 Fichiers créés

- `web/lib/stripe.ts` - Configuration des produits et abonnements
- `web/app/pricing/page.tsx` - Page de pricing avec sections séparées
- `web/app/api/stripe/checkout/route.ts` - Route API pour paiement unique ET abonnement
- `web/app/api/stripe/validate-promo/route.ts` - Route API pour valider les codes promo

