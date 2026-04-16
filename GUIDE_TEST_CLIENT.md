# 🧪 Guide de Test Complet - Comme un Vrai Client

## 🎯 Objectif

Tester votre site comme si vous étiez un client qui veut acheter et utiliser vos services.

## ✅ Checklist de Test

### 1. Test sans paiement (Vérifier que c'est bloqué)

- [ ] Allez sur `/dialogues` → Doit afficher "Paiement requis"
- [ ] Allez sur `/reading-2026` → Doit afficher "Paiement requis"
- [ ] Allez sur `/saint-valentin` → Doit afficher "Paiement requis"
- [ ] Les formulaires doivent être grisés et désactivés
- [ ] Les boutons "Acheter maintenant" doivent rediriger vers `/pricing`

### 2. Test d'achat - Dialogue Pré-Incarnation

- [ ] Allez sur `/pricing`
- [ ] Cliquez sur "Acheter maintenant" pour "Dialogue pré-incarnation"
- [ ] ✅ Vous êtes redirigé vers Stripe Checkout (pas d'erreur)
- [ ] Utilisez la carte de test : `4242 4242 4242 4242`
- [ ] Date : `12/34`, CVC : `123`
- [ ] Entrez un email de test : `test.dialogue@example.com`
- [ ] Complétez le paiement
- [ ] ✅ Vous êtes redirigé vers `/dialogues?purchased=true`
- [ ] Le formulaire est maintenant activé
- [ ] Remplissez le formulaire avec le même email
- [ ] Cliquez sur "Générer le dialogue"
- [ ] ✅ La génération fonctionne

### 3. Test d'achat - Lecture 2026 (avec code promo)

- [ ] Allez sur `/pricing`
- [ ] Entrez le code promo : `Sondage50` ou `XQAGYYIG`
- [ ] Cliquez sur "Appliquer"
- [ ] Cliquez sur "Acheter maintenant" pour "Lecture 2026"
- [ ] ✅ Vous êtes redirigé vers Stripe Checkout
- [ ] ✅ Le rabais de 50% est appliqué (4,99$ au lieu de 9,99$)
- [ ] Utilisez la carte de test : `4242 4242 4242 4242`
- [ ] Entrez un email de test : `test.lecture@example.com`
- [ ] Complétez le paiement
- [ ] ✅ Vous êtes redirigé vers `/reading-2026?purchased=true`
- [ ] Le formulaire est maintenant activé
- [ ] Remplissez le formulaire avec le même email
- [ ] Cliquez sur "Générer la lecture 2026"
- [ ] ✅ La génération fonctionne

### 4. Test d'achat - Saint-Valentin 2026

- [ ] Allez sur `/pricing`
- [ ] Cliquez sur "Acheter maintenant" pour "Saint-Valentin 2026"
- [ ] ✅ Vous êtes redirigé vers Stripe Checkout
- [ ] Utilisez la carte de test : `4242 4242 4242 4242`
- [ ] Entrez un email de test : `test.valentine@example.com`
- [ ] Complétez le paiement
- [ ] ✅ Vous êtes redirigé vers `/saint-valentin?purchased=true`
- [ ] Le formulaire est maintenant activé
- [ ] Remplissez le formulaire avec le même email
- [ ] Cliquez sur "Générer la lecture"
- [ ] ✅ La génération fonctionne

### 5. Test de persistance (Recharger la page)

- [ ] Après un paiement réussi, rechargez la page (`F5`)
- [ ] ✅ Le formulaire reste activé (l'accès est mémorisé)
- [ ] ✅ Vous pouvez générer à nouveau sans repayer

### 6. Test avec un autre email (Doit être bloqué)

- [ ] Allez sur `/dialogues` avec un email différent de celui utilisé pour payer
- [ ] ✅ Le formulaire doit être bloqué (pas de paiement pour cet email)

### 7. Test de navigation

- [ ] Le lien "Tarifs" est visible dans le menu
- [ ] Le bouton "Tarifs" est visible sur la page d'accueil
- [ ] Le lien "Tarifs" est dans le footer

## 🎯 Résultats attendus

### ✅ Tout fonctionne si :

1. Les pages sont bloquées avant paiement
2. Les paiements redirigent vers Stripe Checkout
3. Après paiement, les formulaires sont activés
4. La génération fonctionne après paiement
5. L'accès persiste après rechargement

### ❌ Problèmes possibles :

- **Erreur "No such price"** → Price ID incorrect (corrigé maintenant)
- **Formulaire toujours bloqué après paiement** → Vérifier l'email (doit être le même)
- **Redirection ne fonctionne pas** → Vérifier les URLs dans `pricing/page.tsx`

## 📝 Notes de test

- Utilisez des **emails différents** pour chaque produit testé
- Les cartes de test Stripe fonctionnent uniquement en mode **TEST**
- L'accès est lié à l'**email** utilisé lors du paiement

## 🎉 C'est tout !

Testez chaque produit et vérifiez que tout fonctionne comme prévu.

