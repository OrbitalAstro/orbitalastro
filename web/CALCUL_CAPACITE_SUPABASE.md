# 📊 Calcul de capacité Supabase - 500 MB

## 💾 Équivalent de 500 MB en données

### Structure de vos tables

#### Table `subscribers` (emails + préférences)
- **Taille moyenne par enregistrement** : ~200 bytes
  - `id` (UUID) : 16 bytes
  - `email` : ~30 bytes (moyenne)
  - `first_name` : ~15 bytes (optionnel)
  - `language` : 2 bytes
  - `subscribed_to_newsletter` : 1 byte
  - `subscribed_to_product_updates` : 1 byte
  - `subscribed_to_promotions` : 1 byte
  - `source` : ~10 bytes
  - `stripe_customer_id` : ~20 bytes (optionnel)
  - `created_at`, `updated_at`, `last_email_sent_at`, `unsubscribed_at` : 32 bytes
  - `email_verified` : 1 byte
  - **Overhead PostgreSQL** : ~80 bytes (index, métadonnées)

**500 MB = 500,000,000 bytes**

**Capacité en subscribers** :
- 500,000,000 bytes ÷ 200 bytes = **~2,500,000 abonnés** (2.5 millions)

#### Table `payments` (paiements)
- **Taille moyenne par enregistrement** : ~150 bytes
  - `id` (UUID) : 16 bytes
  - `stripe_session_id` : ~30 bytes
  - `stripe_customer_id` : ~20 bytes
  - `customer_email` : ~30 bytes
  - `product_id` : ~15 bytes
  - `amount_paid` : 8 bytes (DECIMAL)
  - `currency` : 3 bytes
  - `status` : ~10 bytes
  - `created_at`, `updated_at` : 16 bytes
  - **Overhead** : ~50 bytes

**Capacité en payments** :
- 500,000,000 bytes ÷ 150 bytes = **~3,333,333 paiements** (3.3 millions)

#### Table `generations` (historique générations)
- **Taille moyenne par enregistrement** : ~250 bytes
  - `id` (UUID) : 16 bytes
  - `customer_email` : ~30 bytes
  - `product_id` : ~15 bytes
  - `stripe_session_id` : ~30 bytes
  - `payment_id` (UUID) : 16 bytes
  - `generated_at` : 8 bytes
  - `content_preview` : ~100 bytes (200 caractères max)
  - `metadata` (JSONB) : ~50 bytes
  - **Overhead** : ~50 bytes

**Capacité en generations** :
- 500,000,000 bytes ÷ 250 bytes = **~2,000,000 générations** (2 millions)

#### Table `user_access` (accès utilisateurs)
- **Taille moyenne par enregistrement** : ~120 bytes
  - `id` (UUID) : 16 bytes
  - `customer_email` : ~30 bytes
  - `product_id` : ~15 bytes
  - `payment_id` (UUID) : 16 bytes
  - `expires_at` : 8 bytes
  - `created_at` : 8 bytes
  - **Overhead** : ~30 bytes

**Capacité en user_access** :
- 500,000,000 bytes ÷ 120 bytes = **~4,166,666 accès** (4.2 millions)

### 📈 Estimation réaliste (toutes tables combinées)

En supposant une répartition typique :
- **50%** pour `subscribers` (250 MB) = **~1,250,000 abonnés**
- **20%** pour `payments` (100 MB) = **~666,666 paiements**
- **20%** pour `generations` (100 MB) = **~400,000 générations**
- **10%** pour `user_access` + overhead (50 MB) = **~416,666 accès**

### 🎯 Scénarios réels

#### Scénario 1 : Petite entreprise (début)
- **1,000 clients** avec 3 produits chacun
- **3,000 paiements**
- **3,000 générations**
- **3,000 accès**
- **Taille estimée** : ~1 MB
- **Durée avant 500 MB** : **Très longue** (années)

#### Scénario 2 : Entreprise moyenne
- **10,000 clients** avec 2 produits chacun
- **20,000 paiements**
- **20,000 générations**
- **20,000 accès**
- **Taille estimée** : ~10 MB
- **Durée avant 500 MB** : **Très longue** (décennies)

#### Scénario 3 : Grande entreprise
- **100,000 clients** avec 2 produits chacun
- **200,000 paiements**
- **200,000 générations**
- **200,000 accès**
- **Taille estimée** : ~100 MB
- **Durée avant 500 MB** : **Longue** (plusieurs années)

## 💰 Tarifs Supabase (2024)

### Plan Gratuit (Free)
- **500 MB** de stockage base de données ✅ **GRATUIT**
- 2 GB de bande passante
- 50,000 requêtes API/mois
- 500 MB de stockage fichiers

### Plan Pro ($25/mois)
- **8 GB** de stockage base de données inclus
- Stockage supplémentaire : **$0.125 par GB/mois** (après 8 GB)
- 50 GB de bande passante
- 5 millions de requêtes API/mois
- 100 GB de stockage fichiers

### Plan Team ($599/mois)
- **100 GB** de stockage base de données inclus
- Stockage supplémentaire : **$0.125 par GB/mois** (après 100 GB)
- 250 GB de bande passante
- 50 millions de requêtes API/mois
- 1 TB de stockage fichiers

## 💵 Coût après 500 MB

### Option 1 : Rester sur le plan gratuit
- **Limite** : 500 MB maximum
- **Coût** : **$0/mois**
- **Action** : Nettoyer les anciennes données ou archiver

### Option 2 : Passer au plan Pro
- **Coût** : **$25/mois** (inclut 8 GB)
- **Stockage supplémentaire** : $0.125/GB/mois
- **Exemple** : Si vous utilisez 10 GB total
  - 8 GB inclus dans le plan
  - 2 GB supplémentaires = 2 × $0.125 = **$0.25/mois**
  - **Total** : $25 + $0.25 = **$25.25/mois**

### Option 3 : Plan Team (pour très grande échelle)
- **Coût** : **$599/mois** (inclut 100 GB)
- **Stockage supplémentaire** : $0.125/GB/mois

## 📊 Tableau récapitulatif

| Plan | Coût/mois | Stockage inclus | Coût/GB supplémentaire | Idéal pour |
|------|-----------|-----------------|------------------------|------------|
| **Free** | **$0** | 500 MB | N/A | Début, test |
| **Pro** | **$25** | 8 GB | $0.125 | Entreprise moyenne |
| **Team** | **$599** | 100 GB | $0.125 | Grande entreprise |

## 🎯 Recommandation

**Pour OrbitalAstro** :
1. **Commencer avec le plan gratuit** (500 MB)
   - Suffisant pour **des dizaines de milliers de clients**
   - Aucun coût pendant longtemps

2. **Quand vous approchez 500 MB** :
   - Passer au plan Pro ($25/mois)
   - Vous aurez 8 GB (16× plus que le gratuit)
   - Suffisant pour **des centaines de milliers de clients**

3. **Optimisation** :
   - Archiver les anciennes générations (> 1 an)
   - Nettoyer les emails désabonnés après 2 ans
   - Compresser les métadonnées JSONB

## 📝 Conclusion

**500 MB = environ 1 à 2.5 millions d'enregistrements** selon le type de données.

**Pour votre cas d'usage** (emails, paiements, générations) :
- **500 MB = ~1,250,000 abonnés + leurs paiements + générations**
- **C'est énorme !** Vous ne dépasserez probablement jamais 500 MB avant d'avoir des dizaines de milliers de clients payants.

**Coût après 500 MB** : **$25/mois** pour 8 GB (plan Pro)

