# Tester l'authentification - Guide rapide

## ✅ Ce qui devrait fonctionner

Avec le serveur qui tourne, vous pouvez tester l'authentification complète !

## 🧪 Tests à faire

### Test 1 : Page d'inscription

1. **Ouvrez votre navigateur** : http://localhost:3000
2. **Allez à** : http://localhost:3000/auth/signup
3. **Remplissez le formulaire** :
   - **Nom** : Test User
   - **Email** : test@example.com
   - **Mot de passe** : test1234 (minimum 8 caractères)
   - **Confirmation** : test1234
4. **Cliquez** sur "Créer mon compte"

**Résultat attendu** :
- ✅ Redirection vers `/dashboard` ou `/` (page d'accueil)
- ✅ Pas d'erreur dans la console (F12 → Console)
- ✅ Message de succès ou pas d'erreur

**Note** : En mode test, n'importe quel email/password fonctionne car il n'y a pas encore de base de données.

### Test 2 : Page de connexion

1. **Allez à** : http://localhost:3000/auth/signin
2. **Remplissez** :
   - **Email** : test@example.com (ou n'importe quel email)
   - **Mot de passe** : test1234 (ou n'importe quel mot de passe)
3. **Cliquez** sur "Se connecter"

**Résultat attendu** :
- ✅ Redirection vers `/dashboard` ou `/`
- ✅ Pas d'erreur
- ✅ Session créée (vous êtes connecté)

### Test 3 : Navigation entre les pages

1. **Pendant que vous êtes connecté**, testez :
   - Cliquez sur le logo → Redirige vers `/` (page d'accueil)
   - Allez sur `/dashboard` → Affiche la page dashboard
   - Allez sur `/pricing` → Affiche la page pricing
   - Allez sur `/settings` → Affiche la page settings

**Résultat attendu** :
- ✅ Toutes les pages s'affichent correctement
- ✅ Pas d'erreur de session

### Test 4 : Validation des formulaires

#### Test 4a : Email invalide

1. Allez sur `/auth/signup`
2. Essayez d'entrer un email invalide (ex: `test` sans @)
3. Cliquez sur "Créer mon compte"

**Résultat attendu** :
- ✅ Le navigateur affiche une erreur de validation HTML
- ✅ Le formulaire ne se soumet pas

#### Test 4b : Mot de passe trop court

1. Allez sur `/auth/signup`
2. Entrez un mot de passe de moins de 8 caractères (ex: `test123`)
3. Cliquez sur "Créer mon compte"

**Résultat attendu** :
- ✅ Le navigateur affiche une erreur de validation HTML
- ✅ Le formulaire ne se soumet pas

#### Test 4c : Mots de passe différents

1. Allez sur `/auth/signup`
2. Entrez :
   - Mot de passe : `test1234`
   - Confirmation : `test5678`
3. Cliquez sur "Créer mon compte"

**Résultat attendu** :
- ✅ Message d'erreur : "Les mots de passe ne correspondent pas"
- ✅ Le formulaire ne se soumet pas

## 🔍 Vérifications supplémentaires

### Console du navigateur

1. **Ouvrez les DevTools** : Appuyez sur **F12**
2. **Allez dans l'onglet "Console"**
3. **Testez l'inscription/connexion**
4. **Vérifiez** qu'il n'y a pas d'erreurs en rouge

**Si vous voyez des erreurs** :
- Copiez les messages d'erreur et je vous aiderai

### Réseau (Network)

1. **Dans DevTools**, allez dans l'onglet **"Network"**
2. **Testez la connexion**
3. **Cherchez** des requêtes vers `/api/auth/[...nextauth]`

**Résultat attendu** :
- ✅ Requêtes vers `/api/auth/callback/credentials` (POST)
- ✅ Status 200 (succès) ou 302 (redirection)
- ✅ Pas d'erreurs 4xx ou 5xx

## ✅ Checklist de test

Cochez au fur et à mesure :

- [ ] `/auth/signup` s'affiche correctement
- [ ] Inscription avec email/password valides fonctionne
- [ ] Redirection après inscription fonctionne
- [ ] `/auth/signin` s'affiche correctement
- [ ] Connexion avec email/password fonctionne
- [ ] Redirection après connexion fonctionne
- [ ] Validation email invalide fonctionne
- [ ] Validation mot de passe trop court fonctionne
- [ ] Validation mots de passe différents fonctionne
- [ ] Pas d'erreurs dans la console (F12)
- [ ] Navigation entre pages fonctionne après connexion

## 🎯 Ce qui est attendu (mode test)

**Important** : L'authentification est en **mode test** :
- ✅ Accepte **n'importe quel** email/password
- ✅ Pas de vérification dans une base de données
- ✅ Sessions JWT (temporaires, pas persistées)
- ⚠️ **Ne convient pas pour la production**

C'est normal pour tester ! Nous configurerons une vraie base de données (Supabase) ensuite.

## 🐛 Problèmes courants

### Problème : "NEXTAUTH_SECRET is not set"

**Solution** : Vérifiez que `.env.local` contient :
```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=8XEOaFMsjus77re8OAz5zeB1AqZtpOjnage8O9H7rtg=
```

Si ce n'est pas le cas, ajoutez ces lignes et **redémarrez le serveur** (Ctrl+C puis `npm run dev:fast`).

### Problème : Erreur 404 sur `/api/auth/[...nextauth]`

**Solution** : Vérifiez que le fichier `web/app/api/auth/[...nextauth]/route.ts` existe.

### Problème : Redirection vers `/dashboard` mais page vide

**Solution** : Vérifiez que la page `/dashboard` existe. Si elle n'existe pas, la redirection se fera vers `/` (page d'accueil).

## 📝 Notes

- **Mode test** = Accepte n'importe quel email/password
- **Sessions JWT** = Pas besoin de base de données pour tester
- **Production** = Nécessitera Supabase ou autre base de données

## 🚀 Prêt à tester ?

1. Assurez-vous que le serveur tourne (`npm run dev:fast`)
2. Ouvrez http://localhost:3000/auth/signup
3. Testez l'inscription !
4. Testez la connexion !

Dites-moi ce qui fonctionne ou ce qui ne fonctionne pas ! 🎯

