/**
 * Nombre de voix planètes / points après la bulle Astrologie.
 */

import { JOURNAL_SINGLE_VOICE_MAX_BUBBLES } from '@/lib/journal-another-voice'
import {
  JOURNAL_DEEPEN_MAX_BUBBLES,
  journalSpeakerMatchesDeepenRole,
} from '@/lib/journal-deepen'
import { parseJournalGuildReply } from '@/lib/journal-chat-parse'
import type { JournalResponseMode } from '@/lib/journal-response-mode'

export const JOURNAL_GUILD_PLANET_VOICES_MIN = 5
export const JOURNAL_GUILD_PLANET_VOICES_MAX = 7

export type JournalGuildVoiceBudget = 'chorus' | 'minimal' | 'deepen' | 'single' | 'concrete'

export function journalGuildChorusSystemBlock(): string {
  return `
**CHŒUR DE LA GUILDE (après Astrologie — prioritaire sauf relance ciblée)**
- **${JOURNAL_GUILD_PLANET_VOICES_MIN} à ${JOURNAL_GUILD_PLANET_VOICES_MAX} voix** planètes ou points **après** la bulle **Astrologie** (lecture structurée).
- Chaque voix : étiquette \`Nom (Natal: … + Transit: …):\` puis **1 à 2 phrases** en **je** — **effet** distinct, **sans** recopier le paragraphe d’Astrologie sur le même aspect.
- Choisis les corps **les plus actifs dans le bloc** (en approche, exact maintenant, pic proche, ou central à sa question) : ex. Lune, Soleil, Mercure, Vénus, Mars, Jupiter, Saturne, Pluton, Chiron, Vesta…
- **Astrologie** en clôture **optionnelle** : **1 à 2 phrases** qui relient les voix (pas un second cours).
- **Plafond** : 1 Astrologie + **${JOURNAL_GUILD_PLANET_VOICES_MIN}–${JOURNAL_GUILD_PLANET_VOICES_MAX} planètes** + clôture Astrologie optionnelle (**${JOURNAL_GUILD_PLANET_VOICES_MIN + 1} à ${JOURNAL_GUILD_PLANET_VOICES_MAX + 2} tours** au total).
- **Interdit** : plus de ${JOURNAL_GUILD_PLANET_VOICES_MAX} planètes ; voix **sans** donnée dans le bloc ; répéter la même formule d’une voix à l’autre.
`
}

export function journalGuildChorusUserHint(): string {
  return `**Chœur guilde** : après **Astrologie**, fais parler **${JOURNAL_GUILD_PLANET_VOICES_MIN} à ${JOURNAL_GUILD_PLANET_VOICES_MAX}** planètes/points (étiquettes Natal+Transit, 1–2 phrases chacune).`
}

export function journalGuildPlanetVoiceRangeLabel(): string {
  return `${JOURNAL_GUILD_PLANET_VOICES_MIN} à ${JOURNAL_GUILD_PLANET_VOICES_MAX}`
}

/** Chœur 5–7 voix sauf relance ciblée / touchée / approfondir / autre voix. */
export function resolveJournalGuildVoiceBudget(options: {
  concreteFollowUp: boolean
  isAnotherVoiceFollowUp: boolean
  isDeepenFollowUp: boolean
  isTouchedReaction: boolean
  responseMode: JournalResponseMode
}): JournalGuildVoiceBudget {
  if (options.isTouchedReaction) return 'minimal'
  if (options.concreteFollowUp) return 'concrete'
  if (options.isDeepenFollowUp) return 'deepen'
  if (options.isAnotherVoiceFollowUp) return 'single'
  if (options.responseMode === 'targeted') return 'minimal'
  return 'chorus'
}

export function countJournalGuildPlanetVoices(reply: string): number {
  return parseJournalGuildReply(reply).filter(
    (b) => !/^astrologie\s*$/i.test(b.speaker.trim()),
  ).length
}

export function detectJournalGuildChorusIssues(
  reply: string,
  voiceBudget: JournalGuildVoiceBudget,
): string[] {
  if (voiceBudget !== 'chorus') return []
  // deepen / minimal : pas de chœur 5–7
  const n = countJournalGuildPlanetVoices(reply)
  const issues: string[] = []
  if (n < JOURNAL_GUILD_PLANET_VOICES_MIN) {
    issues.push(
      `Chœur incomplet : ${n} voix planète(s) — il en faut **${JOURNAL_GUILD_PLANET_VOICES_MIN} à ${JOURNAL_GUILD_PLANET_VOICES_MAX}** après Astrologie.`,
    )
  }
  if (n > JOURNAL_GUILD_PLANET_VOICES_MAX) {
    issues.push(
      `Trop de voix planètes (${n}) — plafond **${JOURNAL_GUILD_PLANET_VOICES_MAX}** hors Astrologie.`,
    )
  }
  return issues
}

