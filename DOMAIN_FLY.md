# Domaine GoDaddy -> Fly.io (orbitalastro.ca)

Objectif :
- `www.orbitalastro.ca` -> Fly app `orbitalastro-web`
- `api.orbitalastro.ca` -> Fly app `orbitalastro-api`
- `orbitalastro.ca` -> redirection 301 vers `https://www.orbitalastro.ca` (recommandé)

## 1) Créer les certificats TLS (Fly)

Dans un terminal PowerShell, depuis la racine du repo :

```powershell
flyctl certs add www.orbitalastro.ca -a orbitalastro-web
flyctl certs add api.orbitalastro.ca -a orbitalastro-api
```

Fly affiche des enregistrements DNS du type `_acme-challenge...` : copiez-les dans GoDaddy (DNS).

## 2) DNS GoDaddy (Web + API)

Dans GoDaddy > DNS :

- Remplacer le `CNAME` existant `www -> orbitalastro.ca` par le `CNAME` donné par Fly.
  - Pour `www.orbitalastro.ca` (d'après `flyctl certs setup www.orbitalastro.ca -a orbitalastro-web`) :
    - `CNAME` **Host**: `www`
    - **Points to**: `kn3nnzx.orbitalastro-web.fly.dev`
- Créer :
  - Pour `api.orbitalastro.ca` (d'après `flyctl certs setup api.orbitalastro.ca -a orbitalastro-api`) :
    - `CNAME` **Host**: `api`
    - **Points to**: `qxwxxg1.orbitalastro-api.fly.dev`
- Optionnel (recommandé pour valider le TLS avant de basculer le trafic) :
  - `CNAME` **Host**: `_acme-challenge.www`
    - **Points to**: `www.orbitalastro.ca.kn3nnzx.flydns.net`
  - `CNAME` **Host**: `_acme-challenge.api`
    - **Points to**: `api.orbitalastro.ca.qxwxxg1.flydns.net`

## 3) Domaine racine (orbitalastro.ca)

Recommandé : activer GoDaddy "Forwarding" (301) vers `https://www.orbitalastro.ca`.

Actuellement, `orbitalastro.ca` pointe vers `76.76.21.21` (Vercel). Si vous migrez vers Fly, retirez/ajustez les enregistrements qui entrent en conflit selon l'interface GoDaddy.

## 4) Vérifier (DNS + certificats)

```powershell
Resolve-DnsName www.orbitalastro.ca
Resolve-DnsName api.orbitalastro.ca
flyctl certs show www.orbitalastro.ca -a orbitalastro-web
flyctl certs show api.orbitalastro.ca -a orbitalastro-api
```

Quand Fly indique "Verified", le HTTPS est prêt.

## 5) Web -> API (config)

Le frontend (Fly `orbitalastro-web`) appelle l'API via :
- `web/fly.toml` -> `NEXT_PUBLIC_API_URL = https://api.orbitalastro.ca`

Après la mise à jour DNS + certificats, redeploy le web (depuis `web/`) :

```powershell
cd web
flyctl deploy
```
