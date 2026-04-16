# Statut de l'intégration Stripe - Orbital Astro

## ✅ Fait

### 1. Installation des dépendances
- ✅ Ajouté `stripe` et `@stripe/stripe-js` dans `web/package.json`
- ✅ Ajouté `stripe` dans `requirements.txt` (backend)
- ✅ Créé le fichier `STRIPE_SETUP.md` avec les instructions de configuration

### 2. Structure de base Stripe
- ✅ Créé `web/lib/stripe.ts` - Client Stripe frontend et configuration des plans de pricing
- ✅ Créé `web/app/api/stripe/checkout/route.ts` - Route API pour créer une session de checkout
- ✅ Créé `web/app/api/stripe/create-portal/route.ts` - Route API pour le portail client (gestion d'abonnement)
- ✅ Créé `web/app/api/webhooks/stripe/route.ts` - Route API pour recevoir les webhooks Stripe
- ✅ Créé `web/app/pricing/page.tsx` - Page de pricing avec les plans d'abonnement

### 3. Plans de pricing configurés
- ✅ Plan Gratuit (free)
- ✅ Plan Mensuel ($9.99/mois)
- ✅ Plan Annuel ($99.99/an - 2 mois gratuits)

## 🔄 En cours / À faire

### 1. Configuration initiale Stripe (À faire par vous)

**Action requise** :
1. Créer un compte Stripe sur https://stripe.com
2. Récupérer les clés API (publishable key et secret key)
3. Créer les produits et prix dans Stripe Dashboard :
   - Allez sur **Products** → **Add product**
   - Créer un produit "Orbital Astro - Mensuel"
     - Prix : $9.99 CAD / mois (recurring)
     - Copier le `price_xxx` ID
   - Créer un produit "Orbital Astro - Annuel"
     - Prix : $99.99 CAD / an (recurring)
     - Copier le `price_xxx` ID
4. Mettre à jour `web/lib/stripe.ts` avec les `stripePriceId` des plans
5. Ajouter les variables d'environnement (voir `STRIPE_SETUP.md`)

### 2. Authentification utilisateur (À faire)

**Pourquoi** : Pour lier les abonnements Stripe aux utilisateurs

**Ce qu'il faut faire** :
- [ ] Installer et configurer NextAuth.js
- [ ] Créer un système de gestion d'utilisateurs (email/password ou OAuth)
- [ ] Créer une base de données pour stocker les utilisateurs

**Fichiers à créer** :
- `web/app/api/auth/[...nextauth]/route.ts` - Configuration NextAuth
- Modèle de base de données pour les utilisateurs

### 3. Base de données (À faire)

**Pourquoi** : Pour stocker les utilisateurs, abonnements, et quotas d'utilisation

**Options** :
- **Supabase** (recommandé - gratuit, PostgreSQL)
- **PostgreSQL** direct (sur Fly.io)
- Autre (MongoDB, etc.)

**Tables à créer** :
```sql
-- Utilisateurs
users (
  id, email, name, created_at, updated_at
)

-- Abonnements Stripe
subscriptions (
  id, user_id, stripe_customer_id, stripe_subscription_id, 
  status (active, canceled, past_due), 
  current_period_start, current_period_end, created_at
)

-- Utilisation (quotas)
usage_quota (
  id, user_id, month, year, 
  natal_calculations, dialogue_generations, 
  created_at, updated_at
)
```

### 4. Intégration des webhooks (Partiellement fait)

**Fait** :
- ✅ Route webhook créée (`/api/webhooks/stripe`)

**À faire** :
- [ ] Tester les webhooks en local (Stripe CLI)
- [ ] Connecter les webhooks à la base de données
- [ ] Implémenter la logique pour :
  - Activer l'abonnement quand `checkout.session.completed`
  - Mettre à jour le statut quand `customer.subscription.updated`
  - Désactiver quand `customer.subscription.deleted`
  - Gérer les paiements échoués (`invoice.payment_failed`)

### 5. Protection des routes API (À faire)

**Pourquoi** : Empêcher les utilisateurs non-abonnés d'utiliser les fonctionnalités premium

**Ce qu'il faut faire** :
- [ ] Créer un middleware pour vérifier l'abonnement actif
- [ ] Protéger les routes API sensibles (ex: `/api/transits`, `/natal`, etc.)
- [ ] Vérifier les quotas d'utilisation (ex: max 5 calculs/mois pour plan gratuit)

**Exemple** :
```python
# api/middleware.py ou dans chaque route
async def check_subscription(user_id: str) -> bool:
    # Vérifier si l'utilisateur a un abonnement actif
    # Retourner True si actif, False sinon
    pass
```

### 6. Interface utilisateur (Partiellement fait)

**Fait** :
- ✅ Page de pricing créée
- ⚠️ Lien dans la navigation à ajouter

**À faire** :
- [ ] Ajouter un lien "Pricing" dans le menu de navigation
- [ ] Créer/modifier la page Settings pour afficher :
  - Statut d'abonnement actuel
  - Bouton "Gérer l'abonnement" (portail client Stripe)
  - Historique des paiements
- [ ] Ajouter des notifications pour les limites d'utilisation
- [ ] Créer une page de confirmation après paiement

### 7. Gestion des limites d'utilisation (À faire)

**Pourquoi** : Imposer des quotas selon le plan (ex: 5 calculs/mois gratuit vs illimité premium)

**Ce qu'il faut faire** :
- [ ] Créer un système de comptage des utilisations
- [ ] Vérifier les quotas avant chaque calcul API
- [ ] Retourner des erreurs appropriées si quota dépassé
- [ ] Afficher les quotas restants dans l'interface

**Exemple** :
```typescript
// Vérification côté frontend
if (userPlan === 'free' && usageThisMonth >= 5) {
  // Rediriger vers pricing avec message
}
```

## 📝 Prochaines étapes recommandées

1. **Immédiat** :
   - Créer un compte Stripe et récupérer les clés API
   - Ajouter les variables d'environnement
   - Créer les produits dans Stripe Dashboard
   - Mettre à jour les `stripePriceId` dans `web/lib/stripe.ts`

2. **Court terme** (Cette semaine) :
   - Configurer NextAuth.js pour l'authentification
   - Choisir et configurer une base de données (Supabase recommandé)
   - Créer les tables de base de données

3. **Moyen terme** (Semaine prochaine) :
   - Intégrer les webhooks avec la base de données
   - Protéger les routes API avec vérification d'abonnement
   - Implémenter les quotas d'utilisation

4. **Long terme** :
   - Tests end-to-end du flux de paiement
   - Optimisations UX (chargement, erreurs, etc.)
   - Documentation utilisateur

## 🧪 Tester

### Test local (avec Stripe CLI)

1. Installer Stripe CLI : https://stripe.com/docs/stripe-cli
2. Se connecter : `stripe login`
3. Écouter les webhooks : `stripe listen --forward-to http://localhost:3000/api/webhooks/stripe`
4. Tester un checkout en local

### Test avec cartes de test Stripe

Utilisez les cartes de test de Stripe :
- Carte valide : `4242 4242 4242 4242`
- Date d'expiration : n'importe quelle date future
- CVC : n'importe quel 3 chiffres
- ZIP : n'importe quel code postal

## 📚 Ressources

- [Documentation Stripe](https://stripe.com/docs)
- [Stripe + Next.js](https://stripe.com/docs/payments/quickstart)
- [Stripe Billing](https://stripe.com/docs/billing/subscriptions/overview)
- [NextAuth.js](https://next-auth.js.org/)
- [Supabase](https://supabase.com/docs)

## ⚠️ Notes importantes

1. **Clés API** : 
   - Utilisez les clés **test** (`pk_test_` / `sk_test_`) pour le développement
   - Passez en **production** (`pk_live_` / `sk_live_`) uniquement après tests complets

2. **Webhooks** :
   - En local, utilisez Stripe CLI pour tester
   - En production, configurez l'endpoint dans Stripe Dashboard

3. **Base de données** :
   - Les webhooks doivent mettre à jour la base de données
   - Vérifiez toujours l'état dans la BD, pas uniquement dans Stripe

4. **Sécurité** :
   - Ne jamais exposer `STRIPE_SECRET_KEY` dans le frontend
   - Toujours valider les webhooks avec la signature
   - Utiliser HTTPS en production

