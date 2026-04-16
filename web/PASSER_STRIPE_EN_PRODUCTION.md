# Passer Stripe en mode Production - Guide complet

## 🎯 Objectif

Activer les paiements réels sur votre site en passant de Stripe Test Mode à Stripe Live Mode.

## ⚠️ Important avant de commencer

- **Les paiements seront RÉELS** : Les clients seront débités de vraie monnaie
- **Assurez-vous que votre compte Stripe est activé** : Vous devez avoir complété toutes les informations d'entreprise
- **Testez d'abord en mode test** : Vérifiez que tout fonctionne avant de passer en production

---

## 📋 Étapes pour passer en production

### Étape 1 : Activer votre compte Stripe en production (10-15 min)

1. Connectez-vous à votre **Dashboard Stripe** : https://dashboard.stripe.com
2. Vérifiez que votre compte est activé :
   - Allez dans **Settings** → **Account details**
   - Assurez-vous que toutes les informations sont complètes :
     - Nom de l'entreprise
     - Adresse
     - Numéro de téléphone
     - Informations bancaires (pour recevoir les paiements)
   - Si ce n'est pas fait, complétez les informations manquantes

3. **Activer le mode Live** :
   - En haut à droite du Dashboard, vous verrez un toggle **"Test mode"** / **"Live mode"**
   - Cliquez pour passer en **"Live mode"**
   - Stripe vous demandera peut-être de confirmer certaines informations

---

### Étape 2 : Récupérer les clés API de production (2 min)

1. Dans le Dashboard Stripe en **Live mode**, allez dans **Developers** → **API keys**
2. Vous verrez maintenant les clés **Live** :
   - **Publishable key** : Commence par `pk_live_...` (pour le frontend)
   - **Secret key** : Commence par `sk_live_...` (pour le backend - NE JAMAIS exposer publiquement)

3. **Copiez ces deux clés** (vous en aurez besoin plus tard)

---

### Étape 3 : Créer les produits en production (10 min)

⚠️ **Important** : Les Price IDs de test sont différents de ceux de production. Vous devez créer les produits en mode Live.

1. Assurez-vous d'être en **Live mode** dans Stripe
2. Allez dans **Products** → **Add product**

#### Produit 1 : Dialogue pré-incarnation

- **Name** : `Dialogue pré-incarnation`
- **Description** : `Génération d'un dialogue pré-incarnation`
- **Pricing** :
  - **Price** : `9.99`
  - **Currency** : `CAD` (Canadian Dollar)
  - **Billing period** : `One time`
- Cliquez sur **"Save product"**
- **Copiez le Price ID** : Il commence par `price_...` (ex: `price_1ABC123...`)
- **Notez ce Price ID** : Vous devrez le mettre dans `web/lib/stripe.ts`

#### Produit 2 : Lecture 2026

- **Name** : `Lecture 2026`
- **Description** : `Générer la lecture astrologie de l'année 2026`
- **Pricing** :
  - **Price** : `9.99`
  - **Currency** : `CAD`
  - **Billing period** : `One time`
- Cliquez sur **"Save product"**
- **Copiez le Price ID** : Il commence par `price_...`
- **Notez ce Price ID**

#### Produit 3 : Saint-Valentin 2026

- **Name** : `Saint-Valentin 2026`
- **Description** : `Synastrie Saint-Valentin 2026`
- **Pricing** :
  - **Price** : `14.00`
  - **Currency** : `CAD`
  - **Billing period** : `One time`
- Cliquez sur **"Save product"**
- **Copiez le Price ID** : Il commence par `price_...`
- **Notez ce Price ID**

---

### Étape 4 : Mettre à jour les Price IDs dans le code (2 min)

1. Ouvrez `web/lib/stripe.ts`
2. Remplacez les `stripePriceId` avec les nouveaux Price IDs de production :

```typescript
export const oneTimeProducts: Product[] = [
  {
    id: 'dialogue',
    name: 'Dialogue pré-incarnation',
    description: 'Génération d\'un dialogue pré-incarnation.',
    price: 9.99,
    currency: 'cad',
    stripePriceId: 'price_1VOTRE_NOUVEAU_PRICE_ID_DIALOGUE', // ← Remplacez ici
    type: 'one-time',
    launchOffer: true,
  },
  {
    id: 'reading-2026',
    name: 'Lecture 2026',
    description: 'Générer la lecture astrologie de l\'année 2026',
    price: 9.99,
    currency: 'cad',
    stripePriceId: 'price_1VOTRE_NOUVEAU_PRICE_ID_LECTURE', // ← Remplacez ici
    type: 'one-time',
    launchOffer: true,
  },
  {
    id: 'valentine-2026',
    name: 'Saint-Valentin 2026',
    description: 'Synastrie Saint-Valentin 2026',
    price: 14.00,
    currency: 'cad',
    stripePriceId: 'price_1VOTRE_NOUVEAU_PRICE_ID_VALENTINE', // ← Remplacez ici
    type: 'one-time',
    launchOffer: false,
  },
]
```

