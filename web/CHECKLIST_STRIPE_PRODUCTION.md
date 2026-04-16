# Checklist - Passage Stripe en Production

## ✅ À faire maintenant

### 1. Dans Stripe Dashboard (Live mode)

- [ ] Activer le mode Live (toggle en haut à droite)
- [ ] Récupérer `pk_live_...` (Publishable key)
- [ ] Récupérer `sk_live_...` (Secret key)
- [ ] Créer le produit "Dialogue pré-incarnation" (9.99 CAD) → Noter le Price ID
- [ ] Créer le produit "Lecture 2026" (9.99 CAD) → Noter le Price ID
- [ ] Créer le produit "Saint-Valentin 2026" (14.00 CAD) → Noter le Price ID
- [ ] Configurer le webhook : `https://www.orbitalastro.ca/api/webhooks/stripe`
- [ ] Récupérer le Webhook Secret (`whsec_...`)

### 2. Dans le code

- [ ] Mettre à jour les Price IDs dans `web/lib/stripe.ts`

### 3. Dans Fly.io

- [ ] Mettre à jour `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` avec `pk_live_...`
- [ ] Mettre à jour `STRIPE_SECRET_KEY` avec `sk_live_...`
- [ ] Ajouter `STRIPE_WEBHOOK_SECRET` avec `whsec_...`

### 4. Déploiement

- [ ] Commit et push des changements
- [ ] Redéployer sur Fly.io

---

## 📝 Notes

**Price IDs actuels (TEST - à remplacer) :**
- Dialogue : `price_1Sr8qkJOod2H9eSE8QV72G4p`
- Lecture 2026 : `price_1Sr8sKJOod2H9eSERiPO6965`
- Saint-Valentin : `price_1SrTNsJOod2H9eSEa2Nz1heK`

**Nouveaux Price IDs (LIVE - à ajouter) :**
- Dialogue : `price_...` (à remplir)
- Lecture 2026 : `price_...` (à remplir)
- Saint-Valentin : `price_...` (à remplir)
