/**
 * Personnalité des bulles guilde (planète / signe) pour le journal pilote.
 * Le rendu visuel est dans `globals.css` (classes `.journal-guild-bubble*`).
 */

export type JournalBubbleKind =
  | 'narrator'
  | 'martial'
  | 'soft'
  | 'structural'
  | 'electric'
  | 'dream'
  | 'radiant'
  | 'expansive'
  | 'intense'
  | 'healer'
  | 'default'

function norm(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

/** Détecte le « ton » BD à partir du rôle (ex. « Mars (Natal… »). */
export function journalBubbleKindFromSpeaker(speaker: string | null | undefined): JournalBubbleKind {
  const raw = norm(String(speaker ?? ''))
  if (raw.startsWith('astrologie')) return 'narrator'

  const has = (...fragments: string[]) => fragments.some((f) => raw.includes(f))

  if (has('mars', 'belier', 'aries')) return 'martial'
  if (has('venus', 'balance', 'libra', 'taureau', 'taurus')) return 'soft'
  if (has('saturne', 'saturn', 'capricorne', 'capricorn', 'vierge', 'virgo')) return 'structural'
  if (has('uranus', 'mercure', 'mercury', 'gemeaux', 'gemini', 'verseau', 'aquarius')) return 'electric'
  if (has('pluton', 'pluto', 'scorpion', 'scorpio')) return 'intense'
  if (has('neptune', 'poissons', 'pisces', 'cancer', 'lune', 'moon')) return 'dream'
  if (has('soleil', 'sun', 'lion', 'leo')) return 'radiant'
  if (has('jupiter', 'sagittaire', 'sagittarius')) return 'expansive'
  if (has('chiron')) return 'healer'

  return 'default'
}

export function journalGuildBubbleFillIndex(colorIdx: number): number {
  return Math.abs(colorIdx | 0) % 6
}
