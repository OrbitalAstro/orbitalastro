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
import { journalAstrologieReadingUserHint } from '@/lib/journal-astrologie-reading'
import {
  isJournalConcreteFollowUp,
  detectJournalGuildConcreteFollowUpIssues,
  enforceJournalConcreteFollowUpReply,
  extractJournalConcreteTargetRole,
  journalFollowUpSystemBlock,
  journalFollowUpUserHint,
  journalThreadContinuityUserHint,
  threadHasStructuredAstroReading,
} from '@/lib/journal-follow-up'
import { journalGuildAerationUserHint } from '@/lib/journal-guild-aeration'
import { journalGuildPlacementLabelsUserHint } from '@/lib/journal-guild-placement-labels'
import {
  isJournalAnotherVoiceMessage,
  enforceJournalSingleVoiceReply,
  extractJournalAnotherVoiceRole,
  journalAnotherVoiceUserHint,
} from '@/lib/journal-another-voice'
import {
  detectJournalGuildChorusIssues,
  detectJournalGuildDeepenIssues,
  detectJournalGuildSingleVoiceIssues,
  journalGuildChorusUserHint,
  resolveJournalGuildVoiceBudget,
} from '@/lib/journal-guild-chorus'
import {
  enforceJournalDeepenReply,
  extractJournalDeepenTargetRole,
  isJournalDeepenMessage,
  journalDeepenUserHint,
} from '@/lib/journal-deepen'
import {
  detectJournalWeekTransitHorizon,
  journalWeekTransitHorizonUserHint,
} from '@/lib/journal-transit-horizon'
import { journalGuildBannedOpeningsUserHint } from '@/lib/journal-guild-banned-openings'
import { journalGuildProseUserHint } from '@/lib/journal-guild-prose'
import {
  detectJournalDialogueDepth,
  formatRecentUserTurnsForAnchoring,
  journalDialogueAnchoringFromThread,
  journalDialogueDepthSystemNote,
  journalDialogueUserHint,
} from '@/lib/journal-dialogue-style'
import { isJournalBubbleCommentMessage } from '@/lib/journal-bubble-comment'
import {
  isJournalTouchedReactionMessage,
  journalTouchedReactionUserHint,
} from '@/lib/journal-touched-reaction'
import {
  detectJournalGuildVoiceStyleIssues,
  sanitizeJournalGuildReply,
} from '@/lib/journal-guild-reply-sanitize'
import {
  loadJournalChatMemory,
  mergeJournalMemoryAfterTurn,
  shouldRunJournalLightMemoryMerge,
} from '@/lib/journal-chat-memory'

export const runtime = 'nodejs'
/** Évite les coupures côté Vercel/hosting pendant l’appel Python → Gemini (réponses guilde). */
export const maxDuration = 120

const MAX_HISTORY_MESSAGES = 72
const MAX_ARCHIVED_THREADS = 30

function isMissingArchivedColumnError(message?: string): boolean {
  const text = String(message || '').toLowerCase()
  return text.includes('is_archived') && (text.includes('column') || text.includes('schema cache'))
}

function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')
}

