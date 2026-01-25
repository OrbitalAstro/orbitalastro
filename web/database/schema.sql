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

