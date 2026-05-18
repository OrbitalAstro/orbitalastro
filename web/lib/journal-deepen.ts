/**
 * Relance « Approfondir » — conversation avec UNE voix (pas un tour de table).
 */

import { parseJournalGuildReply } from '@/lib/journal-chat-parse'

const DEEPEN_BUBBLE =
  /\b(peux-tu )?approfondir ce que (.+?) vient d[''\u2019]?évoquer\b/i

/** Message bouton Approfondir (voix principale explicite). */
const DEEPEN_BUBBLE_ROLE =
  /\bréponds surtout en tant que (.+?) : approfondis ce que tu viens d[''\u2019]?évoquer\b/i

const DEEPEN_THEME = /\bapprofondir ce thème\b/i

const DEEPEN_LOOSE = /\b(approfondis|approfondir)\b/i

/** Nuance courte max (caractères corps). */
export const JOURNAL_DEEPEN_NUANCE_MAX_CHARS = 320

export const JOURNAL_DEEPEN_MAX_BUBBLES = 2

function cleanDeepenRole(raw: string): string {
  return raw.split('(')[0]?.trim() || raw.trim()
}

/** Message généré par le bouton Approfondir sous une bulle. */
export function isJournalDeepenMessage(message: string): boolean {
  const t = message.trim()
  if (!t) return false
  if (DEEPEN_BUBBLE.test(t) || DEEPEN_BUBBLE_ROLE.test(t) || DEEPEN_THEME.test(t)) return true
  // Relances naturelles dans le fil
  if (DEEPEN_LOOSE.test(t) && /\b(surtout en tant que|ce que .+ vient d)/i.test(t)) return true
  return false
}

function speakerBaseName(speaker: string): string {
  return speaker.split('(')[0]?.trim().toLowerCase() || speaker.trim().toLowerCase()
}

export function journalSpeakerMatchesDeepenRole(speaker: string, citedRole: string): boolean {
  return speakerBaseName(speaker) === citedRole.trim().toLowerCase()
}

/** Planète ou point cité dans « approfondir ce que X vient d'évoquer ». */
export function extractJournalDeepenTargetRole(message: string): string | null {
  const legacy = message.match(DEEPEN_BUBBLE)
  if (legacy) return cleanDeepenRole(legacy[2]) || null
  const direct = message.match(DEEPEN_BUBBLE_ROLE)
  if (direct) return cleanDeepenRole(direct[1]) || null
  return null
}

export function journalDeepenSystemBlock(citedRole?: string | null): string {
  const who = citedRole?.trim() || 'la voix citée dans le message'
  const isAstrologie = /^astrologie\s*$/i.test(who)

  return `
**APPROFONDIR = CONVERSATION (ce tour — priorité absolue sur tout le reste)**
La personne **parlait à** ${isAstrologie ? '**Astrologie**' : `**${who}**`} et veut que **cette même voix** développe — comme un message privé, **pas** une assemblée de la guilde.

**Principe** : un fil de messagerie entre elle et **une** interlocutrice ; tu **n’invites pas** toute la table à commenter.

- **${who}** répond **en premier** (étiquette \`Nom (Natal: … + Transit: …):\` sauf **Astrologie:**) : **4 à 7 phrases**, angle **concret** quotidien ; **sans** recopier le passage ni refaire **1. Tensions / 2. Fond / 3. Ouvertures**.
- **0 ou 1** courte réplique ensuite (**optionnelle**) — **pas les deux** Astrologie **et** une planète :
  - si ${who} n’est **pas** Astrologie : au plus \`Astrologie:\` **1–2 phrases** **ou** **une** autre planète **1–2 phrases**, pas les deux ;
  - si ${who} **est** Astrologie : au plus **une** planète en **1–2 phrases**, ou **rien**.
- **Interdit** : ouvrir par une longue **Astrologie** si la voix citée est une **planète** ; chœur multi-voix ; **toute** autre planète qui « passe son tour » ; re-lister le ciel du message précédent.
- **Plafond strict : 2 bulles** (voix principale + 0–1 nuance courte). Souvent **1 seule bulle** suffit.
`
}

export function journalDeepenUserHint(citedRole?: string | null): string {
  const who = citedRole?.trim() || 'la voix citée'
  return `**Conversation approfondie** : **${who}** seule (4–7 phrases) ; **0 ou 1** nuance courte — **2 bulles max**. Pas de chœur, pas de table 1–2–3.`
}

/**
 * Coupe les voix en trop si le modèle a ignoré le mode approfondir.
 * Garde la voix citée + au plus une nuance courte.
 */
export function enforceJournalDeepenReply(reply: string, citedRole?: string | null): string {
  const bubbles = parseJournalGuildReply(reply)
  if (bubbles.length <= JOURNAL_DEEPEN_MAX_BUBBLES) {
    const who = citedRole?.trim()
    if (!who || bubbles.length === 0) return reply
    const mainIdx = bubbles.findIndex((b) => journalSpeakerMatchesDeepenRole(b.speaker, who))
    if (mainIdx <= 0) return reply
    const main = bubbles[mainIdx]
    const rest = bubbles.filter((_, i) => i !== mainIdx)
    const nuance = pickDeepenNuance(rest, who)
    return formatDeepenBubbles([main, nuance])
  }

  const who = citedRole?.trim()
  if (!who) {
    return formatDeepenBubbles(bubbles.slice(0, JOURNAL_DEEPEN_MAX_BUBBLES))
  }

  let mainIdx = bubbles.findIndex((b) => journalSpeakerMatchesDeepenRole(b.speaker, who))
  if (mainIdx < 0) {
    mainIdx = bubbles.findIndex((b) => !/^astrologie\s*$/i.test(b.speaker.trim()))
  }
  if (mainIdx < 0) return formatDeepenBubbles([bubbles[0]])

  const main = bubbles[mainIdx]
  const rest = bubbles.filter((_, i) => i !== mainIdx)
  const nuance = pickDeepenNuance(rest, who)
  return formatDeepenBubbles([main, nuance])
}

function pickDeepenNuance(
  candidates: Array<{ speaker: string; body: string }>,
  citedRole: string,
): { speaker: string; body: string } | null {
  if (!candidates.length) return null
  const short = candidates
    .filter((b) => b.body.trim().length > 0 && b.body.length <= JOURNAL_DEEPEN_NUANCE_MAX_CHARS)
    .sort((a, b) => a.body.length - b.body.length)
  const isPlanetCited = !/^astrologie\s*$/i.test(citedRole)
  if (isPlanetCited) {
    const astro = short.find((b) => /^astrologie\s*$/i.test(b.speaker.trim()))
    if (astro) return astro
  }
  const planet = short.find((b) => !/^astrologie\s*$/i.test(b.speaker.trim()))
  return planet ?? short[0] ?? null
}

function formatDeepenBubbles(
  items: Array<{ speaker: string; body: string } | null>,
): string {
  return items
    .filter((b): b is { speaker: string; body: string } => !!b?.body?.trim())
    .map((b) => `${b.speaker.trim()}: ${b.body.trim()}`)
    .join('\n\n')
}
