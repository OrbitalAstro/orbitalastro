# Tester la page Pricing - Guide rapide

## ✅ Ce qui devrait fonctionner

Avec le serveur qui tourne, vous pouvez tester la page pricing !

## 🧪 Tests à faire

### Test 1 : Accéder à la page Pricing

1. **Ouvrez votre navigateur** : http://localhost:3000
2. **Allez à** : http://localhost:3000/pricing
   - OU cliquez sur le lien "Pricing" / "Tarifs" dans le menu en haut

**Résultat attendu** :
- ✅ Page de pricing s'affiche
- ✅ Titre "Nos Services" visible
- ✅ Badge "Offre de lancement" visible
- ✅ Section "Services à la pièce" avec 2 produits :
  - Dialogue Pré-Incarnation (9,99$ CAD)
  - Lecture 2026 (9,99$ CAD)
- ✅ Section "Abonnement" avec :
  - Abonnement Mensuel (12,99$ CAD / mois)
  - Liste des fonctionnalités incluses

### Test 2 : Section Code Promo

1. **Sur la page pricing**, trouvez la section "Vous avez un code promo ?"
2. **Testez** :
   - Entrez un code promo (ex: `TEST123`)
   - Cliquez sur "Appliquer"
   - Vérifiez que le message "✓ Code promo appliqué" apparaît

**Résultat attendu** :
- ✅ Section code promo visible
- ✅ Champ de saisie fonctionne
- ✅ Bouton "Appliquer" fonctionne
- ✅ Message de confirmation apparaît

### Test 3 : Boutons "Acheter maintenant" / "S'abonner"

1. **Cliquez sur "Acheter maintenant"** pour Dialogue Pré-Incarnation
2. **Cliquez sur "Acheter maintenant"** pour Lecture 2026
3. **Cliquez sur "S'abonner maintenant"** pour l'Abonnement Mensuel

**Résultat attendu** :
- ⚠️ Message d'alerte : "Ce produit n'est pas encore configuré. Veuillez contacter le support."
- ✅ C'est normal ! Stripe n'est pas encore configuré

**Note** : Une fois Stripe configuré, ces boutons redirigeront vers Stripe Checkout.

### Test 4 : Design et Responsive

1. **Vérifiez le design** :
   - Les produits sont bien alignés
   - Les couleurs sont cohérentes (or, violet)
   - Les badges "OFFRE DE LANCEMENT" sont visibles
   - Les icônes s'affichent correctement

2. **Testez sur mobile** :
   - Ouvrez les DevTools (F12)
   - Activez le mode mobile (icône téléphone)
   - Vérifiez que la page est responsive

**Résultat attendu** :
- ✅ Design cohérent avec le reste du site
- ✅ Responsive sur mobile
- ✅ Tous les éléments sont visibles

### Test 5 : Navigation

1. **Depuis la page pricing**, testez :
   - Cliquez sur le logo → Redirige vers `/` (page d'accueil)
   - Cliquez sur "Dialogues" dans le menu → Redirige vers `/dialogues`
   - Cliquez sur "Lecture 2026" dans le menu → Redirige vers `/reading-2026`

**Résultat attendu** :
- ✅ Navigation fonctionne correctement
- ✅ Pas d'erreur 404

## ✅ Checklist de test

Cochez au fur et à mesure :

- [ ] Page `/pricing` s'affiche correctement
- [ ] Titre "Nos Services" visible
- [ ] Section "Services à la pièce" avec 2 produits
- [ ] Section "Abonnement" avec 1 abonnement
- [ ] Badges "OFFRE DE LANCEMENT" visibles
- [ ] Section code promo visible et fonctionnelle
- [ ] Boutons "Acheter maintenant" / "S'abonner" visibles
- [ ] Message d'alerte apparaît au clic (normal, Stripe pas configuré)
- [ ] Design cohérent et responsive
- [ ] Navigation fonctionne
- [ ] Pas d'erreur dans la console (F12 → Console)

## 🎯 Ce qui fonctionne vs Ce qui nécessite Stripe

### ✅ Fonctionne MAINTENANT (sans Stripe) :

- Page de pricing s'affiche
- Design et layout
- Section code promo (interface)
- Navigation
- Responsive

### ⚠️ Nécessite Stripe (à configurer) :

- Boutons "Acheter maintenant" / "S'abonner" (redirigent vers Stripe Checkout)
- Validation des codes promo (vérification dans Stripe)
- Paiements réels

## 🐛 Problèmes courants

### Problème : Page 404 sur `/pricing`

**Solution** : Vérifiez que le fichier `web/app/pricing/page.tsx` existe et redémarrez le serveur.

### Problème : Erreur dans la console

**Solution** : Ouvrez la console (F12) et copiez les erreurs. Vérifiez que les dépendances sont installées :
```powershell
npm install
```

### Problème : Les produits ne s'affichent pas

**Solution** : Vérifiez que `web/lib/stripe.ts` contient bien `oneTimeProducts` et `subscriptions`.

## 📝 Notes

- **Stripe non configuré** : C'est normal que les boutons affichent une alerte
- **Codes promo** : L'interface fonctionne, mais la validation nécessite Stripe
- **Design** : La page devrait être cohérente avec le reste du site

## 🚀 Prêt à tester ?

1. Assurez-vous que le serveur tourne (`npm run dev:fast`)
2. Ouvrez http://localhost:3000/pricing
3. Testez tous les éléments !

Dites-moi ce qui fonctionne ou ce qui ne fonctionne pas ! 🎯

