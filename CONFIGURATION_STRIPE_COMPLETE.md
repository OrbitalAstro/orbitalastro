# 🚀 Configuration Complète Stripe - Guide Final

## ✅ Ce qui est déjà fait

1. ✅ Les fichiers Stripe sont créés et configurés
2. ✅ La page de tarification (`/pricing`) est prête
3. ✅ La route API checkout est configurée
4. ✅ Le support des coupons est intégré
5. ✅ Les 3 produits sont définis dans le code

## 📋 Ce que VOUS devez faire maintenant

### Étape 1 : Récupérer les Price IDs depuis Stripe Dashboard

1. **Connectez-vous à Stripe Dashboard** : [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. **Allez dans "Produits"** (Products) dans le menu de gauche
3. **Pour chaque produit**, cliquez dessus et copiez le **Price ID** (commence par `price_...`)

Vous avez 3 produits à configurer :

| Produit | Prix | Price ID à copier |
|---------|------|-------------------|
| **Dialogue pré-incarnation** | 9,99 $ | `price_...` |
| **Lecture 2026** | 9,99 $ | `price_...` |
| **Saint-Valentin 2026** | 14,00 $ | `price_...` |

### Étape 2 : Ajouter les Price IDs dans le code

Une fois que vous avez les 3 Price IDs, **donnez-les-moi** et je les ajouterai dans `web/lib/stripe.ts`.

**OU** vous pouvez les ajouter vous-même :

Ouvrez `web/lib/stripe.ts` et remplacez les `stripePriceId: ''` par vos vrais Price IDs :

```typescript
{
  id: 'dialogue',
  name: 'Dialogue pré-incarnation',
  // ...
  stripePriceId: 'price_VOTRE_ID_ICI', // ⬅️ Remplacez par le vrai Price ID
},
{
  id: 'reading-2026',
  name: 'Lecture 2026',
  // ...
  stripePriceId: 'price_VOTRE_ID_ICI', // ⬅️ Remplacez par le vrai Price ID
},
{
  id: 'valentine-2026',
  name: 'Saint-Valentin 2026',
  // ...
  stripePriceId: 'price_VOTRE_ID_ICI', // ⬅️ Remplacez par le vrai Price ID
},
```

### Étape 3 : Configurer le coupon de réduction de 50%

Le coupon est déjà créé dans Stripe. Vous devez maintenant :

1. **Dans Stripe Dashboard**, allez dans **"Bons de réduction"** (Coupons) ou **"Codes promotionnels"** (Promotion codes)
2. **Trouvez votre coupon de 50%** pour la Lecture 2026
3. **Copiez le CODE du coupon** (pas l'ID, mais le code que les utilisateurs entreront)
   - Exemple : `SONDAGE2026` ou `LECTURE50`

4. **Assurez-vous que le coupon** :
   - ✅ Est **actif**
   - ✅ S'applique à **50% de réduction**
   - ✅ Peut être utilisé sur le produit **Lecture 2026** (ou tous les produits)

### Étape 4 : Vérifier les variables d'environnement

Assurez-vous que ces variables sont dans vos fichiers `.env` :

**Fichier `web/.env.local`** :
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_PUBLIQUE_ICI
```

**Fichier `.env` (à la racine)** :
```bash
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_SECRETE_ICI
```

### Étape 5 : Tester le système de paiement

1. **Redémarrez votre serveur** :
   ```powershell
   # Arrêtez le serveur (Ctrl+C) puis :
   npm run dev:fast
   ```

2. **Allez sur** : `http://localhost:3000/pricing`

3. **Testez** :
   - ✅ Cliquez sur "Acheter maintenant" pour un produit
   - ✅ Vérifiez que vous êtes redirigé vers Stripe Checkout
   - ✅ Utilisez une **carte de test Stripe** :
     - Numéro : `4242 4242 4242 4242`
     - Date : n'importe quelle date future
     - CVC : n'importe quel 3 chiffres
     - Code postal : n'importe quel code postal
   - ✅ Testez le code promo pour la Lecture 2026

### Étape 6 : Distribuer les codes promo

Pour les personnes qui ont rempli le sondage :

1. **Donnez-leur le code promo** que vous avez créé dans Stripe
2. **Ils peuvent l'entrer** dans la section "Vous avez un code promo ?" sur la page `/pricing`
3. **Le rabais de 50%** sera appliqué automatiquement lors du paiement

## 🎯 Résumé des actions requises

- [ ] Récupérer les 3 Price IDs depuis Stripe Dashboard
- [ ] Ajouter les Price IDs dans `web/lib/stripe.ts`
- [ ] Vérifier que le coupon de 50% est actif dans Stripe
- [ ] Vérifier les variables d'environnement
- [ ] Tester le paiement avec une carte de test
- [ ] Tester le code promo

## 📞 Besoin d'aide ?

Une fois que vous avez les Price IDs, **donnez-les-moi** et je les ajouterai dans le code automatiquement !

## 🔒 Sécurité

- ✅ Les clés Stripe sont dans `.env` (non commitées dans Git)
- ✅ Les paiements passent par Stripe Checkout (sécurisé)
- ✅ Aucune information de carte n'est stockée sur vos serveurs

## 🚀 Prochaines étapes (optionnel)

Une fois que tout fonctionne :
- [ ] Ajouter des webhooks Stripe pour gérer les événements de paiement
- [ ] Créer une base de données pour stocker les achats
- [ ] Ajouter une page "Mes achats" pour les utilisateurs
- [ ] Configurer les emails de confirmation
