# Ajouter vos clés Stripe - Instructions

## 🔑 Étape 1 : Ajouter la clé Publishable (Frontend)

**Fichier** : `web/.env.local`

**Ajoutez cette ligne** (ou modifiez si elle existe déjà) :

```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_VOTRE_CLE_ICI
```

**Remplacez** `pk_test_VOTRE_CLE_ICI` par votre vraie clé publishable (commence par `pk_test_...`)

## 🔐 Étape 2 : Ajouter la clé Secrète (Backend)

**Fichier** : `.env` (à la racine du projet, pas dans `web/`)

**Ajoutez cette ligne** (ou modifiez si elle existe déjà) :

```bash
STRIPE_SECRET_KEY=sk_test_VOTRE_CLE_ICI
```

**Remplacez** `sk_test_VOTRE_CLE_ICI` par votre vraie clé secrète (commence par `sk_test_...`)

## ⚠️ Important

- **Ne partagez JAMAIS** votre clé secrète (`sk_test_...`)
- **Ne commitez JAMAIS** ces fichiers dans Git (ils sont dans `.gitignore`)
- Utilisez les clés **TEST** (`pk_test_` / `sk_test_`) pour commencer

## ✅ Vérification

Après avoir ajouté les clés, redémarrez le serveur :

```powershell
Ctrl+C  # Arrêter
npm run dev:fast  # Redémarrer
```

## 🎯 Prochaine étape

Une fois les clés ajoutées, vous devrez :
1. Créer les 3 produits dans Stripe Dashboard
2. Copier les Price IDs
3. Mettre à jour `web/lib/stripe.ts` avec les Price IDs

