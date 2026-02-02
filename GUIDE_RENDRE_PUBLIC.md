# 🔓 Guide pour rendre le code public en toute sécurité

Ce guide vous aide à rendre votre code open source tout en protégeant vos informations confidentielles.

## ✅ Checklist avant de rendre public

### 1. Vérifier qu'aucune clé API n'est dans le code

```bash
# Rechercher des clés API dans le code
grep -r "sk_live_\|sk_test_\|pk_live_\|pk_test_\|whsec_" --exclude-dir=node_modules --exclude-dir=.git .
```

**⚠️ Si vous trouvez des clés :**
- Remplacez-les par des placeholders (ex: `pk_test_VOTRE_CLE_ICI`)
- Ou supprimez-les complètement

### 2. Vérifier le .gitignore

Assurez-vous que votre `.gitignore` contient :
- `.env`
- `.env.local`
- `.env*.local`
- Tous les fichiers contenant des secrets

### 3. Créer des fichiers .env.example

Créez des fichiers `.env.example` qui montrent la structure sans les vraies valeurs :
- `.env.example` (racine)
- `web/.env.example` (frontend)

### 4. Nettoyer l'historique Git (si nécessaire)

Si vous avez déjà commité des secrets par erreur :

```bash
# Option 1 : Utiliser git-filter-repo (recommandé)
git filter-repo --invert-paths --path "fichier-avec-secret.txt"

# Option 2 : Utiliser BFG Repo-Cleaner
# Télécharger depuis https://rtyley.github.io/bfg-repo-cleaner/
bfg --replace-text passwords.txt
```

### 5. Vérifier les fichiers de documentation

Vérifiez que vos fichiers `.md` ne contiennent pas de vraies clés API :
- Remplacez les exemples par des placeholders
- Utilisez des valeurs fictives dans les exemples

### 6. Ajouter un fichier SECURITY.md

Créez un fichier `SECURITY.md` pour indiquer comment signaler des vulnérabilités.

### 7. Vérifier les fichiers de configuration

Vérifiez que ces fichiers ne contiennent pas de secrets :
- `fly.toml` (peut contenir des URLs mais pas de secrets)
- `vercel.json` (peut contenir des configs mais pas de secrets)
- `package.json` (vérifier les scripts)
- Tous les fichiers de config

## 🔐 Variables d'environnement à protéger

### Stripe
- `STRIPE_SECRET_KEY` (sk_live_... ou sk_test_...)
- `STRIPE_WEBHOOK_SECRET` (whsec_...)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (pk_live_... ou pk_test_...) - moins sensible mais à protéger quand même

### NextAuth
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL` (peut être public)

### API Keys
- `GEMINI_API_KEY`
- `RESEND_API_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Autres
- Tous les mots de passe
- Tous les tokens d'accès
- Toutes les clés privées

## 📝 Fichiers à créer/modifier

### 1. Créer .env.example

```bash
# Copiez votre .env.local et remplacez les vraies valeurs par des placeholders
cp .env.local .env.example
# Puis éditez .env.example pour remplacer les secrets
```

### 2. Améliorer .gitignore

Ajoutez ces lignes si elles n'y sont pas déjà :
```
# Secrets et clés API
*.key
*.pem
*.p12
secrets/
*.secret

# Fichiers de configuration locaux
config.local.*
*.local.json
```

### 3. Créer SECURITY.md

Voir le fichier `SECURITY.md` créé dans ce projet.

## 🚨 Actions immédiates si vous avez déjà commité des secrets

1. **Révocation immédiate** : Si vous avez commité des clés de production :
   - Allez sur Stripe Dashboard → Developers → API keys
   - Révocation des clés exposées
   - Créez de nouvelles clés

2. **Nettoyer l'historique Git** (voir section 4 ci-dessus)

3. **Mettre à jour les secrets** dans Fly.io/Vercel avec les nouvelles clés

## ✅ Vérification finale

Avant de rendre public, vérifiez :

- [ ] Aucune clé API dans le code source
- [ ] Aucune clé API dans les fichiers de documentation
- [ ] `.gitignore` est complet
- [ ] `.env.example` existe et est à jour
- [ ] `SECURITY.md` existe
- [ ] `LICENSE` est approprié (MIT, Apache, etc.)
- [ ] `README.md` explique comment configurer les variables d'environnement

## 📚 Ressources

- [GitHub Security Best Practices](https://docs.github.com/en/code-security)
- [OWASP Secrets Management](https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_cryptographic_key)
- [GitHub Docs: Removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository)
