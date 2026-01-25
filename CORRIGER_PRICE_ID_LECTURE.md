# 🔧 Corriger le Price ID de Lecture 2026

## ❌ Problème

L'erreur indique que le Price ID `price_1Sr8sKJOod2H9eSERIPO6965` n'existe pas dans Stripe.

## ✅ Solution : Récupérer le bon Price ID

### Étape 1 : Vérifier dans Stripe Dashboard

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com)
2. Assurez-vous d'être en mode **TEST** (bascule en haut à droite)
3. Allez dans **"Produits"** (Products)
4. Cliquez sur le produit **"Lecture 2026"**

### Étape 2 : Trouver le Price ID

Dans la page du produit "Lecture 2026", vous verrez :

**Option A : Dans la section "Tarifs"**
- Cliquez sur le prix (ex: "9,99 $")
- Le Price ID sera visible dans l'URL ou les détails

**Option B : Dans la section "Événements"**
- Cherchez un événement qui dit : "Un nouveau tarif intitulé `price_...` a été créé"
- Copiez ce Price ID

**Option C : Via l'API**
- Le Price ID est généralement visible dans les détails du produit

### Étape 3 : Me donner le nouveau Price ID

Une fois que vous avez le **nouveau Price ID** pour "Lecture 2026", donnez-le-moi et je le mettrai à jour dans le code.

**Format attendu** : `price_1ABC123...`

## 🔍 Vérification rapide

Si vous voyez plusieurs prix pour "Lecture 2026", utilisez celui qui :
- ✅ Est **actif**
- ✅ A le montant **9,99 CAD**
- ✅ Est de type **"Paiement unique"** (One-time)

## ⚠️ Important

- Assurez-vous d'être en mode **TEST** si vous testez
- Les Price IDs sont différents en mode TEST et LIVE
- Utilisez le Price ID qui correspond au mode dans lequel vous testez

