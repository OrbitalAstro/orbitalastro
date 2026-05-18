/**
 * Relance « Autre voix » — une planète choisie, pas une table Astrologie ni un chœur.
 */

import { journalSpeakerMatchesDeepenRole } from '@/lib/journal-deepen'
import { parseJournalGuildReply } from '@/lib/journal-chat-parse'

/** Marqueur interne (non affiché tel quel dans le fil). */
export const JOURNAL_ANOTHER_VOICE_TAG = '[🎭 voix guilde]'

const ANOTHER_VOICE_LEGACY =
  /une autre planète ou point de ma carte pourrait-elle commenter autrement/i

const ANOTHER_VOICE_LOOSE =
  /\b(une seule autre|autre)\s+(?:planète|voix|point).{0,80}commenter autrement\b/i

export const JOURNAL_SINGLE_VOICE_MAX_BUBBLES = 1

/** Message API : voix choisie dans le menu (court, structuré). */
export function journalAnotherVoiceMessage(roleLabel: string): string {
  const role = roleLabel.trim()
  return `${JOURNAL_ANOTHER_VOICE_TAG} ${role}`
}

export function isJournalAnotherVoiceMessage(message: string): boolean {
  const t = message.trim()
  if (!t) return false
  if (t.startsWith(JOURNAL_ANOTHER_VOICE_TAG)) return true
  return ANOTHER_VOICE_LEGACY.test(t) || ANOTHER_VOICE_LOOSE.test(t)
}

/** Planète / point choisi dans le menu. */
export function extractJournalAnotherVoiceRole(message: string): string | null {
  const t = message.trim()
  if (t.startsWith(JOURNAL_ANOTHER_VOICE_TAG)) {
    const role = t.slice(JOURNAL_ANOTHER_VOICE_TAG.length).trim()
    return role || null
  }
  return null
}

export function journalAnotherVoiceDisplayText(message: string): string {
  const role = extractJournalAnotherVoiceRole(message)
  if (role) return `Autre voix : ${role}`
  if (ANOTHER_VOICE_LEGACY.test(message) || ANOTHER_VOICE_LOOSE.test(message)) {
    return 'Autre voix de la guilde'
  }
  return message
}

export function journalAnotherVoiceSystemBlock(selectedRole?: string | null): string {
  const who = selectedRole?.trim() || 'la planète choisie'
  return `
**AUTRE VOIX (ce tour — ${who} seulement)**
La personne a **choisi** **${who}** pour **commenter autrement** — conversation **tête-à-tête** avec cette voix, pas une assemblée.

- **${who}** : \`Nom (Natal: … + Transit: …):\` puis **4 à 7 phrases** en **je** — angle **neuf** par rapport au fil (sans recopier Saturne, Vesta, etc.).
- **Interdit** : bulle **Astrologie** longue ; sections **1. Tensions / 2. Fond / 3. Ouvertures** ; chœur ; autres planètes.
- **Plafond : 1 bulle** (${who} seule). Pas de clôture Astrologie sauf **2 phrases** max si indispensable.
`
}

export function journalAnotherVoiceUserHint(selectedRole?: string | null): string {
  const who = selectedRole?.trim() || 'la voix choisie'
  return `**Autre voix** : **${who}** seule (4–7 phrases, Natal+Transit) — pas table 1–2–3, pas chœur.`
}

/** Garde la voix choisie si le modèle a tout livré. */
export function enforceJournalSingleVoiceReply(
  reply: string,
  preferredRole?: string | null,
): string {
  const bubbles = parseJournalGuildReply(reply)
  const planets = bubbles.filter((b) => !/^astrologie\s*$/i.test(b.speaker.trim()))
  const who = preferredRole?.trim()

  if (who) {
    const chosen = planets.find((b) => journalSpeakerMatchesDeepenRole(b.speaker, who))
    if (chosen) return `${chosen.speaker.trim()}: ${chosen.body.trim()}`
  }

  if (bubbles.length <= JOURNAL_SINGLE_VOICE_MAX_BUBBLES) {
    return reply
  }

  const withPlacement = planets.find((b) => /\(Natal:/i.test(b.speaker))
  const main = withPlacement ?? planets[0]
  if (!main) {
    const astro = bubbles.find((b) => /^astrologie\s*$/i.test(b.speaker.trim()))
    if (astro) return `${astro.speaker.trim()}: ${astro.body.trim().slice(0, 480)}`
    return bubbles[0] ? `${bubbles[0].speaker.trim()}: ${bubbles[0].body.trim()}` : reply
  }
  return `${main.speaker.trim()}: ${main.body.trim()}`
}
