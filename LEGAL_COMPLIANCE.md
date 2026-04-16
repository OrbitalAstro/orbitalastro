# Conformité légale - Orbital Astro

Ce document liste les aspects légaux à considérer pour rendre votre application payante de manière conforme au Canada et internationalement.

## ✅ Ce que Stripe gère automatiquement

Stripe est **conforme PCI-DSS Level 1** (norme de sécurité des cartes bancaires), ce qui signifie :
- ✅ **Conformité PCI-DSS** : Stripe gère la sécurité des données de cartes bancaires
- ✅ **Cryptage** : Toutes les données de paiement sont cryptées
- ✅ **Certificats SSL/TLS** : Stripe utilise HTTPS pour tous les paiements
- ✅ **Conformité internationale** : Stripe est conforme dans plus de 40 pays

**Vous n'avez pas besoin** de vous certifier PCI-DSS vous-même si vous utilisez Stripe Checkout ou Stripe Elements (recommandé).

## 📋 Ce que VOUS devez faire (obligations légales)

### 1. Conditions d'utilisation (Terms of Service / CGU)

**Obligatoire** : Créez une page `/terms` ou `/terms-of-service` avec :
- Description du service
- Règles d'utilisation
- Politique de remboursement
- Limitation de responsabilité
- Loi applicable (Québec/Canada)

**À inclure** :
- Service fourni (calculs astrologiques, non-médical, à des fins de divertissement)
- Restrictions d'usage
- Propriété intellectuelle
- Politique de remboursement (ex: remboursement dans les 14 jours)
- Droit de modification des termes
- Résiliation de compte

### 2. Politique de confidentialité (Privacy Policy)

**Obligatoire au Canada** (PIPEDA) et en Europe (RGPD) : Créez `/privacy` avec :
- Quelles données vous collectez
- Comment vous les utilisez
- Avec qui vous les partagez (Stripe, etc.)
- Droits des utilisateurs (accès, suppression, modification)
- Cookies utilisés
- Durée de conservation
- Contact pour questions

**Données à mentionner** :
- Données personnelles (nom, email, date de naissance)
- Données de paiement (gérées par Stripe, mentionnez-le)
- Cookies/sessions
- Données d'utilisation

### 3. Mentions légales

**Recommandé** : Créez `/legal` ou `/about` avec :
- Nom de l'entreprise
- Adresse (si applicable)
- Email de contact
- Numéro d'entreprise (si applicable)
- Informations de résolution de litiges

### 4. Avis de non-responsabilité (Disclaimers)

**Important pour l'astrologie** : Ajoutez des avertissements clairs :
- L'astrologie est à des fins de **divertissement/éducation** uniquement
- **Ne remplace pas** les conseils médicaux, légaux, financiers, professionnels
- Pas de garantie d'exactitude
- L'utilisateur est responsable de ses décisions

**Où l'afficher** :
- Page d'accueil (petit texte)
- Avant chaque génération de dialogue/lecture
- Dans les conditions d'utilisation

### 5. Politique de remboursement

**Obligatoire pour les ventes en ligne au Canada** : Définissez une politique claire :
- Période de remboursement (ex: 14-30 jours)
- Conditions (ex: non utilisé, etc.)
- Processus de demande
- Contact pour remboursements

**Stripe** peut gérer les remboursements automatiquement via leur Dashboard.

### 6. Conformité fiscale

**Important** :
- **TVA/TPS** au Canada : Vérifiez si vous devez collecter la TPS/TVH
  - Si revenus > 30 000 CAD/an → collecte TPS/TVH obligatoire
  - Stripe peut calculer automatiquement les taxes
- **TVA** en Europe : Si vous vendez dans l'UE, conformité TVA peut être requise
- **IRS aux USA** : Si vous vendez aux USA, Stripe gère généralement les taxes d'état

**Stripe Tax** peut automatiquement :
- Calculer les taxes selon la localisation
- Collecter la TVA/TPS/TVA
- Générer des rapports fiscaux

### 7. Conformité données (PIPEDA/RGPD)

**Canada (PIPEDA)** :
- Consentement explicite pour collecte de données
- Accès aux données personnelles
- Droit de suppression
- Notification en cas de fuite de données

**Europe (RGPD)** :
- Consentement explicite
- Droit à l'oubli
- Portabilité des données
- Droit d'opposition

**Actions à prendre** :
- Bouton "J'accepte les CGU et politique de confidentialité" lors de l'inscription
- Page pour demander l'accès/suppression des données
- Contact pour questions de confidentialité

## 🛡️ Recommandations pour Stripe

### Configuration recommandée

