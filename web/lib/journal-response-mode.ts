/**

 * Modes de réponse guilde (Journal pilote uniquement).

 * Tous s’appuient sur l’architecture « Astrologie pose la table / planètes = effets ».

 */



import type { JournalDialogueDepth } from '@/lib/journal-dialogue-style'

import {

  JOURNAL_GUILD_PLANET_VOICES_MAX,

  JOURNAL_GUILD_PLANET_VOICES_MIN,

  type JournalGuildVoiceBudget,

  journalGuildPlanetVoiceRangeLabel,

} from '@/lib/journal-guild-chorus'

import { isJournalConcreteFollowUp } from '@/lib/journal-follow-up'

import { parseJournalLunarIntent } from '@/lib/journal-lunar-intent'



export type JournalResponseMode = 'messaging' | 'exploratory' | 'targeted'



const EXPLORATORY_PHRASE =

  /\b(parle(?:z)?-moi|parle(?:z)?\s+moi|dis-moi|dis\s+moi|explique(?:z)?-moi|explique(?:z)?\s+moi|explique(?:z)?|raconte(?:z)?-moi|raconte(?:z)?|qu['']est-ce que|en quoi|parlons de|ayons un regard|donne-moi un|donne moi un|décris|de quoi s'agit|dis-moi en quoi|comment se manifeste)\b/i



const TARGETED_PHRASE =

  /\b(est-ce que|suis-je|vais-je|dois-je|risque|congédi|licenci|oui ou non|vais je|dois je)\b/i



const LUNAR_CONTEXT =

  /\b(en cours|actuelle?s?|du moment|présente?s?|presente?s?|cette semaine|ce cycle|lunaison)\b/i



const THEME_EXPLORATION =

  /\b(lune|lunaison|pleine lune|nouvelle lune|cycle|thème|transit|maison|ascendant|carte)\b/i



const ENERGY_TODAY =

  /\b(énergie|energie)\s+(du jour|d'aujourd'hui|daujourdhui|actuelle?|en ce moment|aujourd'hui)\b/i



const CHORUS_VOICES = journalGuildPlanetVoiceRangeLabel()



export function detectJournalResponseMode(

  message: string,

  options?: { hasLunarPhenomena?: boolean; prior?: Array<{ role: string; content: string }> },

): JournalResponseMode {

  const t = message.trim()

  if (!t) return 'messaging'



  const prior = options?.prior ?? []

  const hasGuildTurn = prior.some((m) => m.role === 'assistant')



  if (hasGuildTurn && isJournalConcreteFollowUp(t)) return 'targeted'



  const lunarIntent = parseJournalLunarIntent(message)

  const wantsExploration = EXPLORATORY_PHRASE.test(t)

  const wantsTargeted = TARGETED_PHRASE.test(t) && !wantsExploration



  if (wantsTargeted) return 'targeted'



  if (ENERGY_TODAY.test(t)) return 'exploratory'



  const lunarTopic =

    !!lunarIntent ||

    (options?.hasLunarPhenomena && /\b(lune|lunaison|pleine|nouvelle)\b/i.test(t))



  if (lunarTopic && (wantsExploration || LUNAR_CONTEXT.test(t))) {

    return 'exploratory'

  }



  if (wantsExploration && THEME_EXPLORATION.test(t)) {

    return 'exploratory'

  }



  return 'messaging'

}



/** Bloc injecté dans la consigne système — remplace le mode messagerie serré pour ce tour. */

export function journalResponseModeSystemBlock(

  mode: JournalResponseMode,

  dialogueDepth: JournalDialogueDepth = 'light',

  voiceBudget: JournalGuildVoiceBudget = 'chorus',

): string {

  if (voiceBudget === 'concrete') {
    return `
**MODE PISTE CONCRÈTE (ce tour — 1 bulle)** : **une** piste réaliste — **la voix citée** répond **seule**.

- **4 à 6 phrases** en **je** (étiquette Natal+Transit) ou **Astrologie :** si c’est elle — **une** action pour les prochains jours.
- **Interdit** : **Astrologie** + planète citée en double ; chœur ; sections **1–2–3**.
- **Plafond : 1 bulle**.
`
  }

  if (voiceBudget === 'single') {
    return `
**MODE AUTRE VOIX (ce tour — 1 planète)** : elle demande **une** autre voix qui **commente autrement** — pas une nouvelle lecture du ciel.

- **1 planète** : \`Nom (Natal: … + Transit: …):\` puis **4 à 8 phrases** en **je** — angle **différent** du fil précédent.
- **Interdit** : Astrologie longue ; sections **1–2–3** ; chœur **${CHORUS_VOICES}** ; nommer 6 corps dans une seule bulle Astrologie.
- **Plafond : 1 intervenant** planète (Astrologie **0** ou **2 phrases** max en clôture).
`
  }

  if (voiceBudget === 'deepen') {
    return `
**MODE APPROFONDIR (ce tour — conversation, pas assemblée)** : elle parlait **à une voix** ; c’est **cette voix** qui répond **au long** — les autres **se taisent** sauf **0 ou 1** courte nuance.

- **Voix citée** : **4 à 8 phrases**, Natal+Transit ; angle concret ; **sans** table 1–2–3 ni recopie du tour précédent.
- **0 ou 1** nuance courte (1–2 phrases) — **pas** Astrologie longue + plusieurs planètes.
- **Interdit** : chœur **${CHORUS_VOICES}** ; tour de table ; ouvrir par **Astrologie** si la planète citée n’est pas Astrologie.
- **Plafond : 2 bulles** (souvent **1** suffit).
`
  }

  const chorusLine =

    voiceBudget === 'chorus'

      ? `- **${CHORUS_VOICES} planètes** après **Astrologie** (voir consigne CHŒUR DE LA GUILDE).\n`

      : ''



  if (dialogueDepth === 'anchored') {

    return `

**MODE ANCRÉ (ce tour — message riche)** : l’**architecture ancrée** du dialogue prime sur la brièveté messagerie. Ne compresse pas en 3 phrases ce qu’elle vient de partager.

${chorusLine}

`

  }



  if (mode === 'exploratory') {

    return `

**MODE EXPLORATOIRE (ce tour)** : thème ouvert (lunaison, énergie, cycle). Si son message est **personnel et détaillé**, l’architecture **ancrée** s’applique ; sinon : **Astrologie** (table aérée) puis **${voiceBudget === 'chorus' ? CHORUS_VOICES + ' voix' : '1 planète'}**, clôture **Astrologie** optionnelle.

${chorusLine}

`

  }



  if (mode === 'targeted') {

    return `

**MODE CIBLÉ (ce tour)** : question **étroite** ou **relance concrète**. **Pas** de sections 1–2–3 complètes si le fil les a déjà eues.

- **Astrologie** : **3–6 phrases** — réponse directe, **une** piste actionnable ; aspects nommés **au minimum** (pas de re-listing du tour précédent).

- **1 planète** max si pertinent ; clôture **Astrologie** **1–2 phrases**.

- **Plafond 3 tours**. Dialogue fluide, pas catalogue de placements.

`

  }



  return `

**MODE MESSAGERIE (ce tour — défaut)** : fil de discussion — **dialogue fluide**, pas rigide.

- **Astrologie** pose la table (sections 1–2–3 **aérées**).

${chorusLine}- Clôture **Astrologie** **optionnelle** (**1–2 phrases**).

- **Plafond** : ${voiceBudget === 'chorus' ? `${JOURNAL_GUILD_PLANET_VOICES_MIN + 1} à ${JOURNAL_GUILD_PLANET_VOICES_MAX + 2}` : '4 à 6'} tours. Accueillir le **vécu** avant le détail technique quand c’est pertinent.

`

}



export function journalResponseModeUserHint(

  mode: JournalResponseMode,

  dialogueDepth: JournalDialogueDepth = 'light',

  voiceBudget: JournalGuildVoiceBudget = 'chorus',

): string {

  if (voiceBudget === 'concrete') {
    return `**Piste concrète** : **1 bulle** — la voix citée seule ; pas Astrologie + planète.`
  }

  if (voiceBudget === 'single') {
    return `**Autre voix** : **1 planète** (4–8 phrases) — pas table 1–2–3, pas chœur.`
  }

  if (voiceBudget === 'deepen') {
    return `**Conversation** : **une** voix au long ; **0 ou 1** nuance — **2 bulles max**. Pas chœur, pas six planètes.`
  }

  if (dialogueDepth === 'anchored') {

    return voiceBudget === 'chorus'

      ? `**Ancré + chœur** : grandes lignes **Astrologie** puis **${CHORUS_VOICES}** planètes courtes ; clôture globale.`

      : `**Ancré** : grandes lignes → nuance planète → impression globale.`

  }

  if (mode === 'exploratory') {

    return voiceBudget === 'chorus'

      ? `**Exploratoire** : Astrologie puis **${CHORUS_VOICES}** voix du bloc.`

      : `**Mode exploratoire** : table humaine puis ciel ; planètes en **nuance** ; ton du profil.`

  }

  if (mode === 'targeted') {

    return `**Mode ciblé** : réponse directe, **3 tours max** ; pas de re-lecture 1–2–3 si déjà faite — **une** piste concrète ancrée dans le fil.`

  }

  return voiceBudget === 'chorus'

    ? `**Messagerie + chœur** : Astrologie table ; **${CHORUS_VOICES}** planètes ; clôture qui relie.`

    : `**Mode messagerie** : Astrologie pose la table ; 1–2 voix sur les **effets** ; clôture douce.`

}


