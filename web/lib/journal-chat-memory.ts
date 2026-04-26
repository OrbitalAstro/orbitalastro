import type { SupabaseClient } from '@supabase/supabase-js'

import { JOURNAL_MEMORY_LIGHT_EVERY_N } from '@/lib/journal-memory-constants'

export { JOURNAL_MEMORY_LIGHT_EVERY_N } from '@/lib/journal-memory-constants'

export function shouldRunJournalLightMemoryMerge(assistantMessageCount: number): boolean {
  const n = assistantMessageCount
  if (n <= 0) return false
  if (n === 1) return true
  return n % JOURNAL_MEMORY_LIGHT_EVERY_N === 0
}

const MAX_SUMMARY_CHARS = 3200

function isMissingMemoryTableError(message?: string): boolean {
  const t = String(message || '').toLowerCase()
  if (!t.includes('journal_chat_memory')) return false
  return (
    t.includes('schema cache') ||
    t.includes('does not exist') ||
    t.includes('relation') ||
    t.includes('introuvable')
  )
}

export async function loadJournalChatMemory(supabase: SupabaseClient, userId: string): Promise<string> {
  const { data, error } = await supabase
    .from('journal_chat_memory')
    .select('summary')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    if (isMissingMemoryTableError(error.message)) return ''
    throw new Error(error.message)
  }
  return String(data?.summary || '').trim()
}

export async function loadJournalChatMemoryRow(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ summary: string; updated_at: string | null }> {
  const { data, error } = await supabase
    .from('journal_chat_memory')
    .select('summary, updated_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    if (isMissingMemoryTableError(error.message)) return { summary: '', updated_at: null }
    throw new Error(error.message)
  }
  return {
    summary: String(data?.summary || '').trim(),
    updated_at: data?.updated_at ? String(data.updated_at) : null,
  }
}

export async function saveJournalChatMemory(
  supabase: SupabaseClient,
  userId: string,
  summary: string,
): Promise<void> {
  const trimmed = summary.trim().slice(0, MAX_SUMMARY_CHARS)
  const { error } = await supabase.from('journal_chat_memory').upsert(
    {
      user_id: userId,
      summary: trimmed,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) {
    if (isMissingMemoryTableError(error.message)) return
    throw new Error(error.message)
  }
}

export async function clearJournalChatMemory(supabase: SupabaseClient, userId: string): Promise<void> {
  const { error } = await supabase.from('journal_chat_memory').upsert(
    {
      user_id: userId,
      summary: '',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  )
  if (error) {
    if (isMissingMemoryTableError(error.message)) return
    throw new Error(error.message)
  }
}

export function formatJournalTranscriptForMemory(
  messages: Array<{ role: string; content: string }>,
  maxChars = 24000,
): string {
  const lines: string[] = []
  let total = 0
  for (const m of messages) {
    const role = m.role === 'user' ? 'Personne' : 'Guilde'
    const block = `${role} :\n${String(m.content || '').trim()}`
    if (total + block.length > maxChars) break
    lines.push(block)
    total += block.length + 2
  }
  return lines.join('\n\n')
}

/** Fusion incrémentale : rapide, sections fixes, anti-hallucination. */
const MEMORY_MERGER_LIGHT_SYSTEM = `Tu es un module de FUSION MÉMOIRE (v2) pour un journal astrologique en français.
Tu produis une fiche INTERNE pour l’assistant — jamais un message destiné à la personne.

Objectif : mettre à jour une mémoire de compte stable, lisible, réutilisable dans les prochains jours.

Règles strictes :
- N’inclure que ce qui est **dit explicitement** ou **très clairement impliqué** dans les textes fournis. Aucune invention (pas de métier, lieu, traumatisme, diagnostic, relation) si ce n’est pas dans les sources.
- **Pas** d’angle médical, pas de diagnostic, pas de fatalisme.
- Si la « mémoire actuelle » contredit un fait plus récent dans l’échange, **garde le plus récent** et retire l’ancien.
- **Dédoublonne** : ne répète pas la même idée sous trois formulations ; fusionne en une ligne.
- Longueur totale max ~2600 caractères.

FORMAT DE SORTIE OBLIGATOIRE (titres exacts, dans cet ordre) :
### Contexte
(1–3 phrases : pourquoi la personne utilise le journal, ton général observé.)

### Thèmes & questions récurrents
(Puces ; sujets qui reviennent, questions ouvertes qu’elle pose souvent.)

### Faits ou préférences explicites
(Puces ; seulement ce qu’elle a dit clairement — « vide » sur une ligne si rien.)

### Astrologie / timing (faits cités)
(Puces ; dates, signes, transits **uniquement** si mentionnés dans l’échange ou la mémoire actuelle — sinon « vide ».)

### Sensibilités / à manier avec soin
(Puces ; ce qu’il vaut mieux éviter comme ton ou sujet ; « vide » si rien.)

Exemple de forme (contenu 100 % fictif — ne pas recopier) :
### Contexte
La personne revient pour des questions de timing autour de la Lune ; ton direct et pressé quand elle est stressée.

### Thèmes & questions récurrents
- Besoin de dates concrètes avant l’interprétation
- …

### Faits ou préférences explicites
- A demandé explicitement des réponses plus longues
- …

### Astrologie / timing (faits cités)
- …

### Sensibilités / à manier avec soin
- Éviter de minimiser son besoin de précision chiffrée
`

/** Fusion « archive » : transcript long, consolidation plus profonde. */
const MEMORY_MERGER_ARCHIVE_SYSTEM = `Tu es un module de FUSION MÉMOIRE « ARCHIVE » pour un journal astrologique en français.
Tu reçois un TRANSCRIPT LONG (conversation archivée) + une mémoire actuelle éventuelle.

Mission : produire une mémoire de compte **consolidée**, **dense**, **non redondante**, pour les semaines suivantes.

Règles :
- Tire les **motifs durables** (thèmes de vie, style de question, besoins récurrents, ce qui a semblé important à la personne).
- N’invente **aucun** fait biographique ; n’infère pas de secrets lourds.
- Fusionne avec la mémoire actuelle : **élimine** les doublons, **mets à jour** ce qui est dépassé, **garde** ce qui reste vrai.
- Pas médical, pas fataliste.
- Longueur max ~3200 caractères.

Même FORMAT DE SORTIE que la fusion légère (titres ### identiques dans le même ordre) :
### Contexte
### Thèmes & questions récurrents
### Faits ou préférences explicites
### Astrologie / timing (faits cités)
### Sensibilités / à manier avec soin
`

async function callMerge(apiBase: string, userPrompt: string, mode: 'light' | 'heavy'): Promise<string> {
  const system = mode === 'heavy' ? MEMORY_MERGER_ARCHIVE_SYSTEM : MEMORY_MERGER_LIGHT_SYSTEM
  const maxTok = mode === 'heavy' ? 4096 : 2200
  const temp = mode === 'heavy' ? 0.26 : 0.32

  const res = await fetch(`${apiBase}/ai/interpret`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      prompt: userPrompt,
      system_instruction: system,
      temperature: temp,
      max_output_tokens: maxTok,
    }),
  })
  if (!res.ok) return ''
  const json = await res.json()
  return String(json?.content || '').trim().slice(0, MAX_SUMMARY_CHARS)
}