function normalizeForMatch(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

type GuardedElement = {
  label: string
  aliases: string[]
}

const GUARDED_ELEMENTS: GuardedElement[] = [
  { label: 'Soleil', aliases: ['soleil', 'sun'] },
  { label: 'Lune', aliases: ['lune', 'moon'] },
  { label: 'Mercure', aliases: ['mercure', 'mercury'] },
  { label: 'Vénus', aliases: ['venus', 'venuse'] },
  { label: 'Mars', aliases: ['mars'] },
  { label: 'Jupiter', aliases: ['jupiter'] },
  { label: 'Saturne', aliases: ['saturne', 'saturn'] },
  { label: 'Uranus', aliases: ['uranus'] },
  { label: 'Neptune', aliases: ['neptune'] },
  { label: 'Pluton', aliases: ['pluton', 'pluto'] },
  { label: 'Ascendant', aliases: ['ascendant', 'asc'] },
  { label: 'Descendant', aliases: ['descendant', 'dsc'] },
  { label: 'Milieu du Ciel', aliases: ['milieu du ciel', 'mc'] },
  { label: 'Imum Coeli', aliases: ['imum coeli', 'ic'] },
  { label: 'Nœud nord', aliases: ['nœud nord', 'noeud nord', 'nord node', 'north node'] },
  { label: 'Nœud sud', aliases: ['nœud sud', 'noeud sud', 'south node'] },
  { label: 'Chiron', aliases: ['chiron'] },
  { label: 'Lilith', aliases: ['lilith'] },
  { label: 'Cérès', aliases: ['ceres', 'cérès'] },
  { label: 'Pallas', aliases: ['pallas'] },
  { label: 'Junon', aliases: ['junon', 'juno'] },
  { label: 'Vesta', aliases: ['vesta'] },
  { label: 'Éris', aliases: ['eris', 'éris'] },
  { label: 'Vertex', aliases: ['vertex'] },
  { label: 'Part de Fortune', aliases: ['part de fortune'] },
]

function blockHasConcreteElementData(astroTimingBlock: string, element: GuardedElement): boolean {
  const n = normalizeForMatch(astroTimingBlock)
  const aliases = element.aliases.map((a) => normalizeForMatch(a))
  return aliases.some((a) => n.includes(`${a} natal :`) || n.includes(`- ${a} : ~`))
}

function replyMentionsElement(replyText: string, element: GuardedElement): boolean {
  const n = normalizeForMatch(replyText)
  return element.aliases.map((a) => normalizeForMatch(a)).some((a) => n.includes(a))
}

function replyHasElementPlacementLabel(replyText: string, element: GuardedElement): boolean {
  const rx = new RegExp(`${element.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\(Natal\\s*:`, 'i')
  return rx.test(replyText)
}

function replyClaimsMissingElementData(replyText: string, element: GuardedElement): boolean {
  const n = normalizeForMatch(replyText)
  const missingPattern =
    /(je n(?:e|'|’)ai(?:\s+malheureusement)?\s+pas|pas de|aucun(?:e)?|indisponible|non fourni(?:e)?).{0,120}(donnee|calcul|position|transit|signe|maison)/
  return replyMentionsElement(replyText, element) && missingPattern.test(n)
}

function buildElementConsistencyIssues(replyText: string, astroTimingBlock: string): string[] {
  const issues: string[] = []
  for (const element of GUARDED_ELEMENTS) {
    const hasBlockData = blockHasConcreteElementData(astroTimingBlock, element)
    const mentions = replyMentionsElement(replyText, element)
    if (!mentions) continue
    const hasPlacement = replyHasElementPlacementLabel(replyText, element)
    const claimsMissing = replyClaimsMissingElementData(replyText, element)

    if (hasBlockData && claimsMissing) {
      issues.push(`${element.label}: contradiction — tu dis manquer de données alors que le bloc en contient.`)
    }
    if (hasBlockData && !hasPlacement) {
      issues.push(`${element.label}: mention sans placement concret dans l’étiquette (Natal/Transit).`)
    }
    if (!hasBlockData && hasPlacement) {
      issues.push(`${element.label}: placement affirmé alors que le bloc n’en fournit pas.`)
    }
  }
  return issues
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const subBlock = await assertJournalSubscription(session)
  if (subBlock) return subBlock

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
  const subBlock = await assertJournalSubscription(session)
  if (subBlock) return subBlock

  try {
    const body = await request.json()
    const text = String(body?.message || '').trim()
    const nourishOnlyRequested = Boolean(body?.nourishOnly)
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

    const nourishOnly = nourishOnlyRequested && isJournalBubbleCommentMessage(text)
    if (nourishOnly) {
      await supabase
        .from('journal_chat_threads')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', threadId)

      let priorSummary = ''
      try {
        priorSummary = await loadJournalChatMemory(supabase, user.id)
      } catch {
        priorSummary = ''
      }

      const apiBase = getApiBaseUrl()
      void mergeJournalMemoryAfterTurn({
        supabase,
        apiBase,
        userId: user.id,
        priorSummary,
        userMessage: text,
        assistantMessage:
          '(Commentaire bulle enregistré — à intégrer dans les prochaines lectures, sans réponse guilde immédiate.)',
      }).catch(() => {})

      return NextResponse.json({
        ok: true,
        nourishOnly: true,
        messages: [userRow],
      })
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
      const raw = e instanceof Error ? e.message : 'Erreur astro'
      const msg =
        raw === 'fetch failed' || /failed to fetch/i.test(raw)
          ? 'API Python injoignable (démarre uvicorn sur le port 8000).'
          : raw
      return NextResponse.json({ error: msg }, { status: 502 })
    }

    let longTermMemory = ''
    try {
      longTermMemory = await loadJournalChatMemory(supabase, user.id)
    } catch {
      longTermMemory = ''
    }

    const journalDate = new Date().toLocaleDateString('fr-CA')
    const hasLunarPhenomena = astro.astroTimingBlock.includes('PHÉNOMÈNES LUNAIRES')
    const isTouchedReaction = isJournalTouchedReactionMessage(text)
    const concreteFollowUp = !isTouchedReaction && isJournalConcreteFollowUp(text)
    const isAnotherVoiceFollowUp =
      !isTouchedReaction && !concreteFollowUp && isJournalAnotherVoiceMessage(text)
    const isDeepenFollowUpEarly =
      !isTouchedReaction &&
      !concreteFollowUp &&
      !isAnotherVoiceFollowUp &&
      isJournalDeepenMessage(text)
    const dialogueDepth =
      isTouchedReaction || isDeepenFollowUpEarly || isAnotherVoiceFollowUp || concreteFollowUp
        ? 'light'
        : detectJournalDialogueDepth(text, prior)
    const isDeepenFollowUp = isDeepenFollowUpEarly && !concreteFollowUp
    const citedDeepenRole = isDeepenFollowUp ? extractJournalDeepenTargetRole(text) : null
    const citedAnotherVoiceRole = isAnotherVoiceFollowUp
      ? extractJournalAnotherVoiceRole(text)
      : null
    const citedConcreteRole = concreteFollowUp ? extractJournalConcreteTargetRole(text) : null
    const priorStructuredReading = threadHasStructuredAstroReading(prior)
    const responseMode = isTouchedReaction
      ? 'messaging'
      : detectJournalResponseMode(text, { hasLunarPhenomena, prior })
    const weekTransitHorizon =
      !isTouchedReaction &&
      !concreteFollowUp &&
      !isDeepenFollowUp &&
      !isAnotherVoiceFollowUp &&
      detectJournalWeekTransitHorizon(text, astro.astroTimingBlock)
    const voiceBudget = resolveJournalGuildVoiceBudget({
      concreteFollowUp,
      isAnotherVoiceFollowUp,
      isDeepenFollowUp,
      isTouchedReaction,
      responseMode,
    })
    const followUpBlock =
      concreteFollowUp
        ? journalFollowUpSystemBlock(citedConcreteRole)
        : priorStructuredReading && responseMode === 'targeted'
          ? journalFollowUpSystemBlock()
          : ''
    const modeHint = isTouchedReaction
      ? `${journalTouchedReactionUserHint()}\n\n${journalResponseModeUserHint(responseMode, dialogueDepth, voiceBudget)}`
      : isDeepenFollowUp
        ? journalDeepenUserHint(citedDeepenRole)
        : isAnotherVoiceFollowUp
          ? journalAnotherVoiceUserHint(citedAnotherVoiceRole)
          : concreteFollowUp
            ? journalFollowUpUserHint(citedConcreteRole)
            : `${journalDialogueDepthSystemNote(dialogueDepth)}\n\n${journalResponseModeUserHint(responseMode, dialogueDepth, voiceBudget)}`

    const systemInstruction = buildJournalGuildSystemInstruction({
      displayName: user.display_name || 'Client',
      natalSummary: astro.natalSummary,
      astroTimingBlock: astro.astroTimingBlock,
      journalDate,
      longTermMemory,
      responseMode,
      dialogueDepth,
      weekTransitHorizon,
      voiceBudget,
      citedDeepenRole,
      citedAnotherVoiceRole,
    })
    const systemWithFollowUp = followUpBlock
      ? `${systemInstruction}\n\n${followUpBlock}`
      : systemInstruction

    const recentUserAnchors = formatRecentUserTurnsForAnchoring(prior, {
      maxTurns: dialogueDepth === 'anchored' ? 5 : 4,
      maxCharsPerTurn: dialogueDepth === 'anchored' ? 700 : 480,
    })
    const threadAnchorBlock = journalDialogueAnchoringFromThread(recentUserAnchors, {
      deepenFollowUp: isDeepenFollowUp,
      singleVoiceFollowUp: isAnotherVoiceFollowUp,
    })

    const prompt = `Son dernier message dans le fil (texte central — à lire entièrement) :
"""${text}"""
${threadAnchorBlock}

Considère **tout** l’historique (tours précédents dans la conversation) : continuité, ton, ce qui a **changé** ou ce qui **revient**. Une bonne réponse **accroche** à ce qu’elle a vraiment dit — pas un texte générique.

**PROFIL PERSONNEL — ADAPTATION** : ton **doux, ancré, humain** si son profil/mémoire le demandent — comme un message qui **voit** où elle en est avant de conseiller.

${journalDialogueUserHint(dialogueDepth, voiceBudget)}

${voiceBudget === 'chorus' ? journalGuildChorusUserHint() : ''}
${isDeepenFollowUp ? `\n${journalDeepenUserHint(citedDeepenRole)}` : ''}
${isAnotherVoiceFollowUp ? `\n${journalAnotherVoiceUserHint(citedAnotherVoiceRole)}` : ''}

${weekTransitHorizon ? journalWeekTransitHorizonUserHint() : ''}

${journalAstrologieReadingUserHint({
      skipFullStructuredSections:
        priorStructuredReading || isDeepenFollowUp || isAnotherVoiceFollowUp || concreteFollowUp,
      concreteFollowUp,
      deepenFollowUp: isDeepenFollowUp,
      anotherVoiceFollowUp: isAnotherVoiceFollowUp,
    })}

${journalThreadContinuityUserHint(priorStructuredReading)}

${modeHint}

${journalGuildProseUserHint()}

${journalGuildBannedOpeningsUserHint()}

${journalGuildAerationUserHint()}

${journalGuildPlacementLabelsUserHint()}

Si des **commentaires bulle** [💬 commentaire bulle] apparaissent dans le fil : **intègre-les** dans la lecture (corrections, contexte, précisions) — ne les ignore pas.

**Mémoire du compte** (bloc système) : fils de vie, sensibilités, moments touchés — **tisse**-les dans **Astrologie** quand c’est pertinent ; ne les liste pas comme fiche.

Si **quand / pic / timing / énergie** : dates/phases du bloc **intégrées au récit** de sa journée — pas un paragraphe technique avant de parler d’elle.

Si **PHÉNOMÈNES LUNAIRES** : date/heure **dans** le récit (pas en ouverture sèche), sens du cycle pour **sa** situation.

Relance vague (« encore », « un peu plus ») : **nouveaux angles** ancrés dans le fil, pas copier le tour précédent.

**Interdit** : ouvrir par une liste d’aspects/placements ; réponse interchangeable ; positivité forcée ; planète **sans** étiquette \`(Natal: … + Transit: …)\` quand le bloc fournit les données ; ${voiceBudget === 'chorus' ? '**moins de 5 planètes** après Astrologie ; **plus de 7** planètes ; ' : voiceBudget === 'deepen' ? '**plus de 2 bulles** ; chœur ; Astrologie longue avant la planète citée ; ' : voiceBudget === 'single' ? '**plus d’1 planète** ; table Astrologie 1–2–3 ; chœur ; ' : voiceBudget === 'concrete' ? '**Astrologie + planète** en piste concrète ; plus d’1 bulle ; ' : ''}« je suis ta Lune… » ; markdown \`**gras**\` ou puces \`*\` dans les bulles.`

    const apiBase = getApiBaseUrl()
    const aiResponse = await fetch(`${apiBase}/ai/interpret`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        system_instruction: systemWithFollowUp,
        temperature: isTouchedReaction
          ? 0.58
          : isDeepenFollowUp || isAnotherVoiceFollowUp || concreteFollowUp
            ? 0.62
            : dialogueDepth === 'anchored'
              ? 0.82
              : 0.76,
        // Marge large : la longueur réelle est pilotée par le prompt (synthèse) ; un plafond trop bas
        // provoque des réponses coupées au milieu d’une phrase (MAX_TOKENS / budget sortie).
        max_output_tokens: isTouchedReaction ? 1024 : 8192,
        conversation_turns,
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      await supabase.from('journal_chat_messages').delete().eq('id', userRow.id)
      return NextResponse.json({ error: `Erreur IA: ${errText}` }, { status: 502 })
    }

    const aiData = await aiResponse.json()
    let replyText = String(aiData?.content || '').trim()
    if (!replyText) {
      await supabase.from('journal_chat_messages').delete().eq('id', userRow.id)
      return NextResponse.json({ error: 'Réponse IA vide.' }, { status: 502 })
    }

    replyText = sanitizeJournalGuildReply(replyText)
    if (isDeepenFollowUp) {
      replyText = enforceJournalDeepenReply(replyText, citedDeepenRole)
    }
    if (isAnotherVoiceFollowUp) {
      replyText = enforceJournalSingleVoiceReply(replyText, citedAnotherVoiceRole)
    }
    if (concreteFollowUp) {
      replyText = enforceJournalConcreteFollowUpReply(replyText, citedConcreteRole)
    }

    const styleIssues = detectJournalGuildVoiceStyleIssues(replyText)
    const elementIssues = buildElementConsistencyIssues(replyText, astro.astroTimingBlock)
    const chorusIssues = detectJournalGuildChorusIssues(replyText, voiceBudget)
    const deepenIssues = detectJournalGuildDeepenIssues(replyText, voiceBudget, citedDeepenRole)
    const singleVoiceIssues = detectJournalGuildSingleVoiceIssues(replyText, voiceBudget)
    const concreteIssues = detectJournalGuildConcreteFollowUpIssues(
      replyText,
      voiceBudget,
      citedConcreteRole,
    )
    const qualityIssues = [
      ...styleIssues,
      ...elementIssues,
      ...chorusIssues,
      ...deepenIssues,
      ...singleVoiceIssues,
      ...concreteIssues,
    ]

    if (!isTouchedReaction && qualityIssues.length > 0) {
      const correctionPrompt = `${prompt}

IMPORTANT — CORRECTION QUALITÉ :
Ta réponse précédente est invalide sur la cohérence des éléments astrologiques.
Points à corriger :
${qualityIssues.map((i) => `- ${i}`).join('\n')}

Réécris une version corrigée complète et cohérente. Règles strictes :
- **Jamais** « je suis ta Lune », « je suis ton Soleil », etc. — commence par le vécu : « Je ressens… », « Je t’invite… ».
- Chaque planète : \`Nom (Natal: signe, maison … + Transit: signe, maison …):\` ; effets dans le corps en **je**.
- Si le bloc ne contient pas de placement pour un point, n’invente pas et n’ouvre pas de voix dédiée pour ce point.
- N’écris aucune phrase contradictoire de type « pas de données » puis interprétation détaillée du même point.
- Retourne uniquement la réponse finale corrigée, au même format de conversation.`

      const corrected = await fetch(`${apiBase}/ai/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: correctionPrompt,
          system_instruction: systemWithFollowUp,
          temperature: 0.68,
          max_output_tokens: 8192,
          conversation_turns,
        }),
      })
      if (corrected.ok) {
        const correctedData = await corrected.json()
        const correctedText = String(correctedData?.content || '').trim()
        if (correctedText) replyText = correctedText
      }
    }

    replyText = sanitizeJournalGuildReply(replyText)
    if (isDeepenFollowUp) {
      replyText = enforceJournalDeepenReply(replyText, citedDeepenRole)
    }
    if (isAnotherVoiceFollowUp) {
      replyText = enforceJournalSingleVoiceReply(replyText, citedAnotherVoiceRole)
    }
    if (concreteFollowUp) {
      replyText = enforceJournalConcreteFollowUpReply(replyText, citedConcreteRole)
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