/** Trop de voix en mode approfondir (pas un chœur). */
export function detectJournalGuildDeepenIssues(
  reply: string,
  voiceBudget: JournalGuildVoiceBudget,
  citedRole?: string | null,
): string[] {
  if (voiceBudget !== 'deepen') return []
  const bubbles = parseJournalGuildReply(reply)
  const planetCount = countJournalGuildPlanetVoices(reply)
  const issues: string[] = []
  const who = citedRole?.trim()

  if (bubbles.length > JOURNAL_DEEPEN_MAX_BUBBLES) {
    issues.push(
      `Mode approfondir : **${bubbles.length} bulles** — plafond **${JOURNAL_DEEPEN_MAX_BUBBLES}** (voix citée + 0 ou 1 nuance courte). Pas de tour de table.`,
    )
  }
  if (planetCount >= 3) {
    issues.push(
      `Mode approfondir : trop de planètes (${planetCount}) — **une** voix principale + **0 ou 1** nuance, pas un chœur.`,
    )
  }
  if (planetCount >= JOURNAL_GUILD_PLANET_VOICES_MIN) {
    issues.push(
      `Mode approfondir : chœur interdit — pas **${JOURNAL_GUILD_PLANET_VOICES_MIN}–${JOURNAL_GUILD_PLANET_VOICES_MAX}** planètes.`,
    )
  }
  if (who && !/^astrologie\s*$/i.test(who)) {
    const first = bubbles[0]
    if (first && /^astrologie\s*$/i.test(first.speaker.trim()) && first.body.length > 280) {
      issues.push(
        `Mode approfondir : **${who}** doit parler **en premier** — pas une longue bulle **Astrologie** avant la planète citée.`,
      )
    }
    const hasMain = bubbles.some((b) => journalSpeakerMatchesDeepenRole(b.speaker, who))
    if (!hasMain) {
      issues.push(`Mode approfondir : la voix **${who}** citée doit répondre (bulle principale).`)
    }
  }
  return issues
}

/** Trop de voix en mode « autre planète ». */
export function detectJournalGuildSingleVoiceIssues(
  reply: string,
  voiceBudget: JournalGuildVoiceBudget,
): string[] {
  if (voiceBudget !== 'single') return []
  const bubbles = parseJournalGuildReply(reply)
  const planetCount = countJournalGuildPlanetVoices(reply)
  const issues: string[] = []
  if (bubbles.length > JOURNAL_SINGLE_VOICE_MAX_BUBBLES + 1) {
    issues.push(
      `Mode autre voix : **${bubbles.length} bulles** — **1 seule planète** (éventuellement + 2 phrases Astrologie max), pas une table ni un chœur.`,
    )
  }
  if (planetCount === 0) {
    issues.push(
      'Mode autre voix : **1 planète** obligatoire — \`Nom (Natal: … + Transit: …):\` puis 4–8 phrases en **je**. **Pas** une longue bulle **Astrologie** qui cite Saturne, Mars, la Lune, etc.',
    )
  }
  if (planetCount > 1) {
    issues.push(
      `Mode autre voix : **${planetCount} planètes** — **une seule** voix planète doit répondre.`,
    )
  }
  if (planetCount >= JOURNAL_GUILD_PLANET_VOICES_MIN) {
    issues.push(`Mode autre voix : chœur interdit — **1 planète** seulement.`)
  }
  const astro = bubbles.find((b) => /^astrologie\s*$/i.test(b.speaker.trim()))
  if (astro && astro.body.length > 400) {
    issues.push(
      'Mode autre voix : **Astrologie** trop longue — **1 planète** en voix principale ; Astrologie **2 phrases max** ou absente.',
    )
  }
  if (/\b1\.\s*tensions|2\.\s*fond natal|3\.\s*ouvertures/i.test(reply)) {
    issues.push('Mode autre voix : **pas** de sections 1–2–3 — **une** planète en **je** seulement.')
  }
  return issues
}
