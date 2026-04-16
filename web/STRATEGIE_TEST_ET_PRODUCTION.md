# Stratégie : Tester sans frais + Paiements réels en production

## 🎯 Objectif

- **En local (localhost)** : Tester avec Stripe Test Mode (cartes de test, pas de frais)
- **En production (orbitalastro.ca)** : Paiements réels avec Stripe Live Mode

## ✅ Solution : Variables d'environnement séparées

### Principe

- **`.env.local`** (local) → Clés Stripe **TEST** (`pk_test_...`, `sk_test_...`)
- **Fly.io Secrets** (production) → Clés Stripe **LIVE** (`pk_live_...`, `sk_live_...`)

---

## 📋 Configuration

### 1. Configuration locale (pour tester sans frais)

Créez ou modifiez `web/.env.local` :

```bash
# Stripe Configuration - MODE TEST (pour développement local)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_TEST_ICI
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_TEST_ICI
STRIPE_WEBHOOK_SECRET=whsec_VOTRE_WEBHOOK_SECRET_TEST_ICI
```

**Où trouver ces clés :**
- Dashboard Stripe → **Test mode** (toggle en haut à droite)
- Developers → API keys → Copiez `pk_test_...` et `sk_test_...`
- Developers → Webhooks → Créez un endpoint pour `http://localhost:3000/api/webhooks/stripe` → Copiez `whsec_...`

**Price IDs à utiliser en local :**
- Gardez les Price IDs de TEST dans `web/lib/stripe.ts` pour le développement local
- OU créez une version de test du fichier

### 2. Configuration production (pour les vrais paiements)

Dans Fly.io, configurez les secrets avec les clés **LIVE** :

```bash
# Clés Stripe LIVE (production)
flyctl secrets set NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_VOTRE_CLE_LIVE -a orbitalastro-web
flyctl secrets set STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_LIVE -a orbitalastro-web
flyctl secrets set STRIPE_WEBHOOK_SECRET=whsec_VOTRE_WEBHOOK_SECRET_LIVE -a orbitalastro-web
```

**Où trouver ces clés :**
- Dashboard Stripe → **Live mode** (toggle en haut à droite)
- Developers → API keys → Copiez `pk_live_...` et `sk_live_...`
- Developers → Webhooks → Créez un endpoint pour `https://www.orbitalastro.ca/api/webhooks/stripe` → Copiez `whsec_...`

**Price IDs à utiliser en production :**
- Mettez à jour `web/lib/stripe.ts` avec les Price IDs de **production** (ceux créés en Live mode)

---

## 🔄 Workflow recommandé

### Pour le développement local

1. Utilisez `npm run dev` (ou `npm run dev:fast`)
2. Les clés de TEST dans `.env.local` seront utilisées automatiquement
3. Testez avec des cartes de test Stripe :
   - Numéro : `4242 4242 4242 4242`
   - Date : N'importe quelle date future
   - CVC : N'importe quel 3 chiffres
   - **Aucun frais réel** ✅

### Pour la production

1. Les secrets Fly.io (clés LIVE) sont utilisés automatiquement
2. Les clients paient avec de vraies cartes
3. Les paiements sont réels ✅

---

## ⚠️ Points importants

### 1. Price IDs différents

- **Test mode** : Price IDs commencent par `price_1Sr...` (ceux que vous avez actuellement)
- **Live mode** : Price IDs commencent par `price_1...` (nouveaux, à créer)

**Solution :** Vous pouvez :
- Option A : Garder les Price IDs de test dans le code pour le dev local, et utiliser les Price IDs de production uniquement en production (via une variable d'environnement)
- Option B : Créer deux fichiers de configuration (recommandé pour plus de clarté)

### 2. Webhooks différents

- **Test** : `http://localhost:3000/api/webhooks/stripe` (pour Stripe CLI ou test local)
- **Production** : `https://www.orbitalastro.ca/api/webhooks/stripe`

### 3. Ne jamais mélanger

- ❌ Ne jamais mettre des clés LIVE dans `.env.local`
- ❌ Ne jamais mettre des clés TEST dans Fly.io (pour la production)
- ✅ Toujours vérifier dans quel mode vous êtes avant de tester

---

## 🛠️ Solution avancée : Price IDs conditionnels

Si vous voulez utiliser des Price IDs différents selon l'environnement, vous pouvez modifier `web/lib/stripe.ts` :

```typescript
// Détecter si on est en production
const isProduction = process.env.NODE_ENV === 'production' && 
                     !process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.includes('test')

// Price IDs selon l'environnement
const getPriceId = (testId: string, liveId: string) => {
  return isProduction ? liveId : testId
}

export const oneTimeProducts: Product[] = [
  {
    id: 'dialogue',
    name: 'Dialogue pré-incarnation',
    description: 'Génération d\'un dialogue pré-incarnation.',
    price: 9.99,
    currency: 'cad',
    stripePriceId: getPriceId(
      'price_1Sr8qkJOod2H9eSE8QV72G4p', // TEST
      'price_1VOTRE_PRICE_ID_LIVE'      // LIVE
    ),
    type: 'one-time',
    launchOffer: true,
  },
  // ... etc
]
```

---

## 📝 Checklist

### Configuration locale (test)

- [ ] Créer `web/.env.local` avec les clés TEST
- [ ] Tester avec des cartes de test Stripe
- [ ] Vérifier que les paiements fonctionnent en local (sans frais)

### Configuration production (live)

- [ ] Créer les produits en Live mode dans Stripe
- [ ] Récupérer les Price IDs de production
- [ ] Mettre à jour `web/lib/stripe.ts` avec les Price IDs de production
- [ ] Configurer les secrets Fly.io avec les clés LIVE
- [ ] Configurer le webhook en production
- [ ] Tester un petit paiement réel (pour vérifier)

---

## 🎯 Résumé

| Environnement | Clés Stripe | Price IDs | Webhook | Frais |
|--------------|------------|-----------|---------|-------|
| **Local** | TEST (`pk_test_...`) | TEST (`price_1Sr...`) | `localhost:3000` | ❌ Aucun |
| **Production** | LIVE (`pk_live_...`) | LIVE (`price_1...`) | `orbitalastro.ca` | ✅ Réels |

---

## 🆘 En cas de problème

1. **Vérifier quel mode vous utilisez** :
   ```bash
   # En local
   echo $NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   
   # En production
   flyctl secrets list -a orbitalastro-web
   ```

2. **Vérifier les logs** :
   ```bash
   # Production
   flyctl logs -a orbitalastro-web
   ```

3. **Tester le webhook** :
   - Dashboard Stripe → Webhooks → Votre endpoint → Voir les événements reçus
