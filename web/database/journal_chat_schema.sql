-- Fil de clavardage journal (historique multi-tours + archivage)
-- Exécuter dans Supabase SQL Editor après journal_pilot_schema.sql (auth_users doit exister).
--
-- La table pilot d’origine n’a pas is_archived : on ne met PAS ces colonnes dans le
-- CREATE IF NOT EXISTS (sinon, si la table existe déjà, le CREATE est ignoré et les
-- index sur is_archived plantent avec ERROR 42703).

CREATE TABLE IF NOT EXISTS journal_chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS journal_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES journal_chat_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Toujours après création / détection de table existante : ajouter les colonnes d’archivage.
ALTER TABLE journal_chat_threads
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE journal_chat_threads
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'journal_chat_threads_user_id_key'
      AND conrelid = 'journal_chat_threads'::regclass
  ) THEN
    ALTER TABLE journal_chat_threads DROP CONSTRAINT journal_chat_threads_user_id_key;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'journal_chat_threads_user_id_is_archived_key'
      AND conrelid = 'journal_chat_threads'::regclass
  ) THEN
    ALTER TABLE journal_chat_threads DROP CONSTRAINT journal_chat_threads_user_id_is_archived_key;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_journal_chat_messages_thread_created
  ON journal_chat_messages(thread_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_journal_chat_threads_user_archived_updated
  ON journal_chat_threads(user_id, is_archived, updated_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uq_journal_chat_active_thread_per_user
  ON journal_chat_threads(user_id)
  WHERE is_archived = FALSE;

CREATE OR REPLACE FUNCTION update_journal_chat_threads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE journal_chat_threads SET updated_at = NOW() WHERE id = NEW.thread_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_journal_chat_messages_touch_thread ON journal_chat_messages;
CREATE TRIGGER trg_journal_chat_messages_touch_thread
AFTER INSERT ON journal_chat_messages
FOR EACH ROW EXECUTE FUNCTION update_journal_chat_threads_updated_at();
