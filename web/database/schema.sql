-- Schéma de base de données pour OrbitalAstro
-- À exécuter dans Supabase SQL Editor

-- Table des paiements
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT,
  customer_email TEXT NOT NULL,
  product_id TEXT NOT NULL, -- 'dialogue', 'reading-2026', 'valentine-2026', 'monthly'
  amount_paid DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'cad',
  status TEXT NOT NULL, -- 'paid', 'pending', 'failed', 'refunded'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour recherche rapide par email et produit
CREATE INDEX IF NOT EXISTS idx_payments_email ON payments(customer_email);
CREATE INDEX IF NOT EXISTS idx_payments_product ON payments(product_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON payments(stripe_session_id);

-- Table des accès utilisateurs (pour vérifier rapidement si un utilisateur a accès)
CREATE TABLE IF NOT EXISTS user_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  product_id TEXT NOT NULL, -- 'dialogue', 'reading-2026', 'valentine-2026', 'monthly'
  payment_id UUID REFERENCES payments(id) ON DELETE CASCADE,
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL = accès permanent (pour les achats uniques)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(customer_email, product_id)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_user_access_email ON user_access(customer_email);
CREATE INDEX IF NOT EXISTS idx_user_access_product ON user_access(product_id);
CREATE INDEX IF NOT EXISTS idx_user_access_expires ON user_access(expires_at);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer automatiquement un accès utilisateur après un paiement réussi
CREATE OR REPLACE FUNCTION create_user_access_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le paiement est réussi, créer un accès utilisateur
  IF NEW.status = 'paid' THEN
    INSERT INTO user_access (customer_email, product_id, payment_id, expires_at)
    VALUES (
      NEW.customer_email,
      NEW.product_id,
      NEW.id,
      CASE 
        -- Pour les abonnements mensuels, expirer dans 1 mois
        WHEN NEW.product_id = 'monthly' THEN NOW() + INTERVAL '1 month'
        -- Pour les achats uniques, pas d'expiration (NULL)
        ELSE NULL
      END
    )
    ON CONFLICT (customer_email, product_id) 
    DO UPDATE SET 
      payment_id = NEW.id,
      expires_at = CASE 
        WHEN NEW.product_id = 'monthly' THEN NOW() + INTERVAL '1 month'
        ELSE NULL
      END,
      created_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour créer l'accès automatiquement
CREATE TRIGGER create_access_on_payment AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW 
  WHEN (NEW.status = 'paid')
  EXECUTE FUNCTION create_user_access_on_payment();

-- Vue pour vérifier rapidement les accès actifs
CREATE OR REPLACE VIEW active_access AS
SELECT 
  ua.customer_email,
  ua.product_id,
  ua.payment_id,
  ua.expires_at,
  ua.created_at,
  p.amount_paid,
  p.currency,
  p.stripe_session_id
FROM user_access ua
JOIN payments p ON ua.payment_id = p.id
WHERE 
  (ua.expires_at IS NULL OR ua.expires_at > NOW())
  AND p.status = 'paid';

-- Table des emails et préférences pour newsletters
CREATE TABLE IF NOT EXISTS subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  language TEXT DEFAULT 'fr', -- 'fr', 'en', 'es'
  subscribed_to_newsletter BOOLEAN DEFAULT true,
  subscribed_to_product_updates BOOLEAN DEFAULT true,
  subscribed_to_promotions BOOLEAN DEFAULT true,
  source TEXT, -- 'checkout', 'contact', 'manual'
  stripe_customer_id TEXT, -- Lien avec Stripe si disponible
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_email_sent_at TIMESTAMP WITH TIME ZONE,
  email_verified BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMP WITH TIME ZONE
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_newsletter ON subscribers(subscribed_to_newsletter) WHERE subscribed_to_newsletter = true;
CREATE INDEX IF NOT EXISTS idx_subscribers_stripe_customer ON subscribers(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Table pour tracker les générations (pour limiter les quantités)
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_email TEXT NOT NULL,
  product_id TEXT NOT NULL, -- 'dialogue', 'reading-2026', 'valentine-2026'
  stripe_session_id TEXT,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  content_preview TEXT, -- Premiers 200 caractères pour référence
  metadata JSONB -- Stocker des infos supplémentaires (firstName, etc.)
);

-- Index pour recherche rapide
CREATE INDEX IF NOT EXISTS idx_generations_email_product ON generations(customer_email, product_id);
CREATE INDEX IF NOT EXISTS idx_generations_session ON generations(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_generations_created ON generations(generated_at);

-- Trigger pour mettre à jour updated_at sur subscribers
CREATE TRIGGER update_subscribers_updated_at BEFORE UPDATE ON subscribers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour créer/mettre à jour un subscriber après un paiement
CREATE OR REPLACE FUNCTION upsert_subscriber_from_payment()
RETURNS TRIGGER AS $$
BEGIN
  -- Si le paiement est réussi, créer/mettre à jour le subscriber
  IF NEW.status = 'paid' AND NEW.customer_email IS NOT NULL THEN
    INSERT INTO subscribers (
      email,
      first_name,
      language,
      subscribed_to_newsletter,
      subscribed_to_product_updates,
      source,
      stripe_customer_id
    )
    VALUES (
      NEW.customer_email,
      NULL, -- Peut être rempli plus tard
      'fr', -- Par défaut
      true, -- Abonné par défaut aux newsletters
      true, -- Abonné par défaut aux mises à jour produits
      'checkout',
      NEW.stripe_customer_id
    )
    ON CONFLICT (email) 
    DO UPDATE SET 
      stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, subscribers.stripe_customer_id),
      updated_at = NOW(),
      -- Ne pas désabonner si déjà abonné
      subscribed_to_newsletter = COALESCE(subscribers.subscribed_to_newsletter, true),
      subscribed_to_product_updates = COALESCE(subscribers.subscribed_to_product_updates, true),
      unsubscribed_at = NULL; -- Réabonner si désabonné précédemment
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour créer/mettre à jour subscriber après paiement
CREATE TRIGGER upsert_subscriber_on_payment AFTER INSERT OR UPDATE ON payments
  FOR EACH ROW 
  WHEN (NEW.status = 'paid' AND NEW.customer_email IS NOT NULL)
  EXECUTE FUNCTION upsert_subscriber_from_payment();