const LIGHT_USER_WRAPPER = `Consigne : réécris la mémoire fusionnée **complète** (remplace l’ancienne), en respectant le format ### imposé dans la consigne système.

Mémoire actuelle (peut être vide) :
---
{{PRIOR}}
---

Dernier échange à intégrer :

Personne :
"""{{USER}}"""

Guilde :
"""{{ASSIST}}"""
`

const ARCHIVE_USER_WRAPPER = `Consigne : réécris la mémoire fusionnée **complète** après intégration du transcript, format ### imposé.

Mémoire actuelle (peut être vide) :
---
{{PRIOR}}
---

Transcript archivé :
---
{{TRANSCRIPT}}
---
`

function fillTemplate(tpl: string, vars: Record<string, string>): string {
  let out = tpl
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{{${k}}}`).join(v)
  }
  return out
}

/** Après un tour user + assistant : fusion légère (selon rythme, appelée depuis la route). */
export async function mergeJournalMemoryAfterTurn(params: {
  supabase: SupabaseClient
  apiBase: string
  userId: string
  priorSummary: string
  userMessage: string
  assistantMessage: string
}): Promise<void> {
  const { supabase, apiBase, userId, priorSummary, userMessage, assistantMessage } = params
  if (!userMessage.trim() && !assistantMessage.trim()) return

  const prompt = fillTemplate(LIGHT_USER_WRAPPER, {
    PRIOR: priorSummary || '(vide)',
    USER: userMessage.slice(0, 8000),
    ASSIST: assistantMessage.slice(0, 12000),
  })

  try {
    const next = await callMerge(apiBase, prompt, 'light')
    if (next) await saveJournalChatMemory(supabase, userId, next)
  } catch {
    /* ne pas bloquer le journal */
  }
}

/** Archivage : fusion lourde sur transcript long. */
export async function mergeJournalMemoryFromTranscript(params: {
  supabase: SupabaseClient
  apiBase: string
  userId: string
  priorSummary: string
  transcript: string
}): Promise<void> {
  const { supabase, apiBase, userId, priorSummary, transcript } = params
  if (!transcript.trim()) return

  const prompt = fillTemplate(ARCHIVE_USER_WRAPPER, {
    PRIOR: priorSummary || '(vide)',
    TRANSCRIPT: transcript.slice(0, 28000),
  })

  try {
    const next = await callMerge(apiBase, prompt, 'heavy')
    if (next) await saveJournalChatMemory(supabase, userId, next)
  } catch {
    /* idem */
  }
}
