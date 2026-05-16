-- Jetons de réinitialisation de mot de passe (NextAuth / auth_users maison)
-- Exécuter une fois dans Supabase SQL Editor après journal_pilot_schema.sql (table auth_users).

CREATE TABLE IF NOT EXISTS auth_password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT auth_password_reset_tokens_hash_unique UNIQUE (token_hash)
);

CREATE INDEX IF NOT EXISTS idx_auth_password_reset_user_id
  ON auth_password_reset_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_auth_password_reset_expires
  ON auth_password_reset_tokens(expires_at);
