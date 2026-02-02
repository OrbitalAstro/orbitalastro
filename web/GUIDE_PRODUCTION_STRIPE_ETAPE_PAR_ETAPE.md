# Guide Étape par Étape : Activer les Paiements en Production Stripe

## 📋 Prérequis

✅ Les Price IDs LIVE sont déjà configurés dans le code :
- Dialogue pré-incarnation : `price_1Sw9inJp4kRSmzLn7wY3DIUT`
- Lecture 2026 : `price_1SwAFoJp4kRSmzLnS0MgV7VS`

✅ Le code promo "Sondage50" est configuré dans Stripe

---

## 🚀 ÉTAPE 1 : Récupérer vos clés Stripe LIVE

### 1.1 Ouvrir le Dashboard Stripe
1. Allez sur [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. **Assurez-vous d'être en mode LIVE** (pas en mode test)
   - En haut à droite, vérifiez que le toggle est sur "LIVE" (pas "TEST")
   - Si vous êtes en mode test, cliquez sur le toggle pour passer en LIVE

### 1.2 Récupérer la clé publique (Publishable Key)
1. Dans le menu de gauche, cliquez sur **"Développeurs"** → **"Clés API"**
2. Dans la section **"Clés publiables"**, copiez la clé qui commence par `pk_live_...`
   - Exemple : `pk_live_51ABC123...`
3. **Notez cette clé** (vous en aurez besoin à l'étape 2)

### 1.3 Récupérer la clé secrète (Secret Key)
1. Toujours dans **"Développeurs"** → **"Clés API"**
2. Dans la section **"Clés secrètes"**, cliquez sur **"Révéler la clé de test"** ou **"Révéler la clé"**
3. Copiez la clé qui commence par `sk_live_...`
   - Exemple : `sk_live_51ABC123...`
4. **Notez cette clé** (vous en aurez besoin à l'étape 2)
   - ⚠️ **IMPORTANT** : Cette clé est secrète, ne la partagez jamais publiquement

---

## 🔐 ÉTAPE 2 : Configurer les secrets dans Fly.io

### 2.1 Ouvrir le terminal
Ouvrez PowerShell ou votre terminal dans le dossier du projet.

### 2.2 Configurer les variables d'environnement
Exécutez cette commande (remplacez les valeurs entre `<>` par vos vraies clés) :

```powershell
flyctl secrets set -a orbitalastro-web `
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_VOTRE_CLE_PUBLIQUE `
  STRIPE_SECRET_KEY=sk_live_VOTRE_CLE_SECRETE
```

**Exemple concret** (avec des clés fictives) :
```powershell
flyctl secrets set -a orbitalastro-web `
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51ABC123xyz789 `
  STRIPE_SECRET_KEY=sk_live_51ABC123xyz789
```

### 2.3 Vérifier que les secrets sont bien configurés
```powershell
flyctl secrets list -a orbitalastro-web
```

Vous devriez voir :
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (commence par `pk_live_`)
- `STRIPE_SECRET_KEY` (commence par `sk_live_`)

---

## 🔔 ÉTAPE 3 : Configurer le Webhook Stripe LIVE

### 3.1 Créer le webhook dans Stripe
1. Dans le Dashboard Stripe (mode LIVE), allez dans **"Développeurs"** → **"Webhooks"**
2. Cliquez sur **"Ajouter un point de terminaison"** (ou "Add endpoint")
3. **URL du point de terminaison** : 
   ```
   https://www.orbitalastro.ca/api/webhooks/stripe
   ```
4. **Description** (optionnel) : "Webhook production OrbitalAstro"

### 3.2 Sélectionner les événements à écouter
Cochez les événements suivants :
- ✅ `checkout.session.completed`
- ✅ `payment_intent.succeeded`
- ✅ `payment_intent.payment_failed`
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`

### 3.3 Récupérer le secret du webhook
1. Après avoir créé le webhook, cliquez dessus
2. Dans la section **"Détails du point de terminaison"**, trouvez **"Signing secret"**
3. Cliquez sur **"Révéler"** ou **"Révéler le secret"**
4. Copiez le secret qui commence par `whsec_...`
   - Exemple : `whsec_ABC123xyz789...`
5. **Notez ce secret** (vous en aurez besoin à l'étape 3.4)

### 3.4 Ajouter le secret du webhook dans Fly.io
```powershell
flyctl secrets set -a orbitalastro-web `
  STRIPE_WEBHOOK_SECRET=whsec_VOTRE_SECRET_WEBHOOK
```

**Exemple concret** :
```powershell
flyctl secrets set -a orbitalastro-web `
  STRIPE_WEBHOOK_SECRET=whsec_ABC123xyz789
```

### 3.5 Vérifier que le webhook est bien configuré
```powershell
flyctl secrets list -a orbitalastro-web
```

Vous devriez maintenant voir 3 secrets :
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

---

## 🧪 ÉTAPE 4 : Tester en production (RECOMMANDÉ)

### 4.1 Tester avec un petit montant
1. Allez sur votre site : `https://www.orbitalastro.ca/pricing`
2. Cliquez sur **"Acheter maintenant"** pour la Lecture 2026
3. **Utilisez une carte de test Stripe** pour éviter un vrai paiement :
   - Numéro de carte : `4242 4242 4242 4242`
   - Date d'expiration : n'importe quelle date future (ex: `12/25`)
   - CVC : n'importe quel 3 chiffres (ex: `123`)
   - Code postal : n'importe quel code postal valide

### 4.2 Vérifier dans Stripe Dashboard
1. Allez dans **"Paiements"** dans le Dashboard Stripe (mode LIVE)
2. Vous devriez voir le paiement de test
3. Vérifiez que le statut est **"Réussi"**

### 4.3 Vérifier les webhooks
1. Allez dans **"Développeurs"** → **"Webhooks"**
2. Cliquez sur votre webhook
3. Dans **"Tentatives récentes"**, vérifiez que les événements sont bien reçus
4. Les statuts devraient être **"200 OK"** (vert)

---

## 🚀 ÉTAPE 5 : Déployer l'application

### 5.1 Déployer sur Fly.io
```powershell
cd web
flyctl deploy -a orbitalastro-web
```

### 5.2 Vérifier que le déploiement est réussi
Attendez que le déploiement se termine. Vous devriez voir :
```
✓ Machine is now in a good state
✓ DNS configuration verified
```

### 5.3 Vérifier que l'application fonctionne
1. Allez sur `https://www.orbitalastro.ca`
2. Vérifiez que le site se charge correctement
3. Allez sur la page `/pricing`
4. Vérifiez que les prix s'affichent correctement

---

## ✅ ÉTAPE 6 : Vérifications finales

### 6.1 Vérifier que les paiements sont en mode LIVE
1. Allez sur `https://www.orbitalastro.ca/pricing`
2. Cliquez sur **"Acheter maintenant"** pour un produit
3. Dans Stripe Checkout, vérifiez que :
   - L'URL contient `checkout.stripe.com` (pas `checkout.stripe.com/test`)
   - Les cases à cocher (termes et conditions, promotions) sont présentes
   - Le message d'avertissement s'affiche

### 6.2 Vérifier les logs
```powershell
flyctl logs -a orbitalastro-web
```

Cherchez les erreurs liées à Stripe. Si tout fonctionne, vous ne devriez pas voir d'erreurs.

---

## 🎉 Félicitations !

Vos paiements sont maintenant en production ! Les clients peuvent maintenant acheter vos produits avec de vrais paiements.

---

## ⚠️ Points importants à retenir

1. **Les paiements sont maintenant RÉELS** - chaque transaction débitera vraiment les cartes bancaires
2. **Surveillez vos transactions** dans le Dashboard Stripe régulièrement
3. **Les webhooks sont essentiels** - ils permettent à votre application de savoir quand un paiement est réussi
4. **Testez régulièrement** pour vous assurer que tout fonctionne

---

## 🆘 En cas de problème

### Problème : Les paiements ne fonctionnent pas
1. Vérifiez que vous êtes bien en mode LIVE dans Stripe
2. Vérifiez que les secrets sont bien configurés : `flyctl secrets list -a orbitalastro-web`
3. Vérifiez les logs : `flyctl logs -a orbitalastro-web`

### Problème : Les webhooks ne fonctionnent pas
1. Vérifiez que l'URL du webhook est correcte : `https://www.orbitalastro.ca/api/webhooks/stripe`
2. Vérifiez que le secret du webhook est bien configuré
3. Testez le webhook depuis le Dashboard Stripe (bouton "Envoyer un événement de test")

### Problème : Les codes promo ne fonctionnent pas
1. Vérifiez que le code promo "Sondage50" existe bien dans Stripe (mode LIVE)
2. Vérifiez que le code promo est associé au bon produit (Lecture 2026)
3. Vérifiez que le code promo n'a pas expiré

---

## 📞 Support

Si vous avez des questions ou des problèmes, consultez :
- [Documentation Stripe](https://stripe.com/docs)
- [Documentation Fly.io](https://fly.io/docs)
