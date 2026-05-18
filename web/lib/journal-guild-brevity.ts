/**
 * Consignes de brièveté (coût tokens) — journal pilote.
 */

import {
  JOURNAL_GUILD_PLANET_VOICES_MAX,
  JOURNAL_GUILD_PLANET_VOICES_MIN,
  journalGuildPlanetVoiceRangeLabel,
} from '@/lib/journal-guild-chorus'

export const JOURNAL_MAX_OUTPUT_TOKENS_DEFAULT = 3072
export const JOURNAL_MAX_OUTPUT_TOKENS_TOUCHED = 512
export const JOURNAL_MAX_OUTPUT_TOKENS_CORRECTION = 3072

/** Phrases max pour une voix planète (chœur). */
export const JOURNAL_PLANET_VOICE_MAX_SENTENCES = 1

/** Phrases max par section Astrologie (1–2–3). */
export const JOURNAL_ASTRO_SECTION_MAX_SENTENCES = 2

/** Phrases max bulle Astrologie (mode messagerie, hors ancré). */
export const JOURNAL_ASTRO_BUBBLE_MAX_SENTENCES = 8

/** Phrases voix principale (approfondir / autre voix). */
export const JOURNAL_SINGLE_VOICE_PHRASE_RANGE = '3 à 5'

export function journalGuildBrevitySystemBlock(): string {
  const chorus = journalGuildPlanetVoiceRangeLabel()
  return `
**BRIÈVETÉ (prioritaire — coût et lecture messagerie)**
- **Synthèse** : chaque bulle = **l’essentiel** ; une idée par phrase ; **pas** de paraphrase du bloc astro ni du tour précédent.
- **Astrologie** : sections 1–2–3 **courtes** (**${JOURNAL_ASTRO_SECTION_MAX_SENTENCES} phrases max** par section) ; **${JOURNAL_ASTRO_BUBBLE_MAX_SENTENCES} phrases max** au total si message court — **pas** de pavé.
- **Chœur** : **${chorus} planètes** après Astrologie — **${JOURNAL_PLANET_VOICE_MAX_SENTENCES} phrase** chacune (effet distinct, sans répéter Astrologie).
- **Clôture Astrologie** : **0 ou 1 phrase** — souvent **aucune**.
- **Interdit** : rallonger « pour faire joli » ; six planètes par habitude ; re-lister les mêmes aspects ; second passage Astrologie long.
- **Exception (sur demande)** : si la personne appuie **Approfondir**, **Piste concrète**, **Autre voix** ou écrit une relance ciblée — applique le **mode de ce tour** (1–2 bulles, voix choisie) : là tu **peux** développer **4 à 7 phrases** pour **cette** voix ; le reste de la guilde **se tait**.
`
}

export function journalGuildBrevityUserHint(): string {
  return `**Court** : Astrologie synthétique ; **${journalGuildPlanetVoiceRangeLabel()}** planètes (**${JOURNAL_PLANET_VOICE_MAX_SENTENCES} phrase** chacune) ; pas de clôture longue.`
}