1. **Stripe Checkout** (recommandé pour conformité) :
   - Stripe gère la conformité PCI-DSS
   - Page de checkout sécurisée Stripe
   - Pas besoin de gérer les données de carte vous-même

2. **Stripe Tax** (optionnel mais recommandé) :
   - Calcul automatique des taxes
   - Conformité fiscale internationale
   - Rapports pour comptabilité

3. **Webhooks sécurisés** :
   - Vérifier les signatures des webhooks
   - HTTPS uniquement en production
   - Ne pas exposer les clés secrètes

### Mentions légales dans Stripe Checkout

Stripe permet d'ajouter des liens vers :
- Conditions d'utilisation
- Politique de confidentialité
- Mentions légales

**Configuration dans `checkout/route.ts`** :
```typescript
const session = await stripe.checkout.sessions.create({
  // ... autres paramètres
  consent_collection: {
    terms_of_service: 'required',
  },
  custom_text: {
    terms_of_service_acceptance: {
      message: 'En complétant votre achat, vous acceptez nos [Conditions d\'utilisation](https://www.orbitalastro.ca/terms) et notre [Politique de confidentialité](https://www.orbitalastro.ca/privacy).',
    },
  },
})
```

## 📝 Checklist de conformité

### Avant le lancement

- [ ] **Conditions d'utilisation** créées et accessibles (`/terms`)
- [ ] **Politique de confidentialité** créée et accessible (`/privacy`)
- [ ] **Avis de non-responsabilité** affiché clairement
- [ ] **Politique de remboursement** définie et affichée
- [ ] **Mentions légales** (nom, adresse, contact)
- [ ] **Consentement** lors de l'inscription (checkbox "J'accepte les CGU")
- [ ] **Contact** clair pour questions légales/privacy
- [ ] **Stripe Tax** configuré (si nécessaire)
- [ ] **Configuration Stripe** avec liens vers CGU/Privacy

### Conformité données (PIPEDA/RGPD)

- [ ] **Formulaire de demande d'accès** aux données personnelles
- [ ] **Processus de suppression** de compte/données
- [ ] **Cookies** : Politique et consentement si nécessaire
- [ ] **Encryption** : HTTPS partout (déjà géré par Stripe/Fly.io)

### Conformité fiscale

- [ ] **TVA/TPS** : Vérifier si collecte nécessaire (>30k CAD/an au Canada)
- [ ] **Stripe Tax** : Configurer si vente internationale
- [ ] **Comptabilité** : Préparer pour rapports fiscaux

## 🚨 Avertissements importants

1. **Astrologie = Divertissement** :
   - Toujours afficher que c'est pour divertissement uniquement
   - Ne pas faire de promesses médicales/légales/financières
   - Ajouter des avertissements clairs

2. **Données personnelles** :
   - Ne collectez que ce qui est nécessaire
   - Sécurisez toutes les données (HTTPS, encryption)
   - Permettez la suppression des données

3. **Paiements** :
   - Utilisez Stripe Checkout (plus sécurisé et conforme)
   - Ne stockez JAMAIS les numéros de carte vous-même
   - Validez tous les webhooks

## 📚 Ressources

- [Stripe Legal](https://stripe.com/docs/legal)
- [PIPEDA (Canada)](https://www.priv.gc.ca/en/privacy-topics/privacy-laws-in-canada/the-personal-information-protection-and-electronic-documents-act-pipeda/)
- [RGPD (Europe)](https://gdpr.eu/)
- [Revenu Canada - TPS/TVH](https://www.canada.ca/fr/agence-revenu/services/taxes/tps-tvh-entreprises.html)

## ⚖️ Note juridique

**Ce document n'est pas un avis juridique**. Consultez un avocat spécialisé en :
- Droit commercial canadien
- Conformité PIPEDA/RGPD
- Fiscalité (TPS/TVH)

Recommandation : **Consultez un avocat** avant le lancement en production pour valider :
- Vos conditions d'utilisation
- Votre politique de confidentialité
- Votre structure fiscale

## ✅ Prochaines étapes

1. **Créer les pages légales** :
   - `/terms` - Conditions d'utilisation
   - `/privacy` - Politique de confidentialité
   - `/legal` - Mentions légales

2. **Ajouter les avertissements** :
   - Avertissement "divertissement uniquement" avant génération
   - Lien vers CGU/Privacy dans le footer
   - Checkbox consentement lors de l'inscription

3. **Configurer Stripe** :
   - Activer Stripe Tax si nécessaire
   - Ajouter liens CGU/Privacy dans Checkout

4. **Tester** :
   - Vérifier que tous les liens fonctionnent
   - Tester le flux de consentement
   - Valider que les avertissements sont visibles

Voulez-vous que je crée les pages légales de base (`/terms`, `/privacy`) ?

