# 🎯 Guide : Obtenir les Price IDs et Coupon ID depuis Stripe

## 📋 Ce dont vous avez besoin

Pour que la facturation fonctionne, vous devez obtenir :
1. **3 Price IDs** (un pour chaque produit)
2. **1 Coupon ID** (pour le rabais de 50% sur la Lecture 2026)

---

## 🔍 Étape 1 : Obtenir les Price IDs

### Pour chaque produit (Dialogue pré-incarnation, Lecture 2026, Saint-Valentin 2026) :

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com)
2. Dans le menu de gauche, cliquez sur **"Catalogue de produits"** (ou **"Products"**)
3. Cliquez sur le produit que vous voulez (ex: "Lecture 2026")
4. Dans la page du produit, vous verrez une section **"Tarifs"** (Prices)
5. Cliquez sur le prix (ex: "9,99 $")
6. **Copiez le Price ID** qui commence par `price_...` (ex: `price_1ABC123def456...`)

### Répétez pour les 3 produits :

| Produit | Où trouver | Price ID à copier |
|---------|------------|-------------------|
| **Dialogue pré-incarnation** | Catalogue → Dialogue pré-incarnation → Tarifs | `price_...` |
| **Lecture 2026** | Catalogue → Lecture 2026 → Tarifs | `price_...` |
| **Saint-Valentin 2026** | Catalogue → Saint-Valentin 2026 → Tarifs | `price_...` |

---

## 🎟️ Étape 2 : Obtenir le Coupon ID (pour le rabais de 50%)

1. Dans Stripe Dashboard, dans le menu de gauche, cherchez **"Bons de réduction"** (ou **"Coupons"**)
   - Si vous ne le voyez pas, cherchez dans **"Produits"** → **"Bons de réduction"**
2. Cliquez sur le coupon de 50% que vous avez créé
3. **Copiez le Coupon ID** qui commence par `coupon_...` (ex: `coupon_50OFF2026`)
   - **OU** copiez le **Code du coupon** (ex: `SONDAGE2026`) si vous préférez utiliser le code

---

## 📝 Étape 3 : Mettre à jour le code

Une fois que vous avez tous les IDs, donnez-moi :

1. **Price ID pour Dialogue pré-incarnation** : `price_...`
2. **Price ID pour Lecture 2026** : `price_...`
3. **Price ID pour Saint-Valentin 2026** : `price_...`
4. **Coupon ID ou Code du coupon** : `coupon_...` ou `SONDAGE2026`

Je les ajouterai dans le fichier `web/lib/stripe.ts` et dans la route API.

---

## ⚠️ Important

- Assurez-vous d'être en mode **TEST** pour commencer
- Les IDs sont différents en mode TEST et en mode LIVE
- Gardez une copie de vos IDs dans un endroit sûr

---

## ✅ Après avoir ajouté les IDs

1. Redémarrez le serveur de développement
2. Testez la page `/pricing`
3. Testez un paiement avec le code promo pour la Lecture 2026

