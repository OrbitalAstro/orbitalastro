# 🧪 Guide de test complet Stripe - Flux end-to-end

Ce guide vous permet de tester **tout le flux** de paiement Stripe, de A à Z.

## ✅ Prérequis

1. **Application lancée** : `http://localhost:3000`
2. **Variables d'environnement configurées** :
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` dans `web/.env.local` (clé TEST)
   - `STRIPE_SECRET_KEY` dans `.env` à la racine (clé TEST)
3. **Stripe Dashboard ouvert** : https://dashboard.stripe.com/test/payments

---

## 🎯 Test complet : Dialogue pré-incarnation

### Étape 1 : Accéder à la page du produit

1. Ouvrez votre navigateur : `http://localhost:3000/dialogues`
2. **Vérifiez** : Vous devriez voir un message indiquant que l'achat est requis
3. **Vérifiez** : Le bouton "Commander maintenant" est visible

### Étape 2 : Effectuer le paiement

1. Cliquez sur **"Commander maintenant"** (ou allez sur `/pricing`)
2. Sur la page `/pricing`, trouvez le produit **"Dialogue pré-incarnation"**
3. **Optionnel** : Entrez votre email dans le champ prévu (pour recevoir le PDF par email)
4. Cliquez sur **"Acheter maintenant"**
5. Vous êtes redirigé vers **Stripe Checkout**

### Étape 3 : Compléter le paiement dans Stripe

