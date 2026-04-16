# 🗄️ Configuration Supabase - Guide complet

> ⚠️ **Ce guide est obsolète. Utilisez plutôt `GUIDE_CONFIGURATION_SUPABASE.md` pour un guide pas à pas détaillé.**

## 📋 Guide rapide

1. Créez un compte sur [supabase.com](https://supabase.com)
2. Créez un nouveau projet (plan Free)
3. Exécutez le schéma SQL (`web/database/schema.sql`) dans SQL Editor
4. Récupérez les clés API dans Settings → API
5. Configurez les secrets sur Fly.io :
   ```powershell
   flyctl secrets set NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co -a orbitalastro-web
   flyctl secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... -a orbitalastro-web
   ```
6. Redéployez : `flyctl deploy -a orbitalastro-web`

## 📚 Documentation complète

Consultez **`GUIDE_CONFIGURATION_SUPABASE.md`** pour un guide détaillé pas à pas avec :
- Instructions complètes pour chaque étape
- Captures d'écran et exemples
- Dépannage
- Vérifications de sécurité

