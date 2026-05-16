# Abonnement mensuel — Journal pilote

## 1. Créer le produit dans Stripe

1. [Stripe Dashboard](https://dashboard.stripe.com/products) → **Add product**
2. Nom : **Journal pilote** (ou similaire)
3. Prix récurrent : **mensuel**, devise **CAD** — **19,99 $**
4. Copier le **Price ID** (`price_...`) en mode **Test**, puis en **Live**

## 2. Variables d'environnement

Dans `web/.env.local` (dev) et secrets Fly (`flyctl secrets set -a orbitalastro-web`) :

```bash
# Test (créé via Stripe CLI — 19,99 $ CAD / mois)
STRIPE_PRICE_JOURNAL_MONTHLY_TEST=price_1TXmKzJOod2H9eSELhFz3A3S
# Live : créer le même produit en mode live, puis :
STRIPE_PRICE_JOURNAL_MONTHLY_LIVE=price_...
```

Optionnel en local pour tester sans payer :

```bash
NEXT_PUBLIC_DEV_SKIP_PAYMENT=true
# ou désactiver le paywall serveur :
# JOURNAL_SUBSCRIPTION_REQUIRED=false
```

## Accès gratuit (liste blanche)

Courriels intégrés au code : `isabelle_fort10@hotmail.com`, `jodivers@outlook.com`, `fortierline@gmail.com`, `melanie.deshaies@gmail.com`, `genevieve.2.turcotte@gmail.com`.

Pour en ajouter sans redéployer le code, secret Fly / `.env.local` :

```bash
JOURNAL_FREE_ACCESS_EMAILS=autre@example.com,encore@example.org
```

(Les adresses de la liste intégrée restent toujours actives.)

## 3. Webhook Stripe

Endpoint : `https://www.orbitalastro.ca/api/webhooks/stripe` (ou votre URL)

Événements recommandés :

- `checkout.session.completed`
- `invoice.paid`
- `customer.subscription.deleted`

## 4. Supabase

Exécuter une fois : `web/database/journal_subscription.sql` (met à jour le trigger `user_access`).

## 5. Vérification

- `npm run test` dans `web/`
- Compte connecté → `/journal-pilot` → paywall si non abonné
- Après checkout → accès au clavardage
