# 🎫 Guide d'utilisation du code promo

## ✅ Votre coupon est configuré

**Nom du coupon** : `Sondage dialogue`
- **Réduction** : 50% de réduction unique
- **Expire le** : 28 février 23h59
- **Utilisations** : 0/1 (utilisable 1 seule fois)

## 🔍 Comment trouver le CODE du coupon

Pour que les utilisateurs puissent utiliser ce coupon, vous devez trouver le **CODE** (pas le nom).

### Méthode 1 : Via Stripe Dashboard

1. Dans Stripe Dashboard, allez dans **"Bons de réduction"** (Coupons)
2. Cliquez sur le coupon **"Sondage dialogue"**
3. Dans les détails, cherchez la section **"Code promotionnel"** (Promotion Code)
4. Le **CODE** sera visible là (par exemple : `SONDAGE` ou `SONDAGE2026`)

### Méthode 2 : Créer un code promotionnel

Si le coupon n'a pas de code promotionnel associé :

1. Dans Stripe Dashboard, allez dans **"Codes promotionnels"** (Promotion Codes)
2. Cliquez sur **"+ Créer un code promotionnel"**
3. Sélectionnez le coupon **"Sondage dialogue"**
4. Créez un code simple, par exemple : `SONDAGE2026` ou `DIALOGUE50`
5. Ce sera le code que les utilisateurs devront entrer

## 📝 Utilisation sur votre site

Une fois que vous avez le CODE du coupon :

1. **Sur la page `/pricing`**, les utilisateurs verront la section **"Vous avez un code promo ?"**
2. Ils entrent le CODE (ex: `SONDAGE2026`)
3. Ils cliquent sur **"Appliquer"**
4. Ils achètent la **Lecture 2026**
5. Le rabais de 50% sera automatiquement appliqué dans Stripe Checkout

## ⚠️ Important

- Le coupon est **unique** (0/1 utilisations) : il ne peut être utilisé qu'**une seule fois**
- Le coupon **expire le 28 février** à 23h59
- Le coupon doit être utilisé sur le produit **"Lecture 2026"** (assurez-vous que c'est configuré dans Stripe)

## 🧪 Tester le code promo

1. Obtenez le CODE du coupon dans Stripe Dashboard
2. Allez sur `http://localhost:3000/pricing`
3. Entrez le code dans la section "Vous avez un code promo ?"
4. Cliquez sur "Acheter maintenant" pour la Lecture 2026
5. Vérifiez dans Stripe Checkout que le rabais de 50% est appliqué

## 💡 Astuce

Si vous voulez donner le coupon à plusieurs personnes (au lieu d'une seule utilisation) :
1. Allez dans Stripe Dashboard
2. Modifiez le coupon "Sondage dialogue"
3. Changez "Utilisations" de 1 à un nombre plus élevé (ou illimité)

