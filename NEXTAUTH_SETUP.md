# Configuration NextAuth.js - Orbital Astro

## ✅ Fait

### 1. Installation de NextAuth
- ✅ NextAuth.js déjà ajouté dans `package.json`

### 2. Structure créée
- ✅ `web/app/api/auth/[...nextauth]/route.ts` - Configuration NextAuth
- ✅ `web/types/next-auth.d.ts` - Types TypeScript pour NextAuth
- ✅ `web/lib/useAuth.ts` - Hook personnalisé pour utiliser l'authentification
- ✅ `web/app/auth/signin/page.tsx` - Page de connexion
- ✅ `web/app/auth/signup/page.tsx` - Page d'inscription
- ✅ `web/app/providers.tsx` - Mis à jour pour inclure SessionProvider

## ⚙️ Configuration requise

### 1. Variables d'environnement

Ajoutez dans `.env.local` (dans `web/`) :

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=votre_secret_random_ici

# Pour générer un secret random :
# Windows PowerShell : [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
# Linux/Mac : openssl rand -base64 32
```

### 2. En production (Fly.io/Vercel)

**Fly.io** :
```powershell
flyctl secrets set NEXTAUTH_URL=https://www.orbitalastro.ca -a orbitalastro-web
flyctl secrets set NEXTAUTH_SECRET=votre_secret_random -a orbitalastro-web
```

**Vercel** :
- Dashboard → Settings → Environment Variables
- Ajoutez `NEXTAUTH_URL` et `NEXTAUTH_SECRET`

## 🔐 Mode actuel : Test (JWT sans base de données)

Actuellement, NextAuth est configuré en mode **test** :
- ✅ Utilise JWT pour les sessions (pas besoin de base de données)
- ✅ Accepte n'importe quel email/password (pour tester)
- ⚠️ **Les données ne sont pas persistées**

## 📝 Prochaines étapes : Base de données

Pour passer en production, il faut :

1. **Configurer une base de données** (Supabase recommandé)
2. **Créer les tables** (utilisateurs, sessions, etc.)
3. **Mettre à jour NextAuth** pour utiliser la base de données
4. **Créer l'API `/api/auth/signup`** pour l'inscription

Voir `STRIPE_INTEGRATION_STATUS.md` pour les détails.

## 🧪 Tester l'authentification

1. Installez les dépendances :
   ```powershell
   cd web
   npm install
   ```

2. Ajoutez `NEXTAUTH_SECRET` dans `.env.local`

3. Démarrez le serveur de développement :
   ```powershell
   npm run dev
   ```

4. Visitez `/auth/signin` ou `/auth/signup`

5. Testez avec n'importe quel email/password (mode test)

## 📚 Ressources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [NextAuth.js + Credentials Provider](https://next-auth.js.org/configuration/providers/credentials)
- [NextAuth.js + Database](https://next-auth.js.org/configuration/databases)

