-- Fil de clavardage journal (historique multi-tours + mémoire côté modèle)
-- Exécuter une fois dans Supabase SQL Editor (en plus de journal_pilot_schema.sql).

CREATE TABLE IF NOT EXISTS journal_chat_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth_users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS journal_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES journal_chat_threads(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_journal_chat_messages_thread_created
  ON journal_chat_messages(thread_id, created_at ASC);

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
