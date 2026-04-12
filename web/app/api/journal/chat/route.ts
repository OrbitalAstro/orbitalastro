import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getSupabaseAdmin } from '@/lib/supabase'
import { fetchJournalAstroContext } from '@/lib/journal-astro-context'
import { buildJournalGuildSystemInstruction } from '@/lib/journal-guild-prompt'

export const runtime = 'nodejs'

const MAX_HISTORY_MESSAGES = 72

function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const { data: thread, error: threadError } = await supabase
    .from('journal_chat_threads')
    .select('id')
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (threadError) {
    return NextResponse.json({ error: threadError.message }, { status: 500 })
  }

  if (!thread?.id) {
    return NextResponse.json({ threadId: null, messages: [] })
  }

  const { data: messages, error: msgError } = await supabase
    .from('journal_chat_messages')
    .select('id, role, content, created_at')
    .eq('thread_id', thread.id)
    .order('created_at', { ascending: true })
    .limit(500)

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 })
  }

  return NextResponse.json({ threadId: thread.id, messages: messages || [] })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { message } = await request.json()
    const text = String(message || '').trim()
    if (!text) {
      return NextResponse.json({ error: 'Message vide.' }, { status: 400 })
    }
    if (text.length > 4000) {
      return NextResponse.json({ error: 'Message trop long (max 4000 caractères).' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data: user, error: userError } = await supabase
      .from('auth_users')
      .select('id, display_name, birth_date, birth_time, birth_place, latitude, longitude, timezone')
      .eq('id', session.user.id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: userError?.message || 'Profil utilisateur introuvable.' }, { status: 500 })
    }

    if (!user.birth_date || !user.birth_time || !user.birth_place || user.latitude == null || user.longitude == null) {
      return NextResponse.json(
        { error: 'Profil natal incomplet.', code: 'PROFILE_INCOMPLETE' },
        { status: 400 }
      )
    }

    let threadId: string
    const { data: existingThread, error: findErr } = await supabase
      .from('journal_chat_threads')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (findErr) {
      return NextResponse.json({ error: findErr.message }, { status: 500 })
    }

    if (existingThread?.id) {
      threadId = existingThread.id
    } else {
      const { data: created, error: insErr } = await supabase
        .from('journal_chat_threads')
        .insert({ user_id: user.id })
        .select('id')
        .single()
      if (insErr) {
        return NextResponse.json({ error: insErr.message }, { status: 500 })
      }
      threadId = created!.id
    }

    const { data: priorRows, error: priorErr } = await supabase
      .from('journal_chat_messages')
      .select('role, content')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: false })
      .limit(MAX_HISTORY_MESSAGES)

    if (priorErr) {
      return NextResponse.json({ error: priorErr.message }, { status: 500 })
    }

    const prior = [...(priorRows || [])].reverse()
    const conversation_turns = prior.map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      text: m.content,
    }))

    const { data: userRow, error: insertUserErr } = await supabase
      .from('journal_chat_messages')
      .insert({ thread_id: threadId, role: 'user', content: text })
      .select('id, role, content, created_at')
      .single()

    if (insertUserErr || !userRow) {
      return NextResponse.json({ error: insertUserErr?.message || 'Sauvegarde impossible.' }, { status: 500 })
    }

    let astro
    try {
      astro = await fetchJournalAstroContext(
        {
          birth_date: user.birth_date,
          birth_time: user.birth_time,
          birth_place: user.birth_place,
          latitude: user.latitude,
          longitude: user.longitude,
          timezone: user.timezone,
        },
        { userMessage: text, nextExactPolicy: 'always' },
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur astro'
      return NextResponse.json({ error: msg }, { status: 502 })
    }

    const journalDate = new Date().toLocaleDateString('fr-CA')
    const systemInstruction = buildJournalGuildSystemInstruction({
      displayName: user.display_name || 'Client',
      natalSummary: astro.natalSummary,
      astroTimingBlock: astro.astroTimingBlock,
      journalDate,
    })

    const prompt = `Son dernier message dans le fil :
"""${text}"""

Considère tout l'historique déjà fourni dans la conversation (tours précédents) : enchaîne naturellement, fais des liens si utiles, et si tu repères un schéma récurrent, nomme-le avec douceur.

Si la personne demande le **quand**, un **pic**, l’**énergie** ou le **timing** : cite d’abord les **dates/heures des « Prochains passages à l’orbe minimale »** quand elles sont dans le bloc, plus la **date-heure de référence**, les **phases** (exact / approche / séparation), **signes** et **noms de planètes** dans les lignes d’aspects. Tu **dois** inclure du concret chiffré tiré du bloc quand il y en a — ne te limite pas aux métaphores.

Réponds en 6 à 14 lignes au format « Rôle : … », style clavardage. Les planètes parlent en **je** et **tutoyent** la personne. Pas d'introduction du type « voici mon interprétation ».`

    const apiBase = getApiBaseUrl()
    const aiResponse = await fetch(`${apiBase}/ai/interpret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        system_instruction: systemInstruction,
        temperature: 0.68,
        max_output_tokens: 4096,
        conversation_turns,
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      await supabase.from('journal_chat_messages').delete().eq('id', userRow.id)
      return NextResponse.json({ error: `Erreur IA: ${errText}` }, { status: 502 })
    }

    const aiData = await aiResponse.json()
    const replyText = String(aiData?.content || '').trim()
    if (!replyText) {
      await supabase.from('journal_chat_messages').delete().eq('id', userRow.id)
      return NextResponse.json({ error: 'Réponse IA vide.' }, { status: 502 })
    }

    const { data: assistantRow, error: asstErr } = await supabase
      .from('journal_chat_messages')
      .insert({
        thread_id: threadId,
        role: 'assistant',
        content: replyText,
        metadata: {
          natal_summary: astro.natalSummary,
          transit_summary: astro.majorTransits,
          target_date: astro.targetDate,
        },
      })
      .select('id, role, content, created_at')
      .single()

    if (asstErr || !assistantRow) {
      return NextResponse.json({ error: asstErr?.message || 'Sauvegarde réponse impossible.' }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      messages: [userRow, assistantRow],
    })
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
