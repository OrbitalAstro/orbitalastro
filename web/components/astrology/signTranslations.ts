// Sign name translations for multi-language support

export const SIGN_NAMES_EN = [
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
]

export const SIGN_NAMES_FR: Record<string, string> = {
  Aries: 'Bélier',
  Taurus: 'Taureau',
  Gemini: 'Gémeaux',
  Cancer: 'Cancer',
  Leo: 'Lion',
  Virgo: 'Vierge',
  Libra: 'Balance',
  Scorpio: 'Scorpion',
  Sagittarius: 'Sagittaire',
  Capricorn: 'Capricorne',
  Aquarius: 'Verseau',
  Pisces: 'Poissons',
}

export const SIGN_NAMES_ES: Record<string, string> = {
  Aries: 'Aries',
  Taurus: 'Tauro',
  Gemini: 'Géminis',
  Cancer: 'Cáncer',
  Leo: 'Leo',
  Virgo: 'Virgo',
  Libra: 'Libra',
  Scorpio: 'Escorpio',
  Sagittarius: 'Sagitario',
  Capricorn: 'Capricornio',
  Aquarius: 'Acuario',
  Pisces: 'Piscis',
}

/**
 * Calculate zodiac sign from longitude in degrees
 */
export function signFromLongitude(longitude: number): string {
  const normalized = ((longitude % 360) + 360) % 360
  const index = Math.floor(normalized / 30) % 12
  return SIGN_NAMES_EN[index]
}

/**
 * Translate sign name to target language
 */
export function translateSign(sign: string, language: 'en' | 'fr' | 'es'): string {
  if (language === 'en') return sign
  if (language === 'fr') return SIGN_NAMES_FR[sign] || sign
  if (language === 'es') return SIGN_NAMES_ES[sign] || sign
  return sign
}



