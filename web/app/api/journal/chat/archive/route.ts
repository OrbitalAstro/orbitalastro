import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getSupabaseAdmin } from '@/lib/supabase'
import {
  formatJournalTranscriptForMemory,
  loadJournalChatMemory,
  mergeJournalMemoryFromTranscript,
} from '@/lib/journal-chat-memory'

export const runtime = 'nodejs'

function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')
}

function isMissingArchivedColumnError(message?: string): boolean {
  const text = String(message || '').toLowerCase()
  return text.includes('is_archived') && (text.includes('column') || text.includes('schema cache'))
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()

  let archivedColumnSupported = true
  let activeThread: { id: string } | null = null
  let activeErr: { message: string } | null = null

  {
    const result = await supabase
      .from('journal_chat_threads')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .maybeSingle()
    activeThread = result.data
    activeErr = result.error

    if (activeErr && isMissingArchivedColumnError(activeErr.message)) {
      archivedColumnSupported = false
      const fallback = await supabase
        .from('journal_chat_threads')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle()
      activeThread = fallback.data
      activeErr = fallback.error
    }
  }

  if (activeErr) {
    return NextResponse.json({ error: activeErr.message }, { status: 500 })
  }

  if (!activeThread?.id) {
    return NextResponse.json({ error: 'Aucune conversation active à archiver.' }, { status: 400 })
  }

  const { data: currentMessages, error: messagesErr } = await supabase
    .from('journal_chat_messages')
    .select('id, role, content, created_at')
    .eq('thread_id', activeThread.id)
    .order('created_at', { ascending: true })
    .limit(500)

  if (messagesErr) {
    return NextResponse.json({ error: messagesErr.message }, { status: 500 })
  }

  const snapshotMessages = currentMessages || []

  const { count, error: countErr } = await supabase
    .from('journal_chat_messages')
    .select('*', { count: 'exact', head: true })
    .eq('thread_id', activeThread.id)

  if (countErr) {
    return NextResponse.json({ error: countErr.message }, { status: 500 })
  }

  if (!count || count <= 0) {
    return NextResponse.json({ error: 'Le fil est vide, rien à archiver.' }, { status: 400 })
  }

  const apiBase = getApiBaseUrl()
  let priorMemory = ''
  try {
    priorMemory = await loadJournalChatMemory(supabase, session.user.id)
  } catch {
    priorMemory = ''
  }
  const transcript = formatJournalTranscriptForMemory(
    snapshotMessages.map((m) => ({ role: m.role, content: m.content })),
  )
  void mergeJournalMemoryFromTranscript({
    supabase,
    apiBase,
    userId: session.user.id,
    priorSummary: priorMemory,
    transcript,
  }).catch(() => {})

  // Fallback legacy (sans colonnes d'archivage en DB) :
  // on vide le fil actuel et on renvoie un snapshot pour historique local UI.
  if (!archivedColumnSupported) {
    const { error: clearErr } = await supabase
      .from('journal_chat_messages')
      .delete()
      .eq('thread_id', activeThread.id)

    if (clearErr) {
      return NextResponse.json({ error: clearErr.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      threadId: activeThread.id,
      archivedThreadId: activeThread.id,
      localArchiveOnly: true,
      archivedSnapshot: {
        id: `local-${activeThread.id}-${Date.now()}`,
        created_at: snapshotMessages[0]?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
        archived_at: new Date().toISOString(),
        messages: snapshotMessages,
      },
    })
  }

  const nowIso = new Date().toISOString()
  const { error: archiveErr } = await supabase
    .from('journal_chat_threads')
    .update({ is_archived: true, archived_at: nowIso, updated_at: nowIso })
    .eq('id', activeThread.id)

  if (archiveErr) {
    return NextResponse.json({ error: archiveErr.message }, { status: 500 })
  }

  const { data: newThread, error: createErr } = await supabase
    .from('journal_chat_threads')
    .insert({ user_id: session.user.id, is_archived: false })
    .select('id')
    .single()

  if (createErr || !newThread?.id) {
    return NextResponse.json({ error: createErr?.message || 'Impossible de créer un nouveau fil.' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    archivedThreadId: activeThread.id,
    threadId: newThread.id,
    localArchiveOnly: false,
  })
}
