/**
 * Relances ciblées (piste concrète, suite à une planète) — une seule voix, pas Astrologie + planète.
 */

import { journalSpeakerMatchesDeepenRole } from '@/lib/journal-deepen'
import { parseJournalGuildReply } from '@/lib/journal-chat-parse'

/** Apostrophe droite, typographique (U+2019) ou accent grave seul. */
const APOS = `[''\u2019]`

/** Pas de \\b en tête : « À partir » commence par une lettre accentuée. */
const CONCRETE_FOLLOW_UP =
  new RegExp(
    `(?:à partir de ce que|suite à ce que|en suivant ce que|d${APOS}après ce que).{0,120}vient d${APOS}?évoquer`,
    'i',
  )

const CONCRETE_CITED_ROLE =
  new RegExp(
    `(?:à partir de ce que|suite à ce que|en suivant ce que|d${APOS}après ce que)\\s+(.+?)\\s+vient d${APOS}?évoquer`,
    'i',
  )

export const JOURNAL_CONCRETE_MAX_BUBBLES = 1

const CONCRETE_PISTE =
  /\b(piste|pas|étapes?)\s+(concrète?s?|réalistes?|pratiques?)\b/i

const NEXT_DAYS =
  /\b(pour les prochains jours|ces prochains jours|dans les prochains jours|cette semaine)\b/i

const PLANET_QUOTE_RELAY =
  /\b(à partir de ce que|donne-moi une piste|une piste concrète).{0,40}(saturne|mars|lune|vénus|mercure|jupiter|pluton|neptune|uranus|vesta|astrologie)/i

/** Question étroite après une bulle ou une lecture déjà donnée. */
export function isJournalConcreteFollowUp(message: string): boolean {
  const t = message.trim()
  if (!t) return false
  if (CONCRETE_FOLLOW_UP.test(t)) return true
  if (PLANET_QUOTE_RELAY.test(t)) return true
  if (CONCRETE_PISTE.test(t) && (NEXT_DAYS.test(t) || /prochains jours/i.test(t))) return true
  return false
}

const STRUCTURED_READING_MARKERS =
  /\b(1\.\s*\*?\*?tensions|tensions et défis du moment|2\.\s*\*?\*?fond natal|fond natal et secteurs|3\.\s*\*?\*?ouvertures|ouvertures et soutiens)\b/i

/** Le fil contient déjà une lecture astro structurée (sections 1–3). */
export function threadHasStructuredAstroReading(
  prior: Array<{ role: string; content: string }>,
): boolean {
  const lastGuild = [...prior].reverse().find((m) => m.role === 'assistant')
  if (!lastGuild) return false
  return STRUCTURED_READING_MARKERS.test(String(lastGuild.content || ''))
}

/** Planète / point cité dans « à partir de ce que X vient d'évoquer ». */
export function extractJournalConcreteTargetRole(message: string): string | null {
  const m = message.match(CONCRETE_CITED_ROLE)
  if (!m) return null
  return m[1].split('(')[0]?.trim() || m[1].trim() || null
}

export function journalFollowUpSystemBlock(citedRole?: string | null): string {
  const who = citedRole?.trim() || 'la voix citée dans le message'
  const isAstrologie = /^astrologie\s*$/i.test(who)
  return `
**PISTE CONCRÈTE (ce tour — 1 seule voix)**
La personne demande **une piste réaliste** à partir de **${who}** — ce n’est **pas** une nouvelle lecture du ciel ni un doublon Astrologie + planète.

- **${who}** répond **seule** : ${isAstrologie ? '**Astrologie :**' : 'étiquette \`Nom (Natal: … + Transit: …):\` puis'} **4 à 6 phrases** — **une** action simple et répétable pour les prochains jours ; ne recopie pas tout le passage cité.
- **Interdit** : **Astrologie** + **${who}** dans le même tour si ce n’est pas Astrologie ; chœur ; sections **1–2–3** ; re-lister les mêmes aspects du tour précédent.
- **Plafond strict : 1 bulle** (${who} uniquement).
`
}

