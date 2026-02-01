# Dépannage : Serveur ne démarre pas

## Vérification immédiate

### 1. Vérifier dans votre terminal PowerShell

**Regardez votre terminal PowerShell** où vous avez lancé `npm run dev` ou `npm run dev:fast`.

**Cherchez** :
- Des **erreurs en rouge**
- Des messages d'erreur de compilation
- Le message "Ready" ou "compiled successfully"

### 2. Erreurs courantes et solutions

#### Erreur : "NEXTAUTH_SECRET is not set"

**Solution** : 
1. Vérifiez que le fichier `.env.local` existe dans `web/`
2. Vérifiez qu'il contient : `NEXTAUTH_SECRET=8XEOaFMsjus77re8OAz5zeB1AqZtpOjnage8O9H7rtg=`
3. **Redémarrez le serveur** : Ctrl+C puis `npm run dev:fast`

#### Erreur : "Module not found"

**Solution** :
```powershell
cd C:\Users\isabe\orbitalastro\web
npm install
```

#### Erreur : "Port 3000 already in use"

**Solution** : Un autre programme utilise le port 3000. Fermez-le ou utilisez un autre port :
```powershell
$env:PORT=3001; npm run dev:fast
```

### 3. Réinitialiser complètement

Si rien ne fonctionne :

```powershell
cd C:\Users\isabe\orbitalastro\web

# Supprimer le cache Next.js
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .next-dev -ErrorAction SilentlyContinue

# Réinstaller les dépendances
npm install

# Redémarrer
npm run dev:fast
```

## Ce que vous devriez voir dans le terminal

**Si le serveur démarre correctement** :
```
○ Compiling / ...
✓ Compiled / in X seconds
✓ Ready in X seconds
○ Local: http://localhost:3000
```

**Si le serveur ne démarre pas** :
- Vous verrez des erreurs en rouge
- Le message "Ready" n'apparaîtra pas
- Le port ne sera pas accessible

## Action immédiate

**Copiez-collez les messages d'erreur** que vous voyez dans votre terminal PowerShell et je vous aiderai à les résoudre.

