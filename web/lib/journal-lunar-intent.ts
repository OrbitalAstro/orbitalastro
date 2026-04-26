/**
 * Détecte une demande de date concrète pour une lunaison (pleine / nouvelle lune),
 * éventuellement avec signe de la Lune (FR ou EN).
 */

export type JournalLunarIntent = {
  event: 'full_moon' | 'new_moon'
  /** Fragment brut pour l’API (ex. « scorpion », « scorpio »). */
  moon_sign?: string
}

const FULL = /\bpleine\s+lune\b|\bfull\s+moon\b/i
const NEW = /\bnouvelle\s+lune\b|\bnew\s+moon\b/i

/** Signes reconnus dans le texte (sous-chaîne). */
const SIGN_FRAGMENTS: readonly string[] = [
  'scorpion',
  'scorpio',
  'taureau',
  'taurus',
  'bélier',
  'belier',
  'aries',
  'gémeaux',
  'gemeaux',
  'gemini',
  'cancer',
  'lion',
  'leo',
  'vierge',
  'virgo',
  'balance',
  'libra',
  'sagittaire',
  'sagittarius',
  'capricorne',
  'capricorn',
  'verseau',
  'aquarius',
  'poissons',
  'pisces',
]

export function parseJournalLunarIntent(message: string): JournalLunarIntent | null {
  const t = message.trim().toLowerCase()
  if (!t) return null

  const wantsFull = FULL.test(message)
  const wantsNew = NEW.test(message)
  if (!wantsFull && !wantsNew) return null

  let moon_sign: string | undefined
  for (const frag of SIGN_FRAGMENTS) {
    if (t.includes(frag.toLowerCase())) {
      moon_sign = frag
      break
    }
  }

  return {
    event: wantsNew ? 'new_moon' : 'full_moon',
    moon_sign,
  }
}
