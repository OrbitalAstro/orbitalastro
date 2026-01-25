# Checklist de test - Orbital Astro (Stripe + Auth)

Guide pour tester l'intégration Stripe et NextAuth avant le lancement.

## ⚙️ Configuration préalable

### 1. Variables d'environnement

**Créer/modifier `.env.local` dans `web/` :**

```bash
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=votre_secret_random_ici

# Stripe (clés test - pk_test_ et sk_test_)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**Générer NEXTAUTH_SECRET :**
```powershell
# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 2. Installer les dépendances

```powershell
cd web
npm install
```

### 3. Démarrer le serveur

```powershell
npm run dev
```

## 🧪 Tests à effectuer

### Test 1 : Authentification (NextAuth)

#### 1.1 Page de connexion

- [ ] Visiter `/auth/signin`
- [ ] Vérifier que la page s'affiche correctement
- [ ] Tester la connexion avec un email/password quelconque (mode test)
- [ ] Vérifier la redirection vers `/dashboard` après connexion

**Résultat attendu** : Connexion réussie, redirection vers dashboard

#### 1.2 Page d'inscription

- [ ] Visiter `/auth/signup`
- [ ] Vérifier que la page s'affiche correctement
- [ ] Tester l'inscription avec :
  - Nom valide
  - Email valide
  - Mot de passe (min 8 caractères)
  - Confirmation de mot de passe (même mot de passe)
- [ ] Vérifier la redirection après inscription

**Résultat attendu** : Inscription réussie, redirection vers dashboard

#### 1.3 Validation des formulaires

- [ ] Tester email invalide (doit montrer erreur)
- [ ] Tester mot de passe trop court (< 8 caractères)
- [ ] Tester confirmation de mot de passe différente

**Résultat attendu** : Erreurs affichées, formulaire non soumis

### Test 2 : Page Pricing (Stripe)

#### 2.1 Affichage de la page

- [ ] Visiter `/pricing`
- [ ] Vérifier que les 3 plans s'affichent :
  - Plan Gratuit
  - Plan Mensuel ($9.99/mois)
  - Plan Annuel ($99.99/an)
- [ ] Vérifier les caractéristiques de chaque plan

**Résultat attendu** : Page de pricing complète avec 3 plans

#### 2.2 Navigation

- [ ] Vérifier que le lien "Pricing" / "Tarifs" apparaît dans le menu
- [ ] Cliquer sur le lien, vérifier la redirection vers `/pricing`

**Résultat attendu** : Lien accessible depuis le menu

### Test 3 : Checkout Stripe (Sans vraies clés pour l'instant)

#### 3.1 Préparation Stripe

**Si vous avez déjà créé un compte Stripe :**

- [ ] Créer un compte Stripe : https://stripe.com
- [ ] Récupérer les clés API (test) : Dashboard → Developers → API keys
- [ ] Créer les produits dans Stripe :
  - Product "Orbital Astro - Mensuel" : $9.99 CAD / mois
  - Product "Orbital Astro - Annuel" : $99.99 CAD / an
- [ ] Copier les `price_xxx` IDs des produits
- [ ] Mettre à jour `web/lib/stripe.ts` avec les `stripePriceId`

**Si vous n'avez pas encore de compte Stripe :**

- [ ] Le bouton "S'abonner" affichera une erreur (normal)
- [ ] Continuez les autres tests

#### 3.2 Test du bouton Checkout

**Après configuration Stripe :**

- [ ] Cliquer sur "S'abonner" pour le plan mensuel
- [ ] Vérifier que la redirection vers Stripe Checkout fonctionne
- [ ] Utiliser une carte de test Stripe :
  - Numéro : `4242 4242 4242 4242`
  - Date : N'importe quelle date future (ex: 12/25)
  - CVC : N'importe quel 3 chiffres (ex: 123)
  - ZIP : N'importe quel code postal
- [ ] Compléter le paiement
- [ ] Vérifier la redirection vers `/pricing?success=true`

**Résultat attendu** : Redirection Stripe → Paiement test → Redirection succès

### Test 4 : Webhooks Stripe (Avancé)

**Pour tester les webhooks en local :**

- [ ] Installer Stripe CLI : https://stripe.com/docs/stripe-cli
- [ ] Se connecter : `stripe login`
- [ ] Écouter les webhooks : 
  ```bash
  stripe listen --forward-to http://localhost:3000/api/webhooks/stripe
  ```
- [ ] Compléter un paiement test
- [ ] Vérifier que les événements arrivent dans le terminal

**Résultat attendu** : Événements Stripe affichés dans le terminal

### Test 5 : Responsive / Mobile

- [ ] Tester sur mobile (ou DevTools → Mobile)
- [ ] Vérifier que la page pricing s'affiche bien
- [ ] Vérifier que les formulaires d'auth fonctionnent sur mobile
- [ ] Tester le menu mobile

**Résultat attendu** : Interface responsive, fonctionnelle sur mobile

### Test 6 : Traductions

- [ ] Changer la langue dans Settings
- [ ] Vérifier que "Pricing" / "Tarifs" / "Precios" s'affiche correctement
- [ ] Vérifier les traductions sur les pages d'auth

**Résultat attendu** : Toutes les traductions fonctionnent

## 🐛 Problèmes courants et solutions

### Problème 1 : "NEXTAUTH_SECRET is not set"

**Solution** : Ajouter `NEXTAUTH_SECRET` dans `.env.local`

### Problème 2 : "Stripe checkout error"

**Cause** : Clés Stripe manquantes ou `stripePriceId` non configuré

**Solution** :
- Vérifier que `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` est dans `.env.local`
- Vérifier que les `stripePriceId` sont remplis dans `web/lib/stripe.ts`
- Vérifier que `STRIPE_SECRET_KEY` est configuré (backend)

### Problème 3 : "SessionProvider not found"

**Cause** : `SessionProvider` retiré de `providers.tsx`

**Solution** : Remettre `SessionProvider` dans `web/app/providers.tsx`

### Problème 4 : "Module 'next-auth' not found"

**Cause** : Dépendances non installées

**Solution** :
```powershell
cd web
npm install
```

## ✅ Checklist finale

Avant de considérer les tests terminés :

- [ ] Toutes les pages s'affichent sans erreurs
- [ ] L'authentification fonctionne (connexion/inscription)
- [ ] La page pricing s'affiche correctement
- [ ] Le bouton "S'abonner" fonctionne (si Stripe configuré)
- [ ] Le menu de navigation contient "Pricing"
- [ ] Aucune erreur dans la console du navigateur
- [ ] Aucune erreur dans les logs du serveur

## 📝 Notes de test

**Mode test actuel** :
- ✅ Authentification : Mode test (accepte n'importe quel email/password)
- ⚠️ Base de données : Pas encore configurée (sessions JWT uniquement)
- ⚠️ Stripe : Nécessite configuration complète pour fonctionner

**Pour passer en production** :
1. Configurer Supabase (base de données)
2. Remplacer l'authentification test par vraie authentification
3. Configurer Stripe complètement (produits, webhooks)
4. Ajouter les pages légales (CGU, Privacy)
5. Tests de bout en bout

## 🆘 Besoin d'aide ?

Consultez :
- `NEXTAUTH_SETUP.md` - Configuration NextAuth
- `STRIPE_SETUP.md` - Configuration Stripe
- `AUTH_STRIPE_SETUP_SUMMARY.md` - Récapitulatif complet