export function journalFollowUpUserHint(citedRole?: string | null): string {
  const who = citedRole?.trim() || 'la voix citée'
  return `**Piste concrète** : **${who}** seule (4–6 phrases, une action) — **pas** Astrologie + ${who}.`
}

/** Garde uniquement la voix citée (ex. Chiron), pas Astrologie en plus. */
export function enforceJournalConcreteFollowUpReply(
  reply: string,
  citedRole?: string | null,
): string {
  const bubbles = parseJournalGuildReply(reply)
  if (bubbles.length <= JOURNAL_CONCRETE_MAX_BUBBLES) {
    const who = citedRole?.trim()
    if (who && !/^astrologie\s*$/i.test(who)) {
      const only = bubbles[0]
      if (only && /^astrologie\s*$/i.test(only.speaker.trim())) {
        const planet = bubbles.find((b) => journalSpeakerMatchesDeepenRole(b.speaker, who))
        if (planet) return `${planet.speaker.trim()}: ${planet.body.trim()}`
      }
    }
    return reply
  }

  const who = citedRole?.trim()
  if (who) {
    if (/^astrologie\s*$/i.test(who)) {
      const astro = bubbles.find((b) => /^astrologie\s*$/i.test(b.speaker.trim()))
      if (astro) return `${astro.speaker.trim()}: ${astro.body.trim()}`
    }
    const chosen = bubbles.find((b) => journalSpeakerMatchesDeepenRole(b.speaker, who))
    if (chosen) return `${chosen.speaker.trim()}: ${chosen.body.trim()}`
  }

  const planets = bubbles.filter((b) => !/^astrologie\s*$/i.test(b.speaker.trim()))
  const main = planets.find((b) => /\(Natal:/i.test(b.speaker)) ?? planets[0] ?? bubbles[0]
  if (!main) return reply
  return `${main.speaker.trim()}: ${main.body.trim()}`
}

export function detectJournalGuildConcreteFollowUpIssues(
  reply: string,
  voiceBudget: import('@/lib/journal-guild-chorus').JournalGuildVoiceBudget,
  citedRole?: string | null,
): string[] {
  if (voiceBudget !== 'concrete') return []
  const bubbles = parseJournalGuildReply(reply)
  const issues: string[] = []
  const who = citedRole?.trim()

  if (bubbles.length > JOURNAL_CONCRETE_MAX_BUBBLES) {
    issues.push(
      `Piste concrète : **${bubbles.length} bulles** — **1 seule** (${who || 'voix citée'}), pas Astrologie + planète.`,
    )
  }
  if (who && !/^astrologie\s*$/i.test(who)) {
    const hasAstro = bubbles.some((b) => /^astrologie\s*$/i.test(b.speaker.trim()))
    const hasPlanet = bubbles.some((b) => journalSpeakerMatchesDeepenRole(b.speaker, who))
    if (hasAstro && hasPlanet) {
      issues.push(
        `Piste concrète : **interdit** Astrologie + **${who}** — seule **${who}** répond avec la piste.`,
      )
    }
    if (!hasPlanet && bubbles.length > 0) {
      issues.push(`Piste concrète : **${who}** doit répondre (bulle unique avec la piste).`)
    }
  }
  if (/\b1\.\s*tensions|2\.\s*fond natal|3\.\s*ouvertures/i.test(reply)) {
    issues.push('Piste concrète : pas de sections 1–2–3 — une voix, une piste.')
  }
  return issues
}

export function journalThreadContinuityUserHint(hasPriorStructuredReading: boolean): string {
  if (!hasPriorStructuredReading) return ''
  return `**Continuité du fil** : une lecture astro structurée (sections 1–2–3) a **déjà** été donnée — ce tour apporte un **angle nouveau** ou une **piste**, pas un second cours identique.`
}
