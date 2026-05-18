/**
 * Membres de la guilde sélectionnables dans le fil (pastille « Autre voix »).
 */

export type JournalGuildMember = {
  id: string
  label: string
}

/** Planètes, points et angles — pas Astrologie (table déjà portée par ce rôle). */
export const JOURNAL_GUILD_VOICE_MEMBERS: readonly JournalGuildMember[] = [
  { id: 'soleil', label: 'Soleil' },
  { id: 'lune', label: 'Lune' },
  { id: 'mercure', label: 'Mercure' },
  { id: 'venus', label: 'Vénus' },
  { id: 'mars', label: 'Mars' },
  { id: 'jupiter', label: 'Jupiter' },
  { id: 'saturne', label: 'Saturne' },
  { id: 'uranus', label: 'Uranus' },
  { id: 'neptune', label: 'Neptune' },
  { id: 'pluton', label: 'Pluton' },
  { id: 'ascendant', label: 'Ascendant' },
  { id: 'descendant', label: 'Descendant' },
  { id: 'mc', label: 'Milieu du Ciel' },
  { id: 'ic', label: 'Imum Coeli' },
  { id: 'noeud-nord', label: 'Nœud nord' },
  { id: 'noeud-sud', label: 'Nœud sud' },
  { id: 'chiron', label: 'Chiron' },
  { id: 'lilith', label: 'Lilith' },
  { id: 'ceres', label: 'Cérès' },
  { id: 'pallas', label: 'Pallas' },
  { id: 'junon', label: 'Junon' },
  { id: 'vesta', label: 'Vesta' },
  { id: 'eris', label: 'Éris' },
  { id: 'vertex', label: 'Vertex' },
  { id: 'part-fortune', label: 'Part de Fortune' },
] as const

export function journalGuildMemberLabel(id: string): string {
  return JOURNAL_GUILD_VOICE_MEMBERS.find((m) => m.id === id)?.label ?? id
}
