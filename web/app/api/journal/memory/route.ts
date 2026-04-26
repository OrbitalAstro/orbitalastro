import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getSupabaseAdmin } from '@/lib/supabase'
import {
  clearJournalChatMemory,
  loadJournalChatMemoryRow,
  saveJournalChatMemory,
} from '@/lib/journal-chat-memory'

export const runtime = 'nodejs'

const MAX_BODY_CHARS = 3600

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const row = await loadJournalChatMemoryRow(supabase, session.user.id)
    return NextResponse.json({
      summary: row.summary,
      updated_at: row.updated_at,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const summary = String(body?.summary ?? '').slice(0, MAX_BODY_CHARS)
    const supabase = getSupabaseAdmin()
    await saveJournalChatMemory(supabase, session.user.id, summary)
    const row = await loadJournalChatMemoryRow(supabase, session.user.id)
    return NextResponse.json({ ok: true, summary: row.summary, updated_at: row.updated_at })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

export async function DELETE() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    await clearJournalChatMemory(supabase, session.user.id)
    return NextResponse.json({ ok: true, summary: '', updated_at: new Date().toISOString() })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Erreur'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
