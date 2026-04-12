-- Cache des résultats « prochains passages à orbe minimale » (même thème natal + mêmes paramètres = même clé).
-- Réduit les appels au moteur Python et la latence ; réutilisable entre comptes au thème identique.
-- Exécuter une fois dans Supabase SQL Editor (service role côté app uniquement).

CREATE TABLE IF NOT EXISTS journal_next_exact_cache (
  cache_key TEXT PRIMARY KEY,
  result_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_next_exact_cache_created
  ON journal_next_exact_cache (created_at DESC);

COMMENT ON TABLE journal_next_exact_cache IS
  'Résultats déterministes next-exact-times ; clé = hash(natal fingerprint + hints + fenêtre).';
