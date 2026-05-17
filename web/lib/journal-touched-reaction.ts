/**
 * Réaction « cœur » sur une bulle : la personne signale qu’elle est touchée / émue.
 * Le préfixe est reconnu par l’API pour adapter la réponse et la mémoire.
 */

export const JOURNAL_TOUCHED_MESSAGE_TAG = '[❤️ touchée]'

export const JOURNAL_TOUCHED_HEART_LABEL = 'Touchée'

export function journalTouchedBubbleMessage(speaker: string, body?: string): string {
  const role = speaker.split('(')[0]?.trim() || speaker.trim() || 'cette voix'
  const excerpt = (body || '').replace(/\s+/g, ' ').trim().slice(0, 120)
  const tail = excerpt.length >= 120 ? '…' : ''
  if (excerpt) {
    return `${JOURNAL_TOUCHED_MESSAGE_TAG} Ce que ${role} vient de dire m’a vraiment touchée : « ${excerpt}${tail} ».`
  }
  return `${JOURNAL_TOUCHED_MESSAGE_TAG} Ce que ${role} vient d’évoquer m’a vraiment touchée.`
}

export function isJournalTouchedReactionMessage(text: string): boolean {
  return String(text || '').trimStart().startsWith(JOURNAL_TOUCHED_MESSAGE_TAG)
}

/** Texte affiché dans la bulle « Toi » (sans le marqueur interne). */
export function journalTouchedReactionDisplayText(text: string): string {
  const raw = String(text || '').trim()
  if (!isJournalTouchedReactionMessage(raw)) return raw
  const body = raw.slice(JOURNAL_TOUCHED_MESSAGE_TAG.length).trim()
  return body ? `❤️ ${body}` : '❤️ Ce passage m’a touchée.'
}

/** Consigne ajoutée au prompt utilisateur (tour réaction cœur). */
export function journalTouchedReactionUserHint(): string {
  return `**RÉACTION CŒUR (priorité absolue)** : la personne vient de signaler qu’elle est **émue / touchée** par le passage qu’elle cite (cœur sur une bulle précise). Ce n’est **pas** une nouvelle question astro.
- Réponds en **une seule** ligne **Astrologie :** — **2 phrases maximum**, chaleureuses et sincères : accueille son émotion ; dis **clairement** que tu es **heureux·se / content·e** qu’elle ait été touchée (formulation naturelle, pas robotique).
- **Pas** de long développement astro ni de tour de table de planètes ; par défaut **Astrologie seule**.
- Montre que tu as compris **quoi** l’a touchée (un détail du passage cité), sans recopier toute la bulle.
- Si la mémoire indique comment l’accompagner quand elle est sensible, **respecte-la**.`
}
