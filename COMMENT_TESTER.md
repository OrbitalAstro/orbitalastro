# Comment tester - Guide rapide

Guide pratique pour tester l'intégration Stripe et NextAuth sur votre machine.

## ⚙️ Étape 1 : Configuration initiale (5 minutes)

### 1.1 Générer le secret NextAuth

Ouvrez PowerShell et exécutez :

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Copiez le résultat (ex: `A3b7K9mN2pQ5rT8vW1xY4zA6bC9dE2f...`)

### 1.2 Créer le fichier `.env.local`

Dans le dossier `web/`, créez ou modifiez `.env.local` :

```bash
# NextAuth (OBLIGATOIRE pour tester l'authentification)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=A3b7K9mN2pQ5rT8vW1xY4zA6bC9dE2f...

# Stripe (FACULTATIF pour l'instant - ajouter plus tard si vous créez un compte Stripe)
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Important** : Remplacez `A3b7K9mN2pQ5rT8vW1xY4zA6bC9dE2f...` par le secret que vous avez généré.

### 1.3 Installer les dépendances

```powershell
cd web
npm install
```

Si vous voyez des erreurs, essayez :
```powershell
npm install --legacy-peer-deps
```

### 1.4 Démarrer le serveur

```powershell
npm run dev
```

Vous devriez voir :
```
✓ Ready in X seconds
○ Local: http://localhost:3000
```

## 🧪 Étape 2 : Tests (10 minutes)

### Test 1 : Page d'inscription

1. **Ouvrez votre navigateur** : http://localhost:3000
2. **Allez à** : http://localhost:3000/auth/signup
3. **Remplissez le formulaire** :
   - Nom : Test User
   - Email : test@example.com
   - Mot de passe : test1234 (min 8 caractères)
   - Confirmation : test1234
4. **Cliquez** sur "Créer mon compte"

**Résultat attendu** :
- ✅ Redirection vers `/dashboard` (ou `/`)
- ✅ Pas d'erreur dans la console

**Si erreur** : Vérifiez que `NEXTAUTH_SECRET` est bien dans `.env.local`

### Test 2 : Page de connexion

1. **Allez à** : http://localhost:3000/auth/signin
2. **Remplissez** :
   - Email : test@example.com (ou n'importe quel email)
   - Mot de passe : test1234 (ou n'importe quel mot de passe)
3. **Cliquez** sur "Se connecter"

**Résultat attendu** :
- ✅ Redirection vers `/dashboard` (ou `/`)
- ✅ Pas d'erreur

**Note** : En mode test, n'importe quel email/password fonctionne.

### Test 3 : Page Pricing

1. **Allez à** : http://localhost:3000/pricing
2. **Vérifiez** :
   - Les 3 plans s'affichent (Gratuit, Mensuel, Annuel)
   - Le design est correct
   - Les boutons "S'abonner" sont visibles

**Résultat attendu** :
- ✅ Page de pricing complète
- ✅ 3 plans visibles

**Note** : Le bouton "S'abonner" nécessite Stripe configuré. Sans Stripe, il affichera une erreur (normal).

### Test 4 : Menu de navigation

1. **Sur n'importe quelle page**, regardez le menu en haut
2. **Vérifiez** :
   - Le lien "Pricing" / "Tarifs" est visible (à côté de Settings)
   - Le clic redirige vers `/pricing`

**Résultat attendu** :
- ✅ Lien "Pricing" visible dans le menu
- ✅ Redirection vers `/pricing` au clic

### Test 5 : Responsive (Mobile)

1. **Ouvrez les DevTools** (F12)
2. **Activez le mode mobile** (icône téléphone en haut à gauche)
3. **Testez** :
   - Ouvrir le menu mobile (hamburger)
   - Vérifier que "Pricing" est dans le menu mobile
   - Tester la page `/pricing` sur mobile

**Résultat attendu** :
- ✅ Menu mobile fonctionne
- ✅ Page pricing responsive

## ✅ Checklist rapide

Cochez au fur et à mesure :

- [ ] `NEXTAUTH_SECRET` généré et ajouté dans `.env.local`
- [ ] `npm install` exécuté sans erreur
- [ ] Serveur démarre avec `npm run dev`
- [ ] `/auth/signup` fonctionne (inscription)
- [ ] `/auth/signin` fonctionne (connexion)
- [ ] `/pricing` s'affiche correctement
- [ ] Menu contient "Pricing"
- [ ] Pas d'erreur dans la console du navigateur (F12 → Console)
- [ ] Pas d'erreur dans le terminal (logs du serveur)

## 🐛 Problèmes courants

### Problème : "NEXTAUTH_SECRET is not set"

**Solution** :
1. Vérifiez que `.env.local` existe dans `web/`
2. Vérifiez que `NEXTAUTH_SECRET=...` est dans le fichier
3. **Redémarrez le serveur** : `Ctrl+C` puis `npm run dev`

### Problème : "Module 'next-auth' not found"

**Solution** :
```powershell
cd web
npm install next-auth
npm install
```

### Problème : Le serveur ne démarre pas

**Solution** :
1. Vérifiez que vous êtes dans `web/` : `cd web`
2. Vérifiez les erreurs dans le terminal
3. Essayez : `npm install --legacy-peer-deps`

### Problème : Erreur sur `/pricing`

**Solution** :
- Si Stripe n'est pas configuré, c'est normal que le bouton "S'abonner" ne fonctionne pas
- Vérifiez juste que la page s'affiche correctement

### Problème : Erreur "SessionProvider"

**Solution** :
- Vérifiez que `web/app/providers.tsx` contient `<SessionProvider>`
- Si non, le fichier a peut-être été modifié

## 🎯 Ce qui fonctionne vs Ce qui nécessite Stripe

### ✅ Fonctionne MAINTENANT (sans Stripe) :

- Page d'inscription (`/auth/signup`)
- Page de connexion (`/auth/signin`)
- Authentification (mode test - accepte n'importe quel email/password)
- Page pricing (affichage)
- Navigation avec lien "Pricing"

### ⚠️ Nécessite Stripe (à configurer plus tard) :

- Bouton "S'abonner" (nécessite clés Stripe)
- Checkout Stripe (nécessite produits créés dans Stripe)
- Webhooks (nécessite configuration Stripe)

## 📝 Résultat des tests

Après les tests, vous devriez pouvoir :

1. ✅ **Créer un compte** via `/auth/signup`
2. ✅ **Se connecter** via `/auth/signin`
3. ✅ **Voir la page pricing** avec les 3 plans
4. ✅ **Accéder à pricing** depuis le menu

## 🚀 Prochaines étapes (après les tests)

Une fois que tout fonctionne :

1. **Configurer Stripe** (optionnel pour l'instant) :
   - Créer un compte Stripe
   - Récupérer les clés API
   - Créer les produits

2. **Configurer une base de données** :
   - Supabase (recommandé - gratuit)
   - Remplacer l'authentification test par vraie authentification

3. **Créer les pages légales** :
   - `/terms` - Conditions d'utilisation
   - `/privacy` - Politique de confidentialité

## 💡 Astuce

**Mode test** : Pour l'instant, l'authentification accepte n'importe quel email/password. C'est normal - c'est pour tester sans base de données. Nous configurerons la vraie authentification avec Supabase ensuite.

## 🆘 Besoin d'aide ?

Si vous rencontrez un problème :

1. Vérifiez les **logs dans le terminal** (où vous avez lancé `npm run dev`)
2. Vérifiez la **console du navigateur** (F12 → Console)
3. Vérifiez que `.env.local` existe et contient `NEXTAUTH_SECRET`
4. Essayez de **redémarrer le serveur** (Ctrl+C puis `npm run dev`)

Bon test ! 🚀

