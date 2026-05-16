-- Abonnement mensuel Journal pilote (product_id: journal-monthly)
-- Exécuter dans Supabase SQL Editor après schema.sql (payments, user_access).

CREATE OR REPLACE FUNCTION create_user_access_on_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'paid' THEN
    INSERT INTO user_access (customer_email, product_id, payment_id, expires_at)
    VALUES (
      NEW.customer_email,
      NEW.product_id,
      NEW.id,
      CASE
        WHEN NEW.product_id IN ('monthly', 'journal-monthly') THEN NOW() + INTERVAL '1 month'
        ELSE NULL
      END
    )
    ON CONFLICT (customer_email, product_id)
    DO UPDATE SET
      payment_id = NEW.id,
      expires_at = CASE
        WHEN NEW.product_id IN ('monthly', 'journal-monthly') THEN NOW() + INTERVAL '1 month'
        ELSE NULL
      END,
      created_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
