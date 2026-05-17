/**
 * Modes de réponse guilde (Journal pilote uniquement).
 * Permet des réponses fragmentées par défaut, plus touffues quand la personne
 * demande une exploration (lunaison, thème, « parle-moi de… »).
 */

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

export function detectJournalResponseMode(
  message: string,
  options?: { hasLunarPhenomena?: boolean },
): JournalResponseMode {
  const t = message.trim()
  if (!t) return 'messaging'

  const lunarIntent = parseJournalLunarIntent(message)
  const wantsExploration = EXPLORATORY_PHRASE.test(t)
  const wantsTargeted = TARGETED_PHRASE.test(t) && !wantsExploration

  if (wantsTargeted) return 'targeted'

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
export function journalResponseModeSystemBlock(mode: JournalResponseMode): string {
  if (mode === 'exploratory') {
    return `
**MODE EXPLORATOIRE (ce tour — prioritaire)** : la personne demande un **cadrage** ou une **exploration** (lunaison, cycle, thème, « parle-moi de… »). Les règles « réponse type messagerie serrée » (2–4 phrases pour la première Astrologie, plafond 3–5 tours) sont **remplacées** par celles-ci pour **ce message uniquement**. Objectif : **tout l’essentiel en un seul envoi** — signes **et** maisons **explicités**, sans obliger une deuxième question du type « et la maison, ça veut dire quoi ? ».

- **Astrologie :** en premier — **4 à 6 phrases** : si **PHÉNOMÈNES LUNAIRES** est dans le bloc, **date et heure en tête** ; puis **signe de la lunaison** avec **ce qu’il colore** (pas seulement le nom du signe) ; pour **chaque maison** centrale au message, le **secteur de vie** en langage clair (maison X = …) ; ce que ce cycle invite ; **une** piste concrète. C’est ici que tu **définis** signe + maisons — les voix planètes **ne répètent pas** les mêmes définitions.
- **Lune** : **obligatoire** si lunaison — étiquette **(Natal + Transit)** puis **2 à 3 phrases** de **vécu** (comment ça se ressent chez elle, tension ou soutien) en **s’appuyant** sur le cadre déjà donné par Astrologie, sans redéfinir Balance/maison 5/Scorpion/maison 11 si déjà expliqués.
- **1 à 2 autres voix** (ex. Soleil pour nouvelle lune) : **angle différent** — opportunité, défi ou conseil **concret** ; **2 phrases** ; pas de doublon avec Astrologie ni avec la Lune.
- **Plafond : 5 à 7 tours** (Astrologie comprise). Dernière **Astrologie :** optionnelle — **1 phrase** (relance ou intention), pas un résumé qui recolle tout ce qui précède.
- Toujours : format étiquette strict, pas de « je suis… », pas d’orbes en degrés dans la prose.
`
  }

  if (mode === 'targeted') {
    return `
**MODE CIBLÉ (ce tour — prioritaire)** : question **étroite** (oui/non symbolique, risque pro, un seul sujet). Applique le plafond **4 tours** et une première **Astrologie :** qui **répond au titre** en 2–3 phrases max avant les voix planètes.
`
  }

  return `
**MODE MESSAGERIE (ce tour — défaut)** : échanges courts type fil de discussion — **3 à 5 tours**, **1 à 2 phrases** par voix planète, première **Astrologie :** **2 à 4 phrases** (sauf relance « développe »). Si une **maison** ou un **signe** est au cœur de la réponse, inclure **au moins une fois** une formulation explicite du secteur de vie ou de la coloration du signe (court). Ne noie pas ; la personne peut demander plus ensuite.
`
}

export function journalResponseModeUserHint(mode: JournalResponseMode): string {
  if (mode === 'exploratory') {
    return `**Mode exploratoire** : livre une réponse **touffue dès ce message** — **signes et maisons explicités** (sens du signe + secteur de vie de chaque maison citée) dans la première **Astrologie :**, puis voix planètes **sans redire** les mêmes définitions. Pas une amorce ni une 2e question nécessaire.`
  }
  if (mode === 'targeted') {
    return `**Mode ciblé** : réponse directe, plafond **4 tours**, pas de préface longue.`
  }
  return `**Mode messagerie** : réponse **synthétique et fragmentée** (3 à 5 tours), adaptée à un fil de discussion.`
}
