import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getSupabaseAdmin } from '@/lib/supabase'
import { fetchJournalAstroContext } from '@/lib/journal-astro-context'
import { buildJournalGuildSystemInstruction } from '@/lib/journal-guild-prompt'
import {
  loadJournalChatMemory,
  mergeJournalMemoryAfterTurn,
  shouldRunJournalLightMemoryMerge,
} from '@/lib/journal-chat-memory'

export const runtime = 'nodejs'

const MAX_HISTORY_MESSAGES = 72
const MAX_ARCHIVED_THREADS = 30

function isMissingArchivedColumnError(message?: string): boolean {
  const text = String(message || '').toLowerCase()
  return text.includes('is_archived') && (text.includes('column') || text.includes('schema cache'))
}

function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  let activeThread: { id: string } | null = null
  let threadError: { message: string } | null = null
  let archivedColumnSupported = true

  {
    const result = await supabase
      .from('journal_chat_threads')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('is_archived', false)
      .order('updated_at', { ascending: false })
      .maybeSingle()
    activeThread = result.data
    threadError = result.error
    if (threadError && isMissingArchivedColumnError(threadError.message)) {
      archivedColumnSupported = false
      const fallback = await supabase
        .from('journal_chat_threads')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle()
      activeThread = fallback.data
      threadError = fallback.error
    }
  }

  if (threadError) {
    return NextResponse.json({ error: threadError.message }, { status: 500 })
  }

  let archivedThreads: Array<{
    id: string
    created_at: string
    updated_at: string
    archived_at: string | null
    archive_title?: string | null
  }> = []
  let archivedErr: { message: string } | null = null

  if (archivedColumnSupported) {
    const archivedRes = await supabase
      .from('journal_chat_threads')
      .select('id, created_at, updated_at, archived_at, archive_title')
      .eq('user_id', session.user.id)
      .eq('is_archived', true)
      .order('archived_at', { ascending: false })
      .limit(MAX_ARCHIVED_THREADS)
    archivedThreads = archivedRes.data || []
    archivedErr = archivedRes.error
  }

  if (archivedErr) {
    return NextResponse.json({ error: archivedErr.message }, { status: 500 })
  }

  if (!activeThread?.id) {
    return NextResponse.json({ threadId: null, messages: [], archivedThreads: archivedThreads || [] })
  }

  const { data: messages, error: msgError } = await supabase
    .from('journal_chat_messages')
    .select('id, role, content, created_at')
    .eq('thread_id', activeThread.id)
    .order('created_at', { ascending: true })
    .limit(500)

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 })
  }

  return NextResponse.json({
    threadId: activeThread.id,
    messages: messages || [],
    archivedThreads: archivedThreads || [],
  })
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
    let existingThread: { id: string } | null = null
    let findErr: { message: string } | null = null
    let archivedColumnSupported = true

    {
      const result = await supabase
        .from('journal_chat_threads')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .order('updated_at', { ascending: false })
        .maybeSingle()
      existingThread = result.data
      findErr = result.error
      if (findErr && isMissingArchivedColumnError(findErr.message)) {
        archivedColumnSupported = false
        const fallback = await supabase
          .from('journal_chat_threads')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle()
        existingThread = fallback.data
        findErr = fallback.error
      }
    }

    if (findErr) {
      return NextResponse.json({ error: findErr.message }, { status: 500 })
    }

    if (existingThread?.id) {
      threadId = existingThread.id
    } else {
      const insertPayload = archivedColumnSupported
        ? { user_id: user.id, is_archived: false }
        : { user_id: user.id }
      const { data: created, error: insErr } = await supabase
        .from('journal_chat_threads')
        .insert(insertPayload)
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

    let longTermMemory = ''
    try {
      longTermMemory = await loadJournalChatMemory(supabase, user.id)
    } catch {
      longTermMemory = ''
    }

    const journalDate = new Date().toLocaleDateString('fr-CA')
    const systemInstruction = buildJournalGuildSystemInstruction({
      displayName: user.display_name || 'Client',
      natalSummary: astro.natalSummary,
      astroTimingBlock: astro.astroTimingBlock,
      journalDate,
      longTermMemory,
    })

    const prompt = `Son dernier message dans le fil :
"""${text}"""

Considère tout l'historique déjà fourni dans la conversation (tours précédents) : enchaîne naturellement, fais des liens si utiles, et si tu repères un schéma récurrent, nomme-le avec douceur.

Si la personne demande le **quand**, un **pic**, l’**énergie** ou le **timing** : cite d’abord les **dates/heures** des passages listés (y compris sous « Prochains passages à l’orbe minimale ») quand elles sont dans le bloc, plus la **date-heure de référence**, les **phases** (exact / approche / séparation), **signes**, **maisons** et **noms de planètes** dans les lignes d’aspects. Inclus du **concret** (dates, phases) tiré du bloc — **sans** recopier d’**orbes en degrés** dans le texte. Ne te limite pas aux métaphores.

Si le bloc contient **« PHÉNOMÈNES LUNAIRES »** (pleine lune / nouvelle lune calculée) : la **première** ligne **Astrologie :** donne **immédiatement** la date/heure de la lunaison indiquée sur la première puce, puis une phrase d’interprétation utile ; pas d’évitement ni de réponse uniquement métaphorique.

**Volume attendu (important)** : ne force **pas** la personne à écrire « dis-moi en plus » ou « peux-tu développer ». Dès **ce** message, livre une réponse **généreuse** : assez de matière pour qu’elle ait une vision d’ensemble. Concrètement : **12 à 22 interventions** (ligne d’étiquette + mini-paragraphe), chaque planète avec l’étiquette **(Natal: signe, maison n + Transit: signe, maison n)** quand les données le permettent (voir consigne système), puis **plusieurs phrases** de corps. Inclure **au moins trois** planètes / points distincts après la première Astrologie, plus une **dernière** ligne Astrologie de synthèse.

Si le dernier message de la personne est une vague relance (« encore », « un peu plus », etc.) : **approfondis sans répéter** les formulations du tour précédent ; apporte **nouveauté** (autres corps du bloc, conséquences sur 2–4 semaines, ce qu’il vaut mieux éviter ou favoriser).

Les planètes parlent en **je** et **tutoyent** — **sans** « je, [nom de la planète] », **sans** « je suis ta Lune / ton Soleil » ni équivalent : l’étiquette du rôle suffit. Pas d'introduction du type « voici mon interprétation ».`

    const apiBase = getApiBaseUrl()
    const aiResponse = await fetch(`${apiBase}/ai/interpret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        system_instruction: systemInstruction,
        temperature: 0.72,
        max_output_tokens: 6144,
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

    const { count: assistantCount, error: assistantCountErr } = await supabase
      .from('journal_chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('thread_id', threadId)
      .eq('role', 'assistant')

    const ac = assistantCountErr ? 1 : assistantCount ?? 1
    if (shouldRunJournalLightMemoryMerge(ac)) {
      void mergeJournalMemoryAfterTurn({
        supabase,
        apiBase,
        userId: user.id,
        priorSummary: longTermMemory,
        userMessage: text,
        assistantMessage: replyText,
      }).catch(() => {})
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
