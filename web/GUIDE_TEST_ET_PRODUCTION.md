# Guide : Tester sans frais + Paiements réels

## ✅ Solution mise en place

Le code détecte automatiquement si vous utilisez des clés **TEST** ou **LIVE** et utilise les bons Price IDs.

### Comment ça fonctionne

1. **En local** (`.env.local` avec `pk_test_...`) :
   - Utilise automatiquement les Price IDs de TEST
   - Vous pouvez tester avec des cartes de test (4242 4242 4242 4242)
   - **Aucun frais réel** ✅

2. **En production** (Fly.io avec `pk_live_...`) :
   - Utilise automatiquement les Price IDs de LIVE (une fois que vous les aurez ajoutés)
   - Les clients paient avec de vraies cartes
   - **Paiements réels** ✅

---

## 📋 Configuration étape par étape

### Étape 1 : Configuration locale (pour tester)

Créez `web/.env.local` avec vos clés de TEST :

```bash
# Stripe Configuration - MODE TEST (pour développement local)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_TEST
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_TEST
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_WEBHOOK_SECRET_TEST
```

**Où trouver :**
- Dashboard Stripe → **Test mode** → Developers → API keys

**Test :**
- Utilisez la carte de test : `4242 4242 4242 4242`
- Aucun frais réel ✅

---

### Étape 2 : Créer les produits en production

1. Dashboard Stripe → **Live mode** (toggle en haut à droite)
2. Products → Add product
3. Créez les 3 produits :
   - Dialogue pré-incarnation (9.99 CAD)
   - Lecture 2026 (9.99 CAD)
   - Saint-Valentin 2026 (14.00 CAD)
4. **Copiez les Price IDs** (commencent par `price_...`)

---

### Étape 3 : Mettre à jour le code avec les Price IDs de production

Une fois que vous avez les Price IDs de production, modifiez `web/lib/stripe.ts` :

```typescript
stripePriceId: getPriceId(
  'price_1Sr8qkJOod2H9eSE8QV72G4p', // TEST (déjà là)
  'price_1VOTRE_NOUVEAU_PRICE_ID_LIVE' // LIVE (à ajouter)
),
```

Faites ça pour les 3 produits.

---

### Étape 4 : Configurer Fly.io avec les clés LIVE

```bash
# Mettre à jour les clés Stripe en production
flyctl secrets set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_VOTRE_CLE_LIVE -a orbitalastro-web
flyctl secrets set STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_LIVE -a orbitalastro-web
flyctl secrets set STRIPE_WEBHOOK_SECRET=whsec_VOTRE_WEBHOOK_SECRET_LIVE -a orbitalastro-web
```

**Où trouver :**
- Dashboard Stripe → **Live mode** → Developers → API keys
- Dashboard Stripe → **Live mode** → Developers → Webhooks → Créer endpoint pour `https://www.orbitalastro.ca/api/webhooks/stripe`

---

### Étape 5 : Redéployer

```bash
git add web/lib/stripe.ts
git commit -m "Ajout des Price IDs de production Stripe"
git push
flyctl deploy -a orbitalastro-web
```

---

## 🎯 Résultat

| Environnement | Clés utilisées | Price IDs utilisés | Frais |
|--------------|----------------|-------------------|-------|
| **Local** (`npm run dev`) | `pk_test_...` (depuis `.env.local`) | Price IDs de TEST | ❌ Aucun |
| **Production** (orbitalastro.ca) | `pk_live_...` (depuis Fly.io) | Price IDs de LIVE | ✅ Réels |

---

## 🔍 Vérification

### Vérifier quel mode est utilisé

Le code détecte automatiquement selon la clé `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` :
- Si elle commence par `pk_test_` → Mode TEST (Price IDs de test)
- Si elle commence par `pk_live_` → Mode LIVE (Price IDs de production)

### Tester en local

1. Assurez-vous que `.env.local` contient `pk_test_...`
2. Lancez `npm run dev`
3. Allez sur `http://localhost:3000/pricing`
4. Utilisez la carte de test : `4242 4242 4242 4242`
5. Vérifiez dans Stripe Dashboard (Test mode) que le paiement apparaît

### Tester en production

1. Vérifiez que Fly.io a les clés `pk_live_...`
2. Allez sur `https://www.orbitalastro.ca/pricing`
3. Faites un petit test avec une vraie carte (vous serez débité)
4. Vérifiez dans Stripe Dashboard (Live mode) que le paiement apparaît

---

## 💡 Avantages de cette approche

✅ **Pas besoin de changer de code** : Le même code fonctionne en test et en production
✅ **Sécurité** : Les clés de test restent locales, les clés live sont dans Fly.io
✅ **Flexibilité** : Vous pouvez tester en local sans frais, et avoir les vrais paiements en production
✅ **Simplicité** : Détection automatique selon les clés configurées

---

## 🆘 En cas de problème

### Le code utilise toujours les Price IDs de test en production

**Cause :** Vous n'avez pas encore ajouté les Price IDs de production dans `web/lib/stripe.ts`

**Solution :** Ajoutez les Price IDs de production comme deuxième paramètre dans `getPriceId()`

### Les paiements ne fonctionnent pas en local

**Vérifiez :**
1. Que `.env.local` existe et contient `pk_test_...`
2. Que vous avez redémarré le serveur après avoir créé/modifié `.env.local`
3. Que les Price IDs de test sont corrects dans `web/lib/stripe.ts`

### Les paiements ne fonctionnent pas en production

**Vérifiez :**
1. Que Fly.io a les bonnes clés : `flyctl secrets list -a orbitalastro-web`
2. Que les clés commencent par `pk_live_` et `sk_live_`
3. Que vous avez ajouté les Price IDs de production dans `web/lib/stripe.ts`
4. Que le webhook est configuré dans Stripe (Live mode)
