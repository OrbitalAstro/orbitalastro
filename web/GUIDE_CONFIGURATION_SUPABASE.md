# 🚀 Guide de Configuration Supabase - Pas à Pas

## 📋 Étape 1 : Créer un compte Supabase (5 minutes)

1. Allez sur [https://supabase.com](https://supabase.com)
2. Cliquez sur **"Start your project"** ou **"Sign up"**
3. Créez un compte avec :
   - Email
   - Mot de passe
   - Ou connectez-vous avec GitHub (recommandé)

## 📋 Étape 2 : Créer un nouveau projet (3 minutes)

1. Une fois connecté, cliquez sur **"New Project"**
2. Remplissez les informations :
   - **Organization** : Créez-en une nouvelle ou utilisez celle par défaut
   - **Name** : `orbitalastro` (ou votre choix)
   - **Database Password** : ⚠️ **IMPORTANT** : Choisissez un mot de passe fort et **SAUVEGARDEZ-LE** quelque part (vous en aurez besoin)
   - **Region** : Choisissez **Canada (Central)** ou la région la plus proche de vos utilisateurs
   - **Pricing Plan** : Sélectionnez **Free** (plan gratuit avec 500 MB)

3. Cliquez sur **"Create new project"**
4. ⏳ Attendez 2-3 minutes que le projet soit créé

## 📋 Étape 3 : Exécuter le schéma SQL (5 minutes)

1. Dans votre projet Supabase, allez dans **"SQL Editor"** (menu de gauche)
2. Cliquez sur **"New query"**
3. Ouvrez le fichier `web/database/schema.sql` sur votre ordinateur
4. **Copiez TOUT le contenu** du fichier
5. **Collez-le** dans l'éditeur SQL de Supabase
6. Cliquez sur **"Run"** (ou appuyez sur `Ctrl+Enter` / `Cmd+Enter`)

✅ **Vous devriez voir** :
- ✅ Success: Tables created
- ✅ Success: Indexes created
- ✅ Success: Triggers created
- ✅ Success: Functions created
- ✅ Success: Views created

⚠️ **Si vous voyez des erreurs** :
- Si certaines tables existent déjà, c'est normal, ignorez ces erreurs
- Si d'autres erreurs apparaissent, copiez-les et je vous aiderai

## 📋 Étape 4 : Vérifier que les tables sont créées (1 minute)

1. Dans Supabase, allez dans **"Table Editor"** (menu de gauche)
2. Vous devriez voir ces tables :
   - ✅ `payments`
   - ✅ `user_access`
   - ✅ `subscribers`
   - ✅ `generations`

Si toutes les tables sont là, c'est parfait ! ✅

## 📋 Étape 5 : Récupérer les clés API (2 minutes)

1. Dans Supabase, allez dans **"Settings"** (menu de gauche, icône ⚙️)
2. Cliquez sur **"API"** dans le sous-menu
3. Vous verrez plusieurs informations importantes :

### Project URL
- Copiez la **Project URL** : `https://xxxxx.supabase.co`
- ⚠️ C'est la valeur pour `NEXT_PUBLIC_SUPABASE_URL`

### API Keys
- **`anon` `public`** : Clé publique (peut être exposée au frontend, mais limitée)
- **`service_role` `secret`** : ⚠️ **CLÉ SECRÈTE** - Ne JAMAIS exposer au frontend
- ⚠️ Copiez la **`service_role` `secret`** : `eyJhbGc...`
- ⚠️ C'est la valeur pour `SUPABASE_SERVICE_ROLE_KEY`

## 📋 Étape 6 : Configurer les variables d'environnement sur Fly.io

### Option A : Via la ligne de commande (recommandé)

```powershell
# Remplacez les valeurs par celles que vous avez copiées
flyctl secrets set NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co -a orbitalastro-web
flyctl secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... -a orbitalastro-web
```

### Option B : Via le dashboard Fly.io

1. Allez sur [https://fly.io/dashboard](https://fly.io/dashboard)
2. Sélectionnez votre app `orbitalastro-web`
3. Allez dans **"Secrets"** (menu de gauche)
4. Cliquez sur **"Add Secret"**
5. Ajoutez :
   - **Name** : `NEXT_PUBLIC_SUPABASE_URL`
   - **Value** : `https://xxxxx.supabase.co`
6. Répétez pour :
   - **Name** : `SUPABASE_SERVICE_ROLE_KEY`
   - **Value** : `eyJhbGc...`

## 📋 Étape 7 : Configurer les variables d'environnement en local (optionnel)

Si vous voulez tester en local, créez/modifiez `web/.env.local` :

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# (Les autres variables sont déjà configurées)
```

⚠️ **Important** : Ne commitez JAMAIS `.env.local` dans Git (il est déjà dans `.gitignore`)

## 📋 Étape 8 : Redéployer l'application (2 minutes)

```powershell
cd web
flyctl deploy -a orbitalastro-web
```

Cela prendra quelques minutes. Une fois terminé, votre application utilisera Supabase !

## 📋 Étape 9 : Tester que tout fonctionne (5 minutes)

### Test 1 : Vérifier que les tables existent
1. Dans Supabase → **"Table Editor"**
2. Vérifiez que vous voyez les 4 tables

### Test 2 : Faire un paiement test
1. Allez sur votre site : `https://orbitalastro-web.fly.dev/pricing`
2. Faites un paiement test avec Stripe (mode test)
3. Vérifiez dans Supabase → **"Table Editor"** → `payments`
   - Un nouveau paiement devrait apparaître
4. Vérifiez dans `subscribers`
   - Un nouvel abonné devrait apparaître automatiquement (grâce au trigger)

### Test 3 : Vérifier les logs
1. Dans Supabase → **"Logs"** → **"Postgres Logs"**
2. Vous devriez voir les requêtes SQL s'exécuter

## ✅ Vérification finale

### Checklist
- [ ] Compte Supabase créé
- [ ] Projet créé (plan Free)
- [ ] Schéma SQL exécuté avec succès
- [ ] 4 tables visibles dans Table Editor
- [ ] Clés API récupérées (Project URL + Service Role Key)
- [ ] Variables d'environnement configurées sur Fly.io
- [ ] Application redéployée
- [ ] Test de paiement effectué
- [ ] Données visibles dans Supabase

## 🔒 Sécurité - Rappels importants

⚠️ **NE JAMAIS** :
- Exposer `SUPABASE_SERVICE_ROLE_KEY` au frontend
- Commiter les clés API dans Git
- Partager les clés API publiquement

✅ **TOUJOURS** :
- Utiliser `SUPABASE_SERVICE_ROLE_KEY` uniquement dans les API routes (backend)
- Utiliser `NEXT_PUBLIC_SUPABASE_URL` dans le frontend (si nécessaire)
- Stocker les secrets dans Fly.io secrets (pas dans le code)

## 🆘 Dépannage

### Problème : "Tables already exist"
- **Solution** : C'est normal si vous avez déjà exécuté le schéma. Les tables existantes ne seront pas écrasées.

### Problème : "Permission denied"
- **Solution** : Vérifiez que vous utilisez la `service_role` key (pas la `anon` key) dans les API routes.

### Problème : "Connection refused"
- **Solution** : Vérifiez que `NEXT_PUBLIC_SUPABASE_URL` est correct (commence par `https://`)

### Problème : Les données n'apparaissent pas après un paiement
- **Solution** : 
  1. Vérifiez que le webhook Stripe est configuré
  2. Vérifiez les logs Supabase pour voir les erreurs
  3. Vérifiez que les triggers sont bien créés

## 📞 Besoin d'aide ?

Si vous rencontrez des problèmes :
1. Vérifiez les logs dans Supabase → **"Logs"**
2. Vérifiez les logs dans Fly.io → **"Monitoring"**
3. Copiez les messages d'erreur et je vous aiderai

## 🎉 Félicitations !

Une fois toutes ces étapes terminées, vous aurez :
- ✅ Base de données Supabase configurée
- ✅ Sauvegarde automatique des emails après paiement
- ✅ Historique des générations
- ✅ Système de newsletters prêt
- ✅ Tout fonctionne automatiquement !

