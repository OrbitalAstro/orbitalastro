import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { getSupabaseAdmin } from '@/lib/supabase'
import { fetchJournalAstroContext } from '@/lib/journal-astro-context'
import { buildJournalGuildSystemInstruction } from '@/lib/journal-guild-prompt'
import { loadJournalChatMemory, mergeJournalMemoryAfterTurn } from '@/lib/journal-chat-memory'

export const runtime = 'nodejs'

const GENEROUS_MIN_CHARS = 2400
const GENEROUS_MIN_WORDS = 420

function countWords(input: string): number {
  return input
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function isTooShortGenerousReply(input: string): boolean {
  return input.length < GENEROUS_MIN_CHARS || countWords(input) < GENEROUS_MIN_WORDS
}

function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { entry } = await request.json()
    const entryText = String(entry || '').trim()
    if (!entryText) {
      return NextResponse.json({ error: 'Entrée vide.' }, { status: 400 })
    }
    if (entryText.length > 4000) {
      return NextResponse.json({ error: 'Entrée trop longue (max 4000 caractères).' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data: user, error: userError } = await supabase
      .from('auth_users')
      .select('id, email, display_name, birth_date, birth_time, birth_place, latitude, longitude, timezone')
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
        { userMessage: entryText, nextExactPolicy: 'always' },
      )
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur astro'
      return NextResponse.json({ error: msg }, { status: 502 })
    }

    const { natalSummary, majorTransits, targetDate, astroTimingBlock } = astro

    let longTermMemory = ''
    try {
      longTermMemory = await loadJournalChatMemory(supabase, user.id)
    } catch {
      longTermMemory = ''
    }

    const journalDate = new Date().toLocaleDateString('fr-CA')
    const systemInstruction = buildJournalGuildSystemInstruction({
      displayName: user.display_name || 'Client',
      natalSummary,
      astroTimingBlock,
      journalDate,
      longTermMemory,
    })

    const prompt = `Message du journal :
"""${entryText}"""

Écris une réponse GÉNÉREUSE, profonde, structurée et actionnable en français.

Contraintes obligatoires :
- Longueur cible : 700 à 1200 mots.
- 6 sections avec titres explicites, dans cet ordre :
  1) Lecture principale
  2) Dynamiques en tension (au moins 2 forces)
  3) Timeline (maintenant, 3 mois, 12 mois)
  4) Impacts concrets (travail, visibilité, argent)
  5) Plan d'action 7 jours (5 actions réalistes)
  6) Questions de journal (3 questions personnalisées)
- Ton : chaleureux, précis, humain, jamais fataliste.
- Chaque section doit contenir au moins un élément concret et utile.
- Si la personne demande un "quand", un "pic", l'énergie ou le timing : cite d'abord les dates/heures disponibles dans le bloc astrologique, puis interprète.
- Termine par une phrase de continuité ("si tu veux, je peux...").

Interdit :
- Réponse courte de type résumé.
- Vagues généralités sans application concrète.`

    const apiBase = getApiBaseUrl()
    const aiResponse = await fetch(`${apiBase}/ai/interpret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        system_instruction: systemInstruction,
        temperature: 0.68,
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      return NextResponse.json({ error: `Erreur IA: ${errText}` }, { status: 502 })
    }

    const aiData = await aiResponse.json()
    let replyText = String(aiData?.content || '').trim()
    if (!replyText) {
      return NextResponse.json({ error: 'Réponse IA vide.' }, { status: 502 })
    }

    // Si le modèle reste trop bref, on force une seconde passe d'enrichissement.
    if (isTooShortGenerousReply(replyText)) {
      const enrichPrompt = `Enrichis la réponse ci-dessous pour atteindre un niveau "généreux" :

--- Réponse actuelle ---
${replyText}
--- Fin ---

Réécris complètement avec :
- 700 à 1200 mots,
- les 6 sections obligatoires dans l'ordre,
- plus de concret, nuances et actions.

Garde les mêmes données astrologiques, n'invente aucun transit ni date absente du bloc.`

      const enrichResponse = await fetch(`${apiBase}/ai/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: enrichPrompt,
          system_instruction: systemInstruction,
          temperature: 0.7,
          max_output_tokens: 4096,
        }),
      })

      if (enrichResponse.ok) {
        const enrichData = await enrichResponse.json()
        const enrichedText = String(enrichData?.content || '').trim()
        if (enrichedText) {
          replyText = enrichedText
        }
      }
    }

    const { data: savedEntry, error: saveError } = await supabase
      .from('journal_entries')
      .insert({
        user_id: user.id,
        entry_text: entryText,
        reply_text: replyText,
        metadata: {
          natal_summary: natalSummary,
          transit_summary: majorTransits,
          target_date: targetDate,
        },
      })
      .select('id, entry_text, reply_text, metadata, created_at')
      .single()

    if (saveError) {
      return NextResponse.json({ error: saveError.message }, { status: 500 })
    }

    void mergeJournalMemoryAfterTurn({
      supabase,
      apiBase,
      userId: user.id,
      priorSummary: longTermMemory,
      userMessage: entryText,
      assistantMessage: replyText,
    }).catch(() => {})

    return NextResponse.json({ ok: true, entry: savedEntry })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