---

### Étape 5 : Mettre à jour les variables d'environnement dans Fly.io (5 min)

1. Connectez-vous à Fly.io : https://fly.io/dashboard
2. Sélectionnez votre application : `orbitalastro-web`
3. Allez dans **Settings** → **Secrets**
4. Mettez à jour les variables suivantes :

#### Variables à mettre à jour :

- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` : Remplacez par votre clé `pk_live_...`
- `STRIPE_SECRET_KEY` : Remplacez par votre clé `sk_live_...`
- `STRIPE_WEBHOOK_SECRET` : Vous devrez le créer à l'étape suivante

#### Commandes Fly.io (alternative) :

```bash
# Mettre à jour la clé publishable
flyctl secrets set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_VOTRE_CLE_ICI -a orbitalastro-web

# Mettre à jour la clé secrète
flyctl secrets set STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_ICI -a orbitalastro-web
```

---

### Étape 6 : Configurer le webhook Stripe en production (5 min)

1. Dans le Dashboard Stripe en **Live mode**, allez dans **Developers** → **Webhooks**
2. Cliquez sur **"Add endpoint"**
3. Configurez le webhook :
   - **Endpoint URL** : `https://www.orbitalastro.ca/api/webhooks/stripe`
   - **Description** : `Orbital Astro - Production Webhook`
   - **Events to send** : Sélectionnez les événements suivants :
     - `checkout.session.completed`
     - `payment_intent.succeeded`
     - `charge.refunded` (optionnel)
4. Cliquez sur **"Add endpoint"**
5. **Copiez le "Signing secret"** : Il commence par `whsec_...`
6. **Ajoutez-le dans Fly.io** :

```bash
flyctl secrets set STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_ICI -a orbitalastro-web
```

---

### Étape 7 : Redéployer l'application (2 min)

Après avoir mis à jour les variables d'environnement et le code :

```bash
# Commit les changements
git add web/lib/stripe.ts
git commit -m "Mise à jour des Price IDs Stripe pour la production"
git push

# Redéployer sur Fly.io
flyctl deploy -a orbitalastro-web
```

---

## ✅ Vérification après activation

1. **Testez un paiement réel** (avec une petite somme) :
   - Allez sur https://www.orbitalastro.ca/pricing
   - Cliquez sur un produit
   - Utilisez une **vraie carte de crédit** (vous serez débité)
   - Complétez le paiement

2. **Vérifiez dans Stripe Dashboard** :
   - Allez dans **Payments** (en Live mode)
   - Vous devriez voir le paiement apparaître

3. **Vérifiez les webhooks** :
   - Allez dans **Developers** → **Webhooks**
   - Cliquez sur votre endpoint
   - Vérifiez que les événements sont bien reçus (statut 200)

---

## 🔄 Retour en mode test (si nécessaire)

Si vous devez revenir en mode test temporairement :

1. Remettez les clés de test dans Fly.io :
```bash
flyctl secrets set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... -a orbitalastro-web
flyctl secrets set STRIPE_SECRET_KEY=sk_test_... -a orbitalastro-web
```

2. Remettez les Price IDs de test dans `web/lib/stripe.ts`

3. Redéployez

---

## 📝 Checklist finale

Avant de passer en production, vérifiez que :

- [ ] Votre compte Stripe est activé et complet
- [ ] Vous avez créé tous les produits en mode Live
- [ ] Vous avez mis à jour les Price IDs dans `web/lib/stripe.ts`
- [ ] Vous avez mis à jour les clés API dans Fly.io (pk_live_ et sk_live_)
- [ ] Vous avez configuré le webhook en production
- [ ] Vous avez ajouté le STRIPE_WEBHOOK_SECRET dans Fly.io
- [ ] Vous avez redéployé l'application
- [ ] Vous avez testé un paiement réel (petite somme)

---

## 🆘 Besoin d'aide ?

Si vous rencontrez des problèmes :

1. Vérifiez les logs Fly.io : `flyctl logs -a orbitalastro-web`
2. Vérifiez les logs Stripe Dashboard → **Developers** → **Logs**
3. Vérifiez que les variables d'environnement sont bien définies : `flyctl secrets list -a orbitalastro-web`

---

## 💡 Conseils

- **Gardez les clés de test** : Vous pourrez toujours tester en local avec les clés de test
- **Surveillez les premiers paiements** : Vérifiez que tout fonctionne correctement
- **Documentez vos Price IDs** : Gardez une trace de vos Price IDs de production dans un endroit sûr
