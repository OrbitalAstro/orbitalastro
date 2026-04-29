/**
 * Glyphes planètes / signes pour le fil journal (rôles « Soleil : », « Astrologie : », etc.).
 */

function normKey(s: string): string {
  return s
    .trim()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

function firstToken(s: string): string {
  const t = s.trim().split(/\s+/)[0] || ''
  return normKey(t)
}

/** Clés = premier mot du rôle, sans accents, minuscules. */
const GLYPHS: Record<string, string> = {
  // Planètes (FR + EN)
  soleil: '☉',
  sun: '☉',
  lune: '☽',
  moon: '☽',
  mercure: '☿',
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  jupiter: '♃',
  saturne: '♄',
  saturn: '♄',
  uranus: '♅',
  neptune: '♆',
  pluton: '♇',
  pluto: '♇',
  chiron: '⚷',
  lilith: '⚸',

  // Signes (FR sans accents)
  belier: '♈',
  taureau: '♉',
  gemeaux: '♊',
  cancer: '♋',
  lion: '♌',
  vierge: '♍',
  balance: '♎',
  scorpion: '♏',
  sagittaire: '♐',
  capricorne: '♑',
  verseau: '♒',
  poissons: '♓',

  // Signes EN
  aries: '♈',
  taurus: '♉',
  gemini: '♊',
  leo: '♌',
  virgo: '♍',
  libra: '♎',
  scorpio: '♏',
  sagittarius: '♐',
  capricorn: '♑',
  aquarius: '♒',
  pisces: '♓',

  // Spéciaux
  astrologie: '✶',
  guilde: '✦',
  toi: '◉',
}

export function glyphForJournalSpeaker(speaker: string): string {
  const raw = speaker.trim()
  if (!raw) return ''

  const token = firstToken(raw)
  if (GLYPHS[token]) return GLYPHS[token]

  const full = normKey(raw.replace(/\s+/g, ' '))
  if (full.includes('milieu') && full.includes('ciel')) return 'MC'
  if (token === 'asc' || full.startsWith('ascendant')) return 'Asc'
  if (full.startsWith('descendant')) return 'Dsc'
  if (full.includes('noeud') && full.includes('nord')) return '☊'
  if (full.includes('noeud') && full.includes('sud')) return '☋'

  return ''
}
