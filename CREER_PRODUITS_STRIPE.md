# Créer les produits dans Stripe Dashboard

## ✅ Étape 1 : Accéder à Stripe Dashboard

1. Allez sur [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Connectez-vous avec votre compte
3. Assurez-vous d'être en mode **TEST** (bascule en haut à droite)

## 🛍️ Étape 2 : Créer le produit "Dialogue Pré-Incarnation"

1. Dans le menu de gauche, cliquez sur **"Produits"** (Products)
2. Cliquez sur **"+ Ajouter un produit"** (Add product)
3. Remplissez les informations :
   - **Nom** : `Dialogue Pré-Incarnation`
   - **Description** : `Générez votre dialogue mythopoétique entre votre âme et le conseil cosmique avant votre naissance.`
   - **Prix** : `9.99`
   - **Devise** : `CAD` (Dollar canadien)
   - **Type de facturation** : **Paiement unique** (One-time)
4. Cliquez sur **"Enregistrer le produit"** (Save product)
5. **IMPORTANT** : Copiez le **Price ID** (commence par `price_...`) - vous en aurez besoin !

## 📅 Étape 3 : Créer le produit "Lecture 2026"

1. Cliquez sur **"+ Ajouter un produit"** (Add product)
2. Remplissez les informations :
   - **Nom** : `Lecture 2026`
   - **Description** : `Votre lecture astrologique complète pour l'année 2026, basée sur votre thème natal et les transits à venir.`
   - **Prix** : `9.99`
   - **Devise** : `CAD` (Dollar canadien)
   - **Type de facturation** : **Paiement unique** (One-time)
3. Cliquez sur **"Enregistrer le produit"** (Save product)
4. **IMPORTANT** : Copiez le **Price ID** (commence par `price_...`) - vous en aurez besoin !

## 🔄 Étape 4 : Créer l'abonnement "Abonnement Mensuel"

1. Cliquez sur **"+ Ajouter un produit"** (Add product)
2. Remplissez les informations :
   - **Nom** : `Abonnement Mensuel`
   - **Description** : `Accès complet à toutes les fonctionnalités astrologiques.`
   - **Prix** : `12.99`
   - **Devise** : `CAD` (Dollar canadien)
   - **Type de facturation** : **Récurrent** (Recurring)
   - **Intervalle** : **Mensuel** (Monthly)
3. Cliquez sur **"Enregistrer le produit"** (Save product)
4. **IMPORTANT** : Copiez le **Price ID** (commence par `price_...`) - vous en aurez besoin !

## 📝 Étape 5 : Mettre à jour le code avec les Price IDs

Une fois que vous avez les 3 Price IDs, je les ajouterai dans le fichier `web/lib/stripe.ts`.

**Exemple de Price ID** : `price_1ABC123def456GHI789jkl012`

## 🎯 Résumé des produits à créer

| Produit | Prix | Type | Price ID à copier |
|---------|------|------|-------------------|
| Dialogue Pré-Incarnation | 9.99 CAD | Paiement unique | `price_...` |
| Lecture 2026 | 9.99 CAD | Paiement unique | `price_...` |
| Abonnement Mensuel | 12.99 CAD | Récurrent (mensuel) | `price_...` |

## ⚠️ Important

- Assurez-vous d'être en mode **TEST** pour commencer
- Les Price IDs sont différents en mode TEST et en mode LIVE
- Gardez une copie de vos Price IDs dans un endroit sûr

## ✅ Prochaine étape

Une fois les 3 produits créés, donnez-moi les 3 Price IDs et je les ajouterai dans le code !

