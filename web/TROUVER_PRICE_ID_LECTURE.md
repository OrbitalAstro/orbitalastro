# 🔍 Trouver le Price ID de Lecture 2026

## ✅ Vous avez le Product ID : `prod_TomRXEW7yT0JNm`

Maintenant, nous devons trouver le **Price ID** (qui commence par `price_...`).

## Méthode 1 : Via Stripe Dashboard (Recommandé)

1. Allez sur [Stripe Dashboard](https://dashboard.stripe.com)
2. Allez dans **"Produits"** (Products)
3. Cliquez sur **"Lecture 2026"**
4. Dans la section **"Tarifs"** (Prices), vous verrez le prix "9,99 $"
5. **Cliquez sur ce prix** ou regardez dans les détails
6. Le **Price ID** sera visible (commence par `price_...`)

## Méthode 2 : Via l'API (si le serveur tourne)

Si votre serveur local tourne (`npm run dev:fast`), vous pouvez utiliser :

```
http://localhost:3000/api/stripe/get-price-id?product_id=prod_TomRXEW7yT0JNm
```

Cela vous donnera tous les Price IDs pour ce produit.

## Méthode 3 : Dans les événements

Dans la page du produit "Lecture 2026" dans Stripe Dashboard :
- Allez dans la section **"Événements"** (Events)
- Cherchez un événement qui dit : "Un nouveau tarif intitulé `price_...` a été créé"
- Copiez ce Price ID

## ⚠️ Important

- Assurez-vous d'être en mode **TEST** si vous testez
- Le Price ID doit être **actif**
- Il doit correspondre à **9,99 CAD** et être de type **"Paiement unique"**

## 📝 Une fois que vous avez le Price ID

Donnez-moi le Price ID (ex: `price_1ABC123...`) et je le mettrai à jour dans le code automatiquement !

