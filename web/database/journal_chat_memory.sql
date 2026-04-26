-- Mémoire longue durée du journal (résumé agrégé par compte, style « mémoire » persistante).
-- Exécuter une fois dans Supabase SQL Editor (après auth_users et le reste du schéma journal).

CREATE TABLE IF NOT EXISTS journal_chat_memory (
  user_id UUID PRIMARY KEY REFERENCES auth_users(id) ON DELETE CASCADE,
  summary TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_chat_memory_updated
  ON journal_chat_memory(updated_at DESC);
