# Envoi automatique des PDFs par courriel (Fly)

Cette fonctionnalité envoie automatiquement un PDF par courriel après génération :
- Dialogue pré‑incarnation
- Lecture 2026

## 1) Créer un fournisseur email (Resend)

1. Crée un compte sur Resend
2. Récupère ta clé API `RESEND_API_KEY`
3. Choisis un expéditeur `RESEND_FROM` (ex: `OrbitalAstro <noreply@orbitalastro.ca>`)
   - Recommandé: vérifier le domaine dans Resend pour une meilleure délivrabilité.

## 2) Configurer les secrets Fly (app web)

Depuis le dossier `web/` ou la racine :

```powershell
flyctl secrets set -a orbitalastro-web RESEND_API_KEY="..." RESEND_FROM="OrbitalAstro <noreply@orbitalastro.ca>"
```

Optionnel (si tu veux verrouiller encore plus l'endpoint) :

```powershell
flyctl secrets set -a orbitalastro-web ALLOWED_EMAIL_ORIGINS="https://www.orbitalastro.ca,https://orbitalastro.ca"
```

## 3) Vérifier

- Lance une génération (Dialogue ou Lecture 2026) avec un courriel valide : le PDF doit être envoyé automatiquement.
- En cas d’échec, regarde les logs Fly :

```powershell
flyctl logs -a orbitalastro-web
```

## Notes sécurité

L’endpoint `POST /api/email-pdf` est public (comme le site).
Il est protégé par :
- un contrôle d’`Origin` (si l’en-tête est présent)
- un rate‑limit simple (10 requêtes/heure/IP)

Pour une vente “prod”, ajoute idéalement une authentification (compte utilisateur) ou un mécanisme anti‑abus (captcha / token serveur).

