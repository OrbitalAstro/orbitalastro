/**
 * Détecte une demande de date concrète pour une lunaison (pleine / nouvelle lune),
 * éventuellement avec signe de la Lune (FR ou EN).
 */

export type JournalLunarIntent = {
  event: 'full_moon' | 'new_moon'
  /** Fragment brut pour l’API (ex. « scorpion », « scorpio »). */
  moon_sign?: string
  /** current = en cours / actuelle ; next = prochaine après l’instant de référence */
  timing: 'current' | 'next'
}

const FULL = /\bpleine\s+lune\b|\bfull\s+moon\b/i
const NEW = /\bnouvelle\s+lune\b|\bnew\s+moon\b/i

const CURRENT_TIMING =
  /\b(en cours|actuelle?s?|du moment|présente?s?|presente?s?|en ce moment|maintenant|aujourd'hui|aujourdhui|cette lune|cette pleine|cette nouvelle|lunaison actuelle|pleine lune actuelle|nouvelle lune actuelle)\b/i

/** « la lune » / « lune » sans pleine|nouvelle explicite — phase résolue côté API (prefer_current). */
const MOON_GENERAL = /\b(?:la\s+)?lune\b|\bmoon\b/i

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
  const vagueMoon = MOON_GENERAL.test(message)
  if (!wantsFull && !wantsNew && !vagueMoon) return null

  let moon_sign: string | undefined
  for (const frag of SIGN_FRAGMENTS) {
    if (t.includes(frag.toLowerCase())) {
      moon_sign = frag
      break
    }
  }

  const timing = CURRENT_TIMING.test(message) ? 'current' : 'next'

  return {
    event: wantsNew ? 'new_moon' : wantsFull ? 'full_moon' : 'new_moon',
    moon_sign,
    timing: vagueMoon && !wantsFull && !wantsNew ? 'current' : timing,
  }
}
