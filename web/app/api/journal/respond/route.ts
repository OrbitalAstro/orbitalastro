import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { assertJournalSubscription } from '@/lib/journal-subscription'
import { getSupabaseAdmin } from '@/lib/supabase'
import { fetchJournalAstroContext } from '@/lib/journal-astro-context'
import { buildJournalGuildSystemInstruction } from '@/lib/journal-guild-prompt'
import {
  detectJournalDialogueDepth,
  journalDialogueDepthSystemNote,
  journalDialogueUserHint,
} from '@/lib/journal-dialogue-style'
import {
  detectJournalResponseMode,
  journalResponseModeUserHint,
} from '@/lib/journal-response-mode'
import { journalGuildPlacementLabelsUserHint } from '@/lib/journal-guild-placement-labels'
import {
  journalGuildChorusUserHint,
  resolveJournalGuildVoiceBudget,
} from '@/lib/journal-guild-chorus'
import {
  JOURNAL_MAX_OUTPUT_TOKENS_DEFAULT,
  journalGuildBrevityUserHint,
} from '@/lib/journal-guild-brevity'
import {
  detectJournalWeekTransitHorizon,
  journalWeekTransitHorizonUserHint,
} from '@/lib/journal-transit-horizon'
import { sanitizeJournalGuildReply } from '@/lib/journal-guild-reply-sanitize'
import { loadJournalChatMemory, mergeJournalMemoryAfterTurn } from '@/lib/journal-chat-memory'

export const runtime = 'nodejs'

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
    const dialogueDepth = detectJournalDialogueDepth(entryText, [])
    const responseMode = detectJournalResponseMode(entryText, { hasLunarPhenomena })
    const weekTransitHorizon = detectJournalWeekTransitHorizon(entryText, astroTimingBlock)
    const voiceBudget = resolveJournalGuildVoiceBudget({
      concreteFollowUp: false,
      isAnotherVoiceFollowUp: false,
      isDeepenFollowUp: false,
      isTouchedReaction: false,
      responseMode,
    })
    const modeHint = `${journalDialogueDepthSystemNote(dialogueDepth)}\n\n${journalResponseModeUserHint(responseMode, dialogueDepth, voiceBudget)}`

    const systemInstruction = buildJournalGuildSystemInstruction({
      displayName: user.display_name || 'Client',
      natalSummary,
      astroTimingBlock,
      journalDate,
      longTermMemory,
      responseMode,
      dialogueDepth,
      weekTransitHorizon,
      voiceBudget,
    })

    const prompt = `Message du journal :
"""${entryText}"""

Réponds en **français**, en **dialogue fluide** : **Astrologie** pose la table ; chaque planète avec étiquette \`(Natal: … + Transit: …)\` puis **effets** en **je** — **pas** d’article en 6 sections ni pavé de 700+ mots.

${journalDialogueUserHint(dialogueDepth, voiceBudget)}

${journalGuildBrevityUserHint()}

${voiceBudget === 'chorus' ? journalGuildChorusUserHint() : ''}

${weekTransitHorizon ? journalWeekTransitHorizonUserHint() : ''}

${journalGuildPlacementLabelsUserHint()}

${modeHint}

Exigences :
- **Ancré** : parle d’abord de **ce qu’elle écrit** (situation, ressenti) ; l’astro **éclaire**, ne remplace pas son vécu.
- Respecte le **mode** indiqué (messagerie vs exploratoire vs ciblé).
- **Utile** : faits du bloc quand ils servent, intégrés au récit — **une** piste concrète ou relance douce en fin.
- Si **quand / pic / timing / énergie** : dates et phases du bloc en priorité, **sans orbes en degrés** dans la prose.
- Ton : chaleureux, précis, jamais fataliste.

Interdit :
- Réponse **vide** ou **fuyante** (que des métaphores sans lien au message ni au bloc).
- Pavé long ou six planètes « par habitude ».`

    const apiBase = getApiBaseUrl()
    const aiResponse = await fetch(`${apiBase}/ai/interpret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        system_instruction: systemInstruction,
        temperature: 0.68,
        max_output_tokens: JOURNAL_MAX_OUTPUT_TOKENS_DEFAULT,
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
