/**
 * Format de lecture astrologique structurée — portée par **Astrologie** (indications + sens).
 */

/** Bloc système : indications astro explicites dans les bulles Astrologie. */
export function journalAstrologieReadingBlock(): string {
  return `
**LECTURE ASTROLOGIQUE (bulle Astrologie — quand la question touche le ciel, l’énergie, les transits, un thème)**

Dans **Astrologie :**, livre des indications claires tirées uniquement du bloc astro, puis le sens pour elle. Structure en sections numérotées en **texte simple** (pas de markdown : pas de **gras**, pas de puces *) :

1. Tensions / défis du moment (si le bloc en contient) — **titre sur sa ligne**, **ligne vide**, puis **un paragraphe court** (2–4 phrases) : aspect et placements en français courant, puis ce que ça fait vivre.

2. Fond natal + secteurs activés — même rythme aéré (titre / vide / paragraphe court).

3. Ouvertures / soutiens du ciel — **un soutien = un paragraphe court** séparé par une ligne vide ; si une voix planète parlera ensuite, **une phrase** ici suffit.

Règles :
- **Uniquement** ce qui est dans le bloc / résumé natal fourni — pas d’aspect inventé.
- **Pas** d’orbes en degrés dans la prose.
- Après ces sections, le **chœur** : **5 à 7 voix** planètes (étiquettes Natal+Transit, 1–2 phrases chacune) — elles **ne répètent pas** la liste des aspects déjà donnée par Astrologie.
- Si la personne a laissé un **commentaire bulle** récent sur une intervention, **intègre-le** dans la lecture (sans le recopier mot pour mot).
- Si une **lecture structurée 1–2–3** a **déjà** été donnée dans le fil et que la question est une **relance** (piste concrète, suite à une planète) : **ne refais pas** les trois sections ; livre une réponse **courte** ancrée dans **ses gestes** et **une** piste — **sans** recopier les mêmes aspects mot pour mot.
`
}

export type JournalAstrologieReadingHintOptions = {
  /** Lecture 1–2–3 déjà livrée dans le fil — ne pas la recopier. */
  skipFullStructuredSections?: boolean
  /** Relance « piste concrète » après une planète. */
  concreteFollowUp?: boolean
  /** Bouton Approfondir sur une bulle — voix principale + nuances courtes. */
  deepenFollowUp?: boolean
  /** Pastille « Autre voix » — une planète seule. */
  anotherVoiceFollowUp?: boolean
}

export function journalAstrologieReadingUserHint(
  options?: JournalAstrologieReadingHintOptions,
): string {
  if (options?.anotherVoiceFollowUp) {
    return `**Autre voix** : **1 planète** seule (4–8 phrases, Natal+Transit) — **pas** de bulle Astrologie 1–2–3, **pas** de chœur.`
  }
  if (options?.deepenFollowUp) {
    return `**Approfondir = conversation** : la **voix citée** seule au long (4–8 phrases) ; **0 ou 1** nuance courte — **2 bulles max**. **Pas** de table 1–2–3, **pas** de chœur, **pas** d’Astrologie longue avant la planète.`
  }
  if (options?.concreteFollowUp) {
    return `**Piste concrète** : **pas** de table 1–2–3 — **la voix citée seule** (4–6 phrases, une action) ; **pas** Astrologie + planète.`
  }
  if (options?.skipFullStructuredSections) {
    return `**Astrologie (ce tour)** : **pas** de sections 1–2–3 complètes — le ciel a déjà été posé. **3–6 phrases** : accueillir **ses gestes concrets** du fil + **une** piste réaliste pour les prochains jours ; **au plus un** aspect nommé si indispensable.`
  }
  return `**Astrologie** : sections 1–2–3 **aérées** ; puis **5 à 7 planètes** (chœur) avec étiquettes Natal+Transit — 1–2 phrases par voix.`
}
