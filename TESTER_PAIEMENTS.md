# 🧪 Tester vos paiements Stripe

## ✅ Configuration terminée !

Tous les produits sont maintenant configurés :
- ✅ **Dialogue pré-incarnation** : `price_1Sr8qkJOod2H9eSE8QV72G4p`
- ✅ **Lecture 2026** : `price_1Sr8sKJOod2H9eSERIPO6965`
- ✅ **Saint-Valentin 2026** : `price_1SrTNsJOod2H9eSEa2Nz1heK`

## 🚀 Étapes pour tester

### 1. Redémarrer le serveur

Si votre serveur tourne déjà, redémarrez-le pour charger les nouvelles configurations :

```powershell
# Arrêtez le serveur (Ctrl+C)
# Puis redémarrez :
cd web
npm run dev:fast
```

### 2. Accéder à la page de tarification

Ouvrez votre navigateur et allez sur :
```
http://localhost:3000/pricing
```

### 3. Tester un achat

1. **Cliquez sur "Acheter maintenant"** pour n'importe quel produit
2. Vous serez redirigé vers **Stripe Checkout**
3. **Utilisez une carte de test Stripe** :

#### Carte de test réussie :
- **Numéro** : `4242 4242 4242 4242`
- **Date d'expiration** : N'importe quelle date future (ex: `12/34`)
- **CVC** : N'importe quel 3 chiffres (ex: `123`)
- **Code postal** : N'importe quel code postal (ex: `12345`)

#### Autres cartes de test :
- **Carte refusée** : `4000 0000 0000 0002`
- **Carte nécessitant une authentification** : `4000 0025 0000 3155`
- **Carte déclinée (insuffisance de fonds)** : `4000 0000 0000 9995`

### 4. Tester le code promo

Pour tester le code promo de 50% sur la Lecture 2026 :

1. Sur la page `/pricing`, trouvez la section **"Vous avez un code promo ?"**
2. Entrez le code promo que vous avez créé dans Stripe
3. Cliquez sur **"Appliquer"**
4. Cliquez sur **"Acheter maintenant"** pour la Lecture 2026
5. Vérifiez que le rabais de 50% est appliqué dans Stripe Checkout

### 5. Vérifier dans Stripe Dashboard

Après un paiement de test réussi :

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com)
2. Cliquez sur **"Paiements"** (Payments)
3. Vous devriez voir votre paiement de test
4. Cliquez dessus pour voir les détails

## ✅ Résultats attendus

Après un paiement réussi :
- ✅ Vous êtes redirigé vers `/pricing?success=true`
- ✅ Un message de succès s'affiche
- ✅ Le paiement apparaît dans Stripe Dashboard

## 🔧 Dépannage

### Le paiement ne fonctionne pas ?

1. **Vérifiez les variables d'environnement** :
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` dans `web/.env.local`
   - `STRIPE_SECRET_KEY` dans `.env` (racine)

2. **Vérifiez la console du navigateur** (F12) pour des erreurs

3. **Vérifiez les logs du serveur** pour des erreurs API

### Le code promo ne fonctionne pas ?

1. Vérifiez que le coupon est **actif** dans Stripe Dashboard
2. Vérifiez que le coupon peut être utilisé sur le produit "Lecture 2026"
3. Le code promo doit être le **CODE** (pas l'ID), par exemple `SONDAGE2026`

## 🎉 Prêt pour la production !

Une fois que tout fonctionne en mode TEST :

1. **Créez les produits en mode LIVE** dans Stripe Dashboard
2. **Récupérez les nouveaux Price IDs** (mode LIVE)
3. **Remplacez les Price IDs** dans `web/lib/stripe.ts`
4. **Mettez à jour les clés** :
   - Utilisez `pk_live_...` au lieu de `pk_test_...`
   - Utilisez `sk_live_...` au lieu de `sk_test_...`

## 📞 Support

Si vous rencontrez des problèmes, vérifiez :
- Les logs du serveur
- La console du navigateur (F12)
- Les événements dans Stripe Dashboard

