import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(_request: NextRequest, context: { params: { threadId: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const threadId = context.params.threadId
  if (!threadId) {
    return NextResponse.json({ error: 'threadId manquant.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const { data: ownedThread, error: ownerErr } = await supabase
    .from('journal_chat_threads')
    .select('id')
    .eq('id', threadId)
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (ownerErr) {
    return NextResponse.json({ error: ownerErr.message }, { status: 500 })
  }

  if (!ownedThread?.id) {
    return NextResponse.json({ error: 'Conversation introuvable.' }, { status: 404 })
  }

  const { data: messages, error: msgErr } = await supabase
    .from('journal_chat_messages')
    .select('id, role, content, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })
    .limit(500)

  if (msgErr) {
    return NextResponse.json({ error: msgErr.message }, { status: 500 })
  }

  return NextResponse.json({ threadId, messages: messages || [] })
}
