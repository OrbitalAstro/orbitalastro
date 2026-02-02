# Guide : Passer Stripe en Production - Étape par Étape

## ✅ Ce qui a été fait

1. ✅ Message d'avertissement ajouté sur la page pricing
2. ✅ Message d'avertissement ajouté dans Stripe Checkout
3. ✅ Code mis à jour pour détecter automatiquement TEST vs LIVE

---

## 📋 Étapes pour passer en production

### Étape 1 : Activer votre compte Stripe en production (5 min)

1. Allez sur https://dashboard.stripe.com
2. **Basculez en "Live mode"** (toggle en haut à droite)
3. Si Stripe vous demande de compléter des informations :
   - Nom de l'entreprise
   - Adresse
   - Informations bancaires (pour recevoir les paiements)
   - Complétez tout ce qui est demandé

**✅ Vérification :** Vous devez voir "Live mode" en haut à droite du Dashboard

---

### Étape 2 : Récupérer les clés API de production (2 min)

1. Dans le Dashboard Stripe (en **Live mode**), allez dans **Developers** → **API keys**
2. Vous verrez maintenant les clés **Live** :
   - **Publishable key** : Commence par `pk_live_...` → **COPIEZ-LE**
   - **Secret key** : Commence par `sk_live_...` → **COPIEZ-LE** (cliquez sur "Reveal test key" si nécessaire)

**📝 Notez ces deux clés**, vous en aurez besoin à l'étape 5.

---

### Étape 3 : Créer les produits en production (10 min)

⚠️ **Important** : Les Price IDs de test ne fonctionnent pas en production. Vous devez créer les produits en mode Live.

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
- **📝 Notez ce Price ID** : `price_1...` (vous devrez le mettre dans le code)

#### Produit 2 : Lecture 2026

- **Name** : `Lecture 2026`
- **Description** : `Générer la lecture astrologie de l'année 2026`
- **Pricing** :
  - **Price** : `9.99`
  - **Currency** : `CAD`
  - **Billing period** : `One time`
- Cliquez sur **"Save product"**
- **Copiez le Price ID** : `price_1...`
- **📝 Notez ce Price ID**

#### Produit 3 : Saint-Valentin 2026

- **Name** : `Saint-Valentin 2026`
- **Description** : `Synastrie Saint-Valentin 2026`
- **Pricing** :
  - **Price** : `14.00`
  - **Currency** : `CAD`
  - **Billing period** : `One time`
- Cliquez sur **"Save product"**
- **Copiez le Price ID** : `price_1...`
- **📝 Notez ce Price ID**

---

### Étape 4 : Mettre à jour les Price IDs dans le code (2 min)

Une fois que vous avez les 3 Price IDs de production, dites-moi et je les ajouterai dans le code.

**Ou vous pouvez le faire vous-même :**

Ouvrez `web/lib/stripe.ts` et modifiez les lignes avec `getPriceId()` :

```typescript
stripePriceId: getPriceId(
  'price_1Sr8qkJOod2H9eSE8QV72G4p', // TEST (déjà là)
  'price_1VOTRE_NOUVEAU_PRICE_ID_DIALOGUE' // LIVE (à ajouter)
),
```

Faites ça pour les 3 produits.

---

### Étape 5 : Mettre à jour les variables dans Fly.io (3 min)

Utilisez ces commandes (remplacez par vos vraies clés) :

```bash
# Mettre à jour la clé publishable (LIVE)
flyctl secrets set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_VOTRE_CLE_ICI -a orbitalastro-web

# Mettre à jour la clé secrète (LIVE)
flyctl secrets set STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_ICI -a orbitalastro-web
```

**Vérification :**
```bash
flyctl secrets list -a orbitalastro-web
```

Vous devriez voir les clés avec `pk_live_...` et `sk_live_...`

---

### Étape 6 : Configurer le webhook Stripe en production (5 min)

1. Dans le Dashboard Stripe (en **Live mode**), allez dans **Developers** → **Webhooks**
2. Cliquez sur **"Add endpoint"**
3. Configurez :
   - **Endpoint URL** : `https://www.orbitalastro.ca/api/webhooks/stripe`
   - **Description** : `Orbital Astro - Production Webhook`
   - **Events to send** : Sélectionnez :
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

### Étape 7 : Commit et déploiement (2 min)

Une fois que vous avez mis à jour les Price IDs dans le code :

```bash
# Ajouter les changements
git add web/lib/stripe.ts web/app/pricing/page.tsx web/app/api/stripe/checkout/route.ts

# Commit
git commit -m "Passage Stripe en production avec messages d'avertissement"

# Push
git push

# Déployer
flyctl deploy -a orbitalastro-web
```

---

## ✅ Vérification finale

### Test 1 : Vérifier les clés

```bash
flyctl secrets list -a orbitalastro-web
```

Vérifiez que :
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` commence par `pk_live_...`
- `STRIPE_SECRET_KEY` commence par `sk_live_...`
- `STRIPE_WEBHOOK_SECRET` commence par `whsec_...`

### Test 2 : Tester un petit paiement réel

1. Allez sur https://www.orbitalastro.ca/pricing
2. Vous devriez voir le message : **"⚠️ Paiement final et définitif"**
3. Cliquez sur "Acheter maintenant" pour un produit
4. Dans Stripe Checkout, vous devriez voir le message d'avertissement
5. Faites un **petit test** avec une vraie carte (vous serez débité)
6. Vérifiez dans Stripe Dashboard (Live mode) → **Payments** que le paiement apparaît

### Test 3 : Vérifier les webhooks

1. Dashboard Stripe (Live mode) → **Developers** → **Webhooks**
2. Cliquez sur votre endpoint
3. Vérifiez que les événements sont bien reçus (statut 200)

---

## 📝 Checklist complète

Avant de considérer que c'est terminé :

- [ ] Compte Stripe activé en Live mode
- [ ] Clés API Live récupérées (`pk_live_...` et `sk_live_...`)
- [ ] 3 produits créés en Live mode
- [ ] 3 Price IDs de production notés
- [ ] Price IDs ajoutés dans `web/lib/stripe.ts`
- [ ] Clés Live configurées dans Fly.io
- [ ] Webhook configuré en production
- [ ] Webhook secret ajouté dans Fly.io
- [ ] Code commité et déployé
- [ ] Test de paiement réel effectué (petit montant)
- [ ] Vérification que le paiement apparaît dans Stripe Dashboard

---

## 🆘 En cas de problème

### Les paiements ne fonctionnent pas

1. Vérifiez les logs : `flyctl logs -a orbitalastro-web`
2. Vérifiez les clés : `flyctl secrets list -a orbitalastro-web`
3. Vérifiez les logs Stripe : Dashboard → Developers → Logs

### Le webhook ne fonctionne pas

1. Vérifiez l'URL du webhook : `https://www.orbitalastro.ca/api/webhooks/stripe`
2. Vérifiez que le secret est correct : `flyctl secrets list -a orbitalastro-web`
3. Testez manuellement : Dashboard Stripe → Webhooks → Votre endpoint → "Send test webhook"

---

## 💡 Rappel important

- **En local** : Vous pouvez toujours tester avec les clés TEST (dans `.env.local`)
- **En production** : Les clés LIVE sont utilisées automatiquement
- **Les Price IDs** : Le code détecte automatiquement lequel utiliser selon les clés

---

## 🎯 Prochaines étapes

Une fois que tout est configuré et testé :

1. Surveillez les premiers paiements réels
2. Vérifiez que les webhooks fonctionnent correctement
3. Testez un remboursement si nécessaire
4. Documentez vos Price IDs de production dans un endroit sûr
