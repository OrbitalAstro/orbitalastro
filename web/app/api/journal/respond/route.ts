import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { assertJournalSubscription } from '@/lib/journal-subscription'
import { getSupabaseAdmin } from '@/lib/supabase'
import { fetchJournalAstroContext } from '@/lib/journal-astro-context'
import { buildJournalGuildSystemInstruction } from '@/lib/journal-guild-prompt'
import {
  detectJournalResponseMode,
  journalResponseModeUserHint,
} from '@/lib/journal-response-mode'
import { sanitizeJournalGuildReply } from '@/lib/journal-guild-reply-sanitize'
import { loadJournalChatMemory, mergeJournalMemoryAfterTurn } from '@/lib/journal-chat-memory'

export const runtime = 'nodejs'

/** Seuil « trop court » : messagerie synthétique ; on n’exige plus un pavé type article. */
const GENEROUS_MIN_CHARS = 320
const GENEROUS_MIN_WORDS = 55

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
  const subBlock = await assertJournalSubscription(session)
  if (subBlock) return subBlock

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
    const hasLunarPhenomena = astroTimingBlock.includes('PHÉNOMÈNES LUNAIRES')
    const responseMode = detectJournalResponseMode(entryText, { hasLunarPhenomena })
    const modeHint = journalResponseModeUserHint(responseMode)

    const systemInstruction = buildJournalGuildSystemInstruction({
      displayName: user.display_name || 'Client',
      natalSummary,
      astroTimingBlock,
      journalDate,
      longTermMemory,
      responseMode,
    })

    const prompt = `Message du journal :
"""${entryText}"""

Réponds en **français**, au format de la consigne système : lignes **Astrologie :** et planètes / points avec **étiquette (Natal: … + Transit: …)** puis texte à la ligne — **pas** d’article en 6 sections, **pas** de titres de chapitres, **pas** de pavé de 700+ mots.

${modeHint}

Exigences :
- Respecte le **mode** indiqué (messagerie fragmentée vs exploratoire touffu vs ciblé).
- **Utile** : faits du bloc quand ils servent + interprétation + **une** piste concrète ou une **question** courte en fin — sans répéter la mémoire pour rien.
- Si **quand / pic / timing / énergie** : dates et phases du bloc en priorité, **sans orbes en degrés** dans la prose.
- Ton : chaleureux, précis, jamais fataliste.

Interdit :
- Réponse **vide** ou **fuyante** (que des métaphores sans lien au message ni au bloc).
- Liste de six planètes « par habitude ».`

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
    let replyText = sanitizeJournalGuildReply(String(aiData?.content || '').trim())
    if (!replyText) {
      return NextResponse.json({ error: 'Réponse IA vide.' }, { status: 502 })
    }

    const minChars = responseMode === 'exploratory' ? 520 : GENEROUS_MIN_CHARS
    const minWords = responseMode === 'exploratory' ? 90 : GENEROUS_MIN_WORDS
    const tooShort =
      replyText.length < minChars || countWords(replyText) < minWords

    // Si le modèle reste trop bref, on force une seconde passe d'enrichissement.
    if (tooShort) {
      const enrichPrompt = `La réponse ci-dessous est trop courte ou trop vague pour une entrée de journal. Réécris **au même format messagerie** (étiquettes Astrologie / planètes comme dans la consigne système).

--- Réponse actuelle ---
${replyText}
--- Fin ---

Objectif : **un peu plus de substance** sans devenir un roman :
- Garde **au plus 5 à 7 tours de parole** au total, **2 à 3 planètes** max si le bloc le justifie ;
- **2 à 3 phrases** pour la première **Astrologie :** si besoin de cadrage ou de dates ;
- chaque planète : **2 à 4 phrases** max ;
- une **dernière Astrologie :** d’**une phrase** pour relancer ou résumer.

Mêmes données astrologiques : n’invente aucun transit ni date absente du bloc. Pas de sections numérotées type article.`

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
          replyText = sanitizeJournalGuildReply(enrichedText)
        }
      }
    }

    replyText = sanitizeJournalGuildReply(replyText)

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
