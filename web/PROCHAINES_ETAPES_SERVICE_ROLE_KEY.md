# 🔑 Prochaine étape : Service Role Key

## ✅ Project URL configurée !

Votre Project URL `https://imguhuihecpydbpfemyq.supabase.co` est maintenant configurée sur Fly.io.

## 📋 Maintenant : Récupérer la Service Role Key

Sur la **même page** (Settings → API) :

1. **Descendez** jusqu'à la section **"API Keys"**
2. Vous verrez plusieurs clés :
   - **`anon` `public`** : Clé publique (ne pas utiliser)
   - **`service_role` `secret`** : ⚠️ **C'EST CELLE-CI QU'IL FAUT**
3. À côté de **`service_role` `secret`**, vous verrez :
   - Un bouton **"Reveal"** ou **"Show"** ou un œil 👁️
   - Ou la clé est masquée avec des points `••••••••`
4. **Cliquez sur "Reveal"** pour voir la clé complète
5. La clé commence par `eyJhbGc...` (c'est très long, ~200 caractères)
6. **Copiez TOUTE la clé** (du début à la fin)

## ⚠️ Important

- La Service Role Key est **SECRÈTE**
- Ne la partagez **JAMAIS** publiquement
- Elle est très longue (environ 200 caractères)
- Copiez-la **complètement**

## 🎯 Une fois que vous l'avez copiée

Exécutez cette commande (remplacez `eyJhbGc...` par votre vraie clé complète) :

```powershell
flyctl secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... -a orbitalastro-web
```

## 📍 Où se trouve la section API Keys

Sur la page Settings → API, descendez en bas. Vous devriez voir une section qui dit :

```
API Keys
├─ anon public
└─ service_role secret  ← C'EST CELLE-CI
```

## 🆘 Si vous ne voyez pas "service_role"

1. **Faites défiler** la page vers le bas
2. Cherchez une section **"API Keys"** ou **"Project API keys"**
3. Il devrait y avoir au moins 2 clés : `anon` et `service_role`
4. Si vous ne la voyez toujours pas, rafraîchissez la page (`F5`)

