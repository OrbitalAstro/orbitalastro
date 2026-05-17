/**
 * Suggestions cliquables pour le Journal pilote (démarrage et relances).
 */

export type JournalChatSuggestion = {
  id: string
  label: string
  message: string
}

/** Fil vide — ouvrir une première question. */
export const JOURNAL_STARTER_SUGGESTIONS: readonly JournalChatSuggestion[] = [
  {
    id: 'lunar-phase',
    label: 'Phase lunaire actuelle',
    message:
      'Quelle phase lunaire est en cours pour moi (nouvelle ou pleine lune, passage de la Lune), et qu’est-ce qu’elle active dans mon thème ?',
  },
  {
    id: 'transits-week',
    label: 'Transits de la semaine',
    message: 'Quels transits me touchent le plus en ce moment, et sur quels secteurs de ma vie ?',
  },
  {
    id: 'energy-today',
    label: 'Énergie du jour',
    message: 'Où en est mon énergie aujourd’hui d’après le ciel et mon thème natal ?',
  },
  {
    id: 'timing',
    label: 'Quand / pic',
    message: 'Y a-t-il un pic d’énergie ou un passage important à venir pour moi dans les prochaines semaines ?',
  },
  {
    id: 'theme-natal',
    label: 'Un thème de ma carte',
    message: 'Éclaire-moi sur un fil rouge de mon thème natal que je devrais mieux comprendre en ce moment.',
  },
  {
    id: 'relational',
    label: 'Vénus & relationnel',
    message: 'Comment Vénus et mon secteur relationnel me parlent en ce moment dans mon thème ?',
  },
]

export const JOURNAL_SUGGESTION_PILL_CLASS =
  'rounded-full border border-cosmic-gold/35 bg-cosmic-purple/25 px-3 py-1.5 text-[13px] leading-snug text-cosmic-gold/90 transition hover:border-cosmic-gold/55 hover:bg-cosmic-gold/10 disabled:cursor-not-allowed disabled:opacity-50'

export const JOURNAL_DEEPEN_LABEL = 'Approfondir'
export const JOURNAL_CONCRETE_PATH_LABEL = 'Piste concrète'

/** Relance sur le message de la personne. */
export function journalDeepenUserBubbleMessage(content: string): string {
  const excerpt = content.replace(/\s+/g, ' ').trim().slice(0, 100)
  const tail = excerpt.length >= 100 ? '…' : ''
  return excerpt
    ? `Peux-tu approfondir ce que je viens de poser (« ${excerpt}${tail} ») avec des pistes plus concrètes pour ma vie ?`
    : 'Peux-tu approfondir ce que je viens de poser avec des pistes plus concrètes pour ma vie ?'
}

/** Relance sur une idée-suggestion (pastille). */
export function journalDeepenSuggestionMessage(suggestion: JournalChatSuggestion): string {
  return `Peux-tu approfondir ce thème (« ${suggestion.label} ») : ${suggestion.message}`
}

/** Piste concrète ciblée sur une bulle (voix + extrait). */
export function journalConcretePathBubbleMessage(speaker: string, body?: string): string {
  const role = speaker.split('(')[0]?.trim() || speaker.trim() || 'cette voix'
  const excerpt = (body || '').replace(/\s+/g, ' ').trim().slice(0, 100)
  if (excerpt) {
    const tail = excerpt.length >= 100 ? '…' : ''
    return `À partir de ce que ${role} vient d’évoquer (« ${excerpt}${tail} »), donne-moi une piste concrète et réaliste pour les prochains jours.`
  }
  return `À partir de ce que ${role} vient d’évoquer, donne-moi une piste concrète et réaliste pour les prochains jours.`
}

/** Message de relance ciblé sur une bulle (voix + extrait). */
export function journalDeepenBubbleMessage(speaker: string, body?: string): string {
  const role = speaker.split('(')[0]?.trim() || speaker.trim() || 'cette voix'
  const excerpt = (body || '').replace(/\s+/g, ' ').trim().slice(0, 100)
  if (excerpt) {
    const tail = excerpt.length >= 100 ? '…' : ''
    return `Peux-tu approfondir ce que ${role} vient d’évoquer (« ${excerpt}${tail} »), avec un angle concret pour ma vie quotidienne ?`
  }
  return `Peux-tu approfondir ce que ${role} vient d’évoquer, avec un angle concret pour ma vie quotidienne ?`
}

/** Fil en cours — approfondir ou changer d’angle. */
export const JOURNAL_FOLLOWUP_SUGGESTIONS: readonly JournalChatSuggestion[] = [
  {
    id: 'another-voice',
    label: 'Autre voix',
    message: 'Une autre planète ou point de ma carte pourrait-elle commenter autrement ?',
  },
  {
    id: 'weeks-ahead',
    label: 'Prochaines semaines',
    message: 'Et pour les deux à quatre prochaines semaines, qu’est-ce qui change ou se tend ?',
  },
  {
    id: 'clarify',
    label: 'Reformuler',
    message: 'Reformule ce que tu viens de dire en plus simple, sans jargon astrologique.',
  },
]

export function journalSuggestionsForThread(messageCount: number): readonly JournalChatSuggestion[] {
  return messageCount === 0 ? JOURNAL_STARTER_SUGGESTIONS : JOURNAL_FOLLOWUP_SUGGESTIONS
}

export function journalSuggestionsSectionTitle(messageCount: number): string {
  return messageCount === 0 ? 'Idées pour commencer' : 'Pour poursuivre'
}
