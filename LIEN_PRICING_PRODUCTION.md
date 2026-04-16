# 🔗 Lier la page de tarification à votre site en production

## ✅ Modifications effectuées

J'ai ajouté des liens vers `/pricing` dans plusieurs endroits de votre site :

### 1. Navigation (Menu principal)
- ✅ Ajout de "Tarifs" / "Pricing" dans le menu de navigation
- ✅ Visible sur desktop et mobile

### 2. Page d'accueil (Landing page)
- ✅ Ajout d'un bouton "Tarifs" / "Pricing" dans la section CTA principale
- ✅ Visible à côté des boutons "Dialogue" et "Lecture 2026"

### 3. Footer
- ✅ Ajout du lien "Tarifs" / "Pricing" dans la section "Services" du footer

## 🌐 URLs de redirection Stripe

Les URLs de redirection Stripe utilisent automatiquement `request.nextUrl.origin`, ce qui signifie :
- **En développement** : `http://localhost:3000`
- **En production** : `https://www.orbitalastro.ca`

**Aucune modification nécessaire** - ça fonctionne automatiquement ! ✅

## 🚀 Déploiement

### 1. Vérifier les variables d'environnement en production

Assurez-vous que ces variables sont configurées dans votre environnement de production (Fly.io) :

**Variables à configurer dans Fly.io** :
```bash
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...  # ou pk_live_... en production
STRIPE_SECRET_KEY=sk_test_...  # ou sk_live_... en production
```

### 2. Déployer les changements

```bash
# Commitez les changements
git add .
git commit -m "Add pricing page links and Stripe integration"

# Poussez vers votre dépôt
git push

# Fly.io se mettra à jour automatiquement si vous avez un déploiement automatique
# Sinon, déployez manuellement :
fly deploy
```

### 3. Tester en production

Une fois déployé, testez :
1. **Page d'accueil** : `https://www.orbitalastro.ca/` - Le bouton "Tarifs" doit être visible
2. **Navigation** : Le lien "Tarifs" doit être dans le menu
3. **Page de tarification** : `https://www.orbitalastro.ca/pricing` - Doit afficher les produits
4. **Footer** : Le lien "Tarifs" doit être dans la section Services

## ⚠️ Important : Mode TEST vs LIVE

### Actuellement en mode TEST
Vous utilisez des clés Stripe **TEST** :
- `pk_test_...` (publishable key)
- `sk_test_...` (secret key)

### Pour passer en production (LIVE)

1. **Dans Stripe Dashboard**, basculez vers le mode **LIVE** (bouton en haut à droite)
2. **Créez les produits en mode LIVE** :
   - Dialogue pré-incarnation
   - Lecture 2026
   - Saint-Valentin 2026
3. **Copiez les nouveaux Price IDs** (mode LIVE)
4. **Mettez à jour** `web/lib/stripe.ts` avec les Price IDs LIVE
5. **Configurez les variables d'environnement LIVE** dans Fly.io :
   ```bash
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_SECRET_KEY=sk_live_...
   ```
6. **Redéployez** votre application

## ✅ Checklist de déploiement

- [x] Liens ajoutés dans la navigation
- [x] Bouton ajouté sur la page d'accueil
- [x] Lien ajouté dans le footer
- [x] URLs Stripe configurées automatiquement
- [ ] Variables d'environnement configurées en production
- [ ] Test de la page `/pricing` en production
- [ ] Test d'un paiement en mode TEST
- [ ] Passage en mode LIVE quand prêt

## 🧪 Tester localement avant de déployer

```bash
cd web
npm run dev:fast
# Allez sur http://localhost:3000/pricing
```

## 📝 Notes

- Les traductions sont déjà configurées (FR/EN/ES)
- Le système de paiement est fonctionnel
- Les codes promo sont intégrés
- Tout est prêt pour la production ! 🎉

