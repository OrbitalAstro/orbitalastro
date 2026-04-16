# 📧 Architecture Emails et Newsletters - OrbitalAstro

## 🏗️ Architecture complète

```
┌─────────────────────────────────────────────────┐
│  STRIPE                                         │
│  ✓ Facturation                                  │
│  ✓ Reçus automatiques                           │
│  ✓ Stockage emails clients (Customer objects)   │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  WEBHOOK STRIPE                                 │
│  → Enregistre paiement dans Supabase            │
│  → Crée automatiquement le subscriber            │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  SUPABASE (PostgreSQL)                          │
│  ✓ Table: payments                               │
│  ✓ Table: subscribers (emails + préférences)     │
│  ✓ Table: generations (historique)               │
│  ✓ Triggers automatiques                        │
└─────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────┐
│  RESEND                                         │
│  ✓ Emails transactionnels (PDFs)                 │
│  ✓ Emails marketing (newsletters)               │
│  ✓ API simple et fiable                         │
└─────────────────────────────────────────────────┘
```

## 📊 Tables de base de données

### Table `subscribers`
Stocke tous les emails et préférences pour newsletters :
- `email` (unique) : Email de l'abonné
- `first_name` : Prénom (optionnel)
- `language` : Langue préférée ('fr', 'en', 'es')
- `subscribed_to_newsletter` : Abonné aux newsletters
- `subscribed_to_product_updates` : Abonné aux mises à jour produits
- `subscribed_to_promotions` : Abonné aux promotions
- `source` : Origine ('checkout', 'contact', 'manual')
- `stripe_customer_id` : Lien avec Stripe
- `last_email_sent_at` : Dernier email envoyé
- `unsubscribed_at` : Date de désabonnement (NULL = abonné)

### Table `generations`
Historique des générations pour tracking :
- `customer_email` : Email du client
- `product_id` : Type de produit généré
- `stripe_session_id` : Session Stripe associée
- `payment_id` : Référence au paiement
- `generated_at` : Date de génération
- `metadata` : Infos supplémentaires (JSON)

## 🔄 Flux automatiques

### 1. Après un paiement Stripe
```
Paiement réussi → Webhook Stripe
  → Enregistre dans `payments`
  → Trigger crée `user_access`
  → Trigger crée/mettre à jour `subscribers`
```

### 2. Après génération de contenu
```
Génération réussie → /api/stripe/record-generation
  → Met à jour metadata Stripe (generationsUsed)
  → Enregistre dans `generations`
```

### 3. Après envoi de PDF
```
PDF envoyé → /api/email-pdf
  → Envoie email via Resend
  → Met à jour `subscribers.last_email_sent_at`
```

## 📧 APIs disponibles

### `/api/subscribers/save`
Sauvegarder un email manuellement
```json
POST {
  "email": "client@example.com",
  "firstName": "Jean",
  "language": "fr",
  "source": "manual",
  "stripeCustomerId": "cus_xxx" // optionnel
}
```

### `/api/subscribers/list`
Lister les abonnés (avec filtres)
```
GET ?newsletter=true&language=fr&product_updates=true
```

### `/api/newsletter/send`
Envoyer une newsletter à tous les abonnés
```json
POST {
  "subject": "Nouvelle fonctionnalité !",
  "text": "Contenu texte de l'email",
  "html": "<p>Contenu HTML</p>", // optionnel
  "language": "fr", // optionnel : filtrer par langue
  "newsletterOnly": true, // optionnel
  "productUpdatesOnly": false // optionnel
}
```

## 🚀 Configuration

### Variables d'environnement requises

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... # SECRET

# Resend
RESEND_API_KEY=re_xxxxx
RESEND_FROM=OrbitalAstro <noreply@orbitalastro.ca>

# Stripe (déjà configuré)
STRIPE_SECRET_KEY=sk_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Installation Supabase

1. Créer un compte sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Exécuter le schéma SQL (`web/database/schema.sql`) dans SQL Editor
4. Récupérer les clés API dans Settings → API

## 📝 Utilisation

### Envoyer une newsletter

```typescript
// Exemple : Envoyer à tous les abonnés français
const response = await fetch('/api/newsletter/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    subject: 'Nouvelle fonctionnalité disponible !',
    text: 'Découvrez notre nouveau produit...',
    language: 'fr',
    newsletterOnly: true,
  }),
})
```

### Lister les abonnés

```typescript
// Tous les abonnés aux newsletters
const response = await fetch('/api/subscribers/list?newsletter=true')
const { subscribers, count } = await response.json()
```

## ✅ Avantages de cette architecture

1. **Stripe** : Gère facturation + reçus automatiques
2. **Resend** : Gère emails transactionnels + marketing (un seul service)
3. **Supabase** : Base de données PostgreSQL gratuite (500 MB)
4. **Automatisation** : Triggers créent automatiquement les subscribers
5. **Flexibilité** : Segmentation par langue, type d'abonnement, etc.

## 🔒 Sécurité

- ⚠️ `SUPABASE_SERVICE_ROLE_KEY` : SECRET, jamais exposé au frontend
- ⚠️ `RESEND_API_KEY` : SECRET, jamais exposé au frontend
- ✅ Toutes les opérations DB passent par les API routes
- ✅ Rate limiting sur les APIs d'envoi d'emails

