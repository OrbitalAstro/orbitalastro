# Fichier .env.local à créer

**IMPORTANT** : Le fichier `.env.local` ne peut pas être créé automatiquement car il est dans `.gitignore` (c'est normal - il ne doit pas être partagé).

## Créer le fichier manuellement

1. **Ouvrez un éditeur de texte** (Notepad, VS Code, etc.)

2. **Créez un nouveau fichier** dans le dossier `web/`

3. **Nommez-le exactement** : `.env.local` (avec le point au début)

4. **Copiez-collez ce contenu** :

```bash
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=8XEOaFMsjus77re8OAz5zeB1AqZtpOjnage8O9H7rtg=

# Stripe Configuration (à ajouter plus tard quand vous créez un compte Stripe)
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

5. **Sauvegardez le fichier** dans `web/.env.local`

## Secret généré

Le secret NextAuth a été généré : `8XEOaFMsjus77re8OAz5zeB1AqZtpOjnage8O9H7rtg=`

C'est une clé technique pour sécuriser les sessions NextAuth, pas un mot de passe utilisateur.

## Vérification

Après avoir créé le fichier, vérifiez qu'il existe :

- **Windows Explorer** : Aller dans `web/` et activer "Afficher les fichiers cachés"
- **VS Code** : Le fichier devrait apparaître dans l'explorateur de fichiers

## Note

- Ce secret est **UNIQUE** et **PRIVÉ** - ne le partagez jamais
- Si vous perdez ce fichier, générez un nouveau secret
- Ce secret n'est pas un mot de passe utilisateur - c'est pour NextAuth uniquement