1. Dans Stripe Checkout, utilisez une **carte de test** :
   - **Numéro** : `4242 4242 4242 4242`
   - **Date d'expiration** : `12/34` (ou toute date future)
   - **CVC** : `123` (ou n'importe quel 3 chiffres)
   - **Code postal** : `12345` (ou n'importe quel code postal)
   - **Email** : Utilisez votre vrai email (pour recevoir le reçu Stripe)
2. Cliquez sur **"Payer"** ou **"Pay"**

### Étape 4 : Vérifier la redirection

**✅ Résultat attendu** :
- Vous êtes automatiquement redirigé vers `/dialogues?purchased=true&session_id=cs_test_...`
- Un message de succès peut s'afficher brièvement
- L'URL se nettoie automatiquement (les paramètres sont supprimés)
- Le formulaire devient **actif** (plus grisé)

### Étape 5 : Vérifier dans Stripe Dashboard

1. Allez sur [Stripe Dashboard - Paiements](https://dashboard.stripe.com/test/payments)
2. **Vérifiez** : Vous devriez voir votre paiement de test
3. **Vérifiez** : Le statut est **"Paid"** (Payé)
4. Cliquez sur le paiement pour voir les détails :
   - Montant : 9,99 CAD
   - Produit : Dialogue pré-incarnation
   - Email du client

### Étape 6 : Tester la génération du produit

1. Sur la page `/dialogues`, remplissez le formulaire :
   - **Prénom** : Test (ou votre prénom)
   - **Email** : Votre email (le même que celui utilisé pour le paiement)
   - **Date de naissance** : `1976-10-26` (format AAAA-MM-JJ)
   - **Heure de naissance** : `12:00`
   - **Lieu de naissance** : Recherchez une ville (ex: "Montreal, QC, Canada")
2. Cliquez sur **"Générer le dialogue"**
3. **Vérifiez** :
   - Le bouton affiche "Génération en cours..." avec un spinner
   - Après quelques secondes, le dialogue apparaît
   - Un email avec le PDF est envoyé (si vous avez entré un email)

### Étape 7 : Tester le téléchargement PDF

1. Une fois le dialogue généré, cliquez sur **"Télécharger le PDF"**
2. **Vérifiez** : Le PDF se télécharge avec le nom `Dialogue-pre-incarnation-[Prénom].pdf`
3. **Vérifiez** : Le PDF contient le dialogue généré

### Étape 8 : Vérifier l'accès persistant

1. **Fermez l'onglet** du navigateur
2. **Rouvrez** `http://localhost:3000/dialogues`
3. **Vérifiez** : Le formulaire est **déjà actif** (pas besoin de repayer)
4. **Vérifiez** : Vous pouvez générer un nouveau dialogue sans payer à nouveau

---

## 🎯 Test complet : Lecture 2026

### Même processus que le Dialogue pré-incarnation

1. Allez sur `/reading-2026`
2. Cliquez sur "Commander maintenant"
3. Effectuez le paiement (9,99 CAD)
4. Vérifiez la redirection vers `/reading-2026?purchased=true&session_id=...`
5. Remplissez le formulaire et générez la lecture
6. Téléchargez le PDF

---

## 🎯 Test complet : Code promo (Lecture 2026)

### Étape 1 : Créer un code promo dans Stripe (si pas déjà fait)

1. Allez sur [Stripe Dashboard - Coupons](https://dashboard.stripe.com/test/coupons)
2. Cliquez sur **"Create coupon"**
3. Configurez :
   - **Name** : `SONDAGE2026` (ou votre code)
   - **Type** : Percentage
   - **Percent off** : `50`
   - **Duration** : Once
   - **Active** : ✓
4. Cliquez sur **"Create coupon"**
5. Créez un **Promotion code** :
   - Cliquez sur le coupon créé
   - Section "Promotion codes" → **"Create promotion code"**
   - **Code** : `SONDAGE2026` (doit correspondre exactement)
   - **Active** : ✓
   - Cliquez sur **"Create"**

### Étape 2 : Tester le code promo

1. Allez sur `/pricing`
2. Dans la section **"Vous avez un code promo ?"**, entrez : `SONDAGE2026`
3. Cliquez sur **"Appliquer"**
4. Cliquez sur **"Acheter maintenant"** pour la **Lecture 2026**
5. Dans Stripe Checkout, **vérifiez** :
   - Le prix affiché est **4,99 CAD** (50% de rabais sur 9,99 CAD)
   - Le code promo est appliqué
6. Complétez le paiement avec la carte de test
7. Vérifiez la redirection et la génération de la lecture

---

## 🔍 Points de vérification complets

### ✅ Checklist - Flux de paiement

- [ ] La page du produit affiche un message d'achat requis
- [ ] Le bouton "Commander maintenant" redirige vers `/pricing`
- [ ] La page `/pricing` affiche tous les produits
- [ ] Le clic sur "Acheter maintenant" ouvre Stripe Checkout
- [ ] Stripe Checkout affiche le bon prix
- [ ] Le paiement avec la carte de test fonctionne
- [ ] La redirection après paiement fonctionne
- [ ] L'URL contient `purchased=true` et `session_id`
- [ ] L'URL se nettoie automatiquement
- [ ] Le formulaire devient actif après paiement

### ✅ Checklist - Génération du produit

- [ ] Le formulaire accepte les données
- [ ] La validation des champs fonctionne
- [ ] Le bouton "Générer" est actif après paiement
- [ ] La génération démarre (spinner visible)
- [ ] Le dialogue/lecture s'affiche après génération
- [ ] Le PDF se télécharge correctement
- [ ] L'email avec le PDF est envoyé (vérifiez votre boîte mail)

### ✅ Checklist - Accès persistant

- [ ] Après fermeture/réouverture, l'accès est conservé
- [ ] Pas besoin de repayer pour générer un nouveau produit
- [ ] Le localStorage contient `paid_dialogue` ou `paid_reading-2026`

### ✅ Checklist - Stripe Dashboard

- [ ] Le paiement apparaît dans Stripe Dashboard
- [ ] Le statut est "Paid"
- [ ] Les détails du paiement sont corrects (montant, produit, email)
- [ ] Le code promo est appliqué (si utilisé)

---

## 🐛 Dépannage

### Problème : La redirection ne fonctionne pas

**Solutions** :
1. Vérifiez la console du navigateur (F12) pour des erreurs
2. Vérifiez que `success_url` dans `/api/stripe/checkout` est correct
3. Vérifiez que l'URL de redirection correspond à votre environnement local

### Problème : L'accès n'est pas accordé après paiement

**Solutions** :
1. Vérifiez que `session_id` est bien dans l'URL après redirection
2. Vérifiez la console du navigateur pour des erreurs API
3. Vérifiez que `/api/stripe/verify-session` fonctionne :
   ```
   http://localhost:3000/api/stripe/verify-session?session_id=VOTRE_SESSION_ID
   ```
4. Vérifiez que le localStorage contient `paid_[productId]`

### Problème : Le formulaire reste grisé après paiement

**Solutions** :
1. Rafraîchissez la page (F5)
2. Vérifiez que `hasAccess` est bien `true` dans la console
3. Vérifiez que `checkAccessFromURL` retourne `true`
4. Vérifiez que l'email dans le formulaire correspond à l'email du paiement

### Problème : La génération ne fonctionne pas

**Solutions** :
1. Vérifiez que tous les champs sont remplis
2. Vérifiez la console du navigateur pour des erreurs
3. Vérifiez que l'API backend est accessible
4. Vérifiez que les clés API sont configurées

### Problème : Le code promo ne s'applique pas

**Solutions** :
1. Vérifiez que le code promo est **actif** dans Stripe Dashboard
2. Vérifiez que le code est exactement le même (majuscules/minuscules)
3. Vérifiez que le code promo peut être utilisé sur le produit "Lecture 2026"
4. Vérifiez les logs du serveur pour des erreurs

---

## 📊 Tests à effectuer pour chaque produit

### Dialogue pré-incarnation
- [ ] Paiement réussi
- [ ] Redirection correcte
- [ ] Accès accordé
- [ ] Génération du dialogue
- [ ] Téléchargement PDF
- [ ] Envoi email PDF

### Lecture 2026
- [ ] Paiement réussi
- [ ] Redirection correcte
- [ ] Accès accordé
- [ ] Génération de la lecture
- [ ] Téléchargement PDF
- [ ] Envoi email PDF
- [ ] Code promo fonctionne (50% de rabais)

### Saint-Valentin 2026
- [ ] Paiement réussi
- [ ] Redirection correcte
- [ ] Accès accordé
- [ ] Génération de la synastrie
- [ ] Téléchargement PDF

---

## 🎉 Test réussi !

Si tous les points de la checklist sont cochés, votre intégration Stripe fonctionne parfaitement ! 🚀

Vous pouvez maintenant :
- ✅ Passer en mode **LIVE** (production)
- ✅ Créer les produits en mode LIVE dans Stripe
- ✅ Remplacer les clés TEST par les clés LIVE
- ✅ Mettre à jour les Price IDs dans `web/lib/stripe.ts`

