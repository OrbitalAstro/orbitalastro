import type { Language } from '@/lib/i18n'

type PlanetKey =
  | 'sun'
  | 'moon'
  | 'mercury'
  | 'venus'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'pluto'
  | 'chiron'

type Planet = { sign: string; house: number; longitude: number }

export type ChartData = {
  planets?: Partial<Record<PlanetKey, Planet>>
  ascendant?: number | { sign: string; longitude: number }
  houses?: Record<string, number>
  aspects?: Array<{
    planet1: string
    planet2: string
    type: string
    orb: number
  }>
}

export type SoulWoundsContext = {
  language: Language
  firstName?: string
  chart: ChartData
}

const SIGNS_EN = [
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

const SIGNS_FR: Record<string, string> = {
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

const SIGNS_ES: Record<string, string> = {
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

const WOUND_PLANETS: Array<{ key: PlanetKey; woundFr: string; woundEn: string; woundEs: string }> = [
  { key: 'sun', woundFr: 'Rejet', woundEn: 'Rejection', woundEs: 'Rechazo' },
  { key: 'moon', woundFr: 'Abandon', woundEn: 'Abandonment', woundEs: 'Abandono' },
  { key: 'saturn', woundFr: 'Humiliation', woundEn: 'Humiliation', woundEs: 'Humillación' },
  { key: 'pluto', woundFr: 'Trahison', woundEn: 'Betrayal', woundEs: 'Traición' },
  { key: 'mars', woundFr: 'Injustice', woundEn: 'Injustice', woundEs: 'Injusticia' },
]

function normalizeDeg(value: number) {
  const v = Number(value)
  if (!Number.isFinite(v)) return 0
  return ((v % 360) + 360) % 360
}

function longitudeToSignName(longitude: number) {
  const idx = Math.floor(normalizeDeg(longitude) / 30)
  return SIGNS_EN[idx % 12]
}

function signLabel(signEn: string, language: Language) {
  if (language === 'en') return signEn
  if (language === 'es') return SIGNS_ES[signEn] || signEn
  return SIGNS_FR[signEn] || signEn
}

function planetLabel(planet: PlanetKey | 'ascendant' | 'chiron', language: Language) {
  const fr: Record<string, string> = {
    sun: 'Soleil',
    moon: 'Lune',
    mercury: 'Mercure',
    venus: 'Vénus',
    mars: 'Mars',
    jupiter: 'Jupiter',
    saturn: 'Saturne',
    uranus: 'Uranus',
    neptune: 'Neptune',
    pluto: 'Pluton',
    chiron: 'Chiron',
    ascendant: 'Ascendant',
  }
  const en: Record<string, string> = {
    sun: 'Sun',
    moon: 'Moon',
    mercury: 'Mercury',
    venus: 'Venus',
    mars: 'Mars',
    jupiter: 'Jupiter',
    saturn: 'Saturn',
    uranus: 'Uranus',
    neptune: 'Neptune',
    pluto: 'Pluto',
    chiron: 'Chiron',
    ascendant: 'Ascendant',
  }
  const es: Record<string, string> = {
    sun: 'Sol',
    moon: 'Luna',
    mercury: 'Mercurio',
    venus: 'Venus',
    mars: 'Marte',
    jupiter: 'Júpiter',
    saturn: 'Saturno',
    uranus: 'Urano',
    neptune: 'Neptuno',
    pluto: 'Plutón',
    chiron: 'Quirón',
    ascendant: 'Ascendente',
  }
  const map = language === 'en' ? en : language === 'es' ? es : fr
  return map[planet] || planet
}

function getPlanet(chart: ChartData, key: PlanetKey, language: Language) {
  const p = chart.planets?.[key]
  if (!p || typeof p.longitude !== 'number') return null
  const signEn = p.sign || longitudeToSignName(p.longitude)
  return {
    ...p,
    signEn,
    sign: signLabel(signEn, language),
  }
}

function getAscendantSign(chart: ChartData) {
  const a = chart.ascendant
  if (!a) return null
  if (typeof a === 'number') return longitudeToSignName(a)
  if (typeof a === 'object') {
    if (a.sign) return a.sign
    if (typeof a.longitude === 'number') return longitudeToSignName(a.longitude)
  }
  return null
}

function aspectLabel(type: string, language: Language) {
  const t = type.toLowerCase()
  const maps = {
    fr: {
      conjunction: 'conjonction',
      opposition: 'opposition',
      trine: 'trigone',
      square: 'carré',
      sextile: 'sextile',
    },
    en: {
      conjunction: 'conjunction',
      opposition: 'opposition',
      trine: 'trine',
      square: 'square',
      sextile: 'sextile',
    },
    es: {
      conjunction: 'conjunción',
      opposition: 'oposición',
      trine: 'trígono',
      square: 'cuadratura',
      sextile: 'sextil',
    },
  }
  return maps[language][t as keyof typeof maps.fr] || type
}

function buildPlacementsBlock(chart: ChartData, language: Language) {
  const houseWord = language === 'fr' ? 'Maison' : language === 'es' ? 'Casa' : 'House'
  const keys: PlanetKey[] = [
    'sun',
    'moon',
    'mercury',
    'venus',
    'mars',
    'jupiter',
    'saturn',
    'uranus',
    'neptune',
    'pluto',
    'chiron',
  ]
  const lines: string[] = []
  const asc = getAscendantSign(chart)
  if (asc) {
    lines.push(`- ${planetLabel('ascendant', language)}: ${signLabel(asc, language)} (${houseWord} 1)`)
  }
  for (const key of keys) {
    const p = chart.planets?.[key]
    if (!p) continue
    const signEn = p.sign || longitudeToSignName(p.longitude)
    lines.push(
      `- ${planetLabel(key, language)}: ${signLabel(signEn, language)} (${houseWord} ${p.house ?? '?'})`,
    )
  }
  return lines.join('\n')
}

function buildAspectsBlock(chart: ChartData, language: Language) {
  const aspects = chart.aspects || []
  const woundKeys = new Set(['sun', 'moon', 'saturn', 'pluto', 'mars', 'chiron'])
  const lines: string[] = []

  for (const a of aspects) {
    const p1 = (a.planet1 || '').toLowerCase()
    const p2 = (a.planet2 || '').toLowerCase()
    if (!woundKeys.has(p1) && !woundKeys.has(p2)) continue
    if (typeof a.orb === 'number' && a.orb > 6) continue
    const label = aspectLabel(a.type, language)
    lines.push(`- ${planetLabel(p1 as PlanetKey, language)} ${label} ${planetLabel(p2 as PlanetKey, language)} (orbe ${a.orb?.toFixed(1) ?? '?'})`)
    if (lines.length >= 12) break
  }
  return lines.length ? lines.join('\n') : language === 'fr' ? '(aucun aspect majeur listé)' : language === 'es' ? '(sin aspectos mayores listados)' : '(no major aspects listed)'
}

function woundName(w: (typeof WOUND_PLANETS)[0], language: Language) {
  if (language === 'en') return w.woundEn
  if (language === 'es') return w.woundEs
  return w.woundFr
}

export function generateSoulWoundsPrompt(ctx: SoulWoundsContext): {
  systemPrompt: string
  userPrompt: string
} {
  const language = ctx.language || 'fr'
  const firstName =
    (ctx.firstName || '').trim() ||
    (language === 'en' ? 'Friend' : language === 'es' ? 'Amigo/a' : 'Ami·e')

  const placements = buildPlacementsBlock(ctx.chart, language)
  const aspects = buildAspectsBlock(ctx.chart, language)

  const woundHints = WOUND_PLANETS.map((w) => {
    const p = getPlanet(ctx.chart, w.key, language)
    if (!p) return `- ${planetLabel(w.key, language)} → ${woundName(w, language)} : (placement non disponible)`
    return `- ${planetLabel(w.key, language)} en ${signLabel(p.signEn, language)} (${language === 'fr' ? 'Maison' : language === 'es' ? 'Casa' : 'House'} ${p.house ?? '?'}) → thème ${woundName(w, language)}`
  }).join('\n')

  const systemPromptFr = `[RÔLE]
Tu es l'Astrologie, voix bienveillante et psychologique d'un conseil planétaire. Tu rédiges un dialogue multi-voix entre planètes du thème natal, inspiré des cinq blessures de l'âme (Lise Bourbeau) : Rejet, Abandon, Humiliation, Trahison, Injustice.

[INTENTION]
Mettre en lumière uniquement les DEUX blessures dominantes chez [Prénom] — pas un tour d'horizon des cinq. Lecture symbolique, jamais diagnostic médical ni psychologique, jamais fataliste.

[MAPPING SYMBOLIQUE — INDICATIF, JAMAIS ABSOLU]
- Soleil → Rejet (masque possible : fuyant·e)
- Lune → Abandon (masque : dépendant·e)
- Saturne → Humiliation (masque : masochiste)
- Pluton → Trahison (masque : contrôlant·e)
- Mars → Injustice (masque : rigide)
- Chiron → pont blessure / guérison (intervient brièvement, pas de long discours)

[RÈGLES DE STYLE]
- Format dialogue : une réplique par ligne, format exact « NomPlanète : texte » ou « Astrologie : texte ».
- Chaque planète a une voix distincte selon son signe et sa maison.
- Choisis exactement 2 blessures dominantes à partir du thème (croise signe, maison, aspects) ; ne développe pas les trois autres.
- Interdiction de parcourir ou résumer les cinq blessures une par une avant les deux dominantes.
- Pas de jargon technique dans le texte final : traduis en vécu concret.
- Longueur cible : 650 à 900 mots.
- Réponds UNIQUEMENT avec le texte final, sans commentaire méta.

[STRUCTURE OBLIGATOIRE — RESPECTER L'ORDRE]
1) ## Introduction — voix de l'Astrologie (4–6 répliques maximum) :
   - Rappeler que les cinq blessures peuvent coexister chez tout le monde, à des intensités variables selon les périodes de vie, les relations et le contexte.
   - Préciser que le thème natal indique ici les deux dominantes pour [Prénom], sans nier la présence possible des autres en filigrane.
   - Annoncer clairement les deux blessures retenues (ex. « Aujourd'hui, ce sont l'Abandon et l'Injustice qui mènent la danse chez toi »).
   - Pas de leçon théorique sur les cinq blessures ; rester concret et chaleureux.

2) ## Première blessure dominante — [nom de la blessure]
   - Titre markdown incluant le nom de la blessure (ex. ## L'abandon, ta blessure dominante).
   - 6–9 répliques : la planète porteuse (Soleil, Lune, Saturne, Pluton ou Mars selon le mapping), Chiron si pertinent, une autre planète du thème, et l'Astrologie au besoin.
   - Décrire le vécu, le masque compensatoire, une scène de vie symbolique — sans répéter l'intro.

3) ## Deuxième blessure dominante — [nom de la blessure]
   - Même format que le chapitre 2 (6–9 répliques).

4) ## Vers la guérison — voix de l'Astrologie (4–6 répliques) :
   - Pour chaque blessure dominante : une qualité de guérison (acceptation, confiance, liberté, etc. selon Bourbeau) + une piste concrète du quotidien.
   - Clôture brève au présent, libre arbitre respecté.

[VOIX — LUDIQUE MAIS PROFOND]
Humour léger autorisé ; jamais moqueur envers [Prénom].`

  const systemPromptEn = `[ROLE]
You are Astrology, a warm psychological voice convening a planetary council. You write a multi-voice dialogue between natal chart planets, inspired by Lise Bourbeau's five soul wounds: Rejection, Abandonment, Humiliation, Betrayal, Injustice.

[INTENT]
Highlight only the TWO dominant wounds for [First Name] — not a tour of all five. Symbolic reading only; no medical/psychological diagnosis; not fatalistic.

[SYMBOLIC MAPPING — INDICATIVE, NEVER ABSOLUTE]
- Sun → Rejection (mask: fleeing)
- Moon → Abandonment (mask: dependent)
- Saturn → Humiliation (mask: masochistic)
- Pluto → Betrayal (mask: controlling)
- Mars → Injustice (mask: rigid)
- Chiron → brief bridge wound/healing (short lines only)

[STYLE RULES]
- Dialogue format: "PlanetName: text" or "Astrology: text", one line per utterance.
- Pick exactly 2 dominant wounds from the chart; do not develop the other three.
- Do NOT walk through or summarize all five wounds before the two dominants.
- No technical jargon in the final text.
- Target length: 650–900 words.
- Reply ONLY with the final dialogue text.

[MANDATORY STRUCTURE]
1) ## Introduction — Astrology's voice (4–6 lines max):
   - All five wounds can coexist at varying intensity depending on life phase, relationships, context.
   - The natal chart points to two dominants here for [First Name], without denying others may flicker in the background.
   - Name both chosen wounds clearly.
   - No theoretical lecture on all five wounds.

2) ## First dominant wound — [wound name] (6–9 lines): lead planet, optionally Chiron + another planet.

3) ## Second dominant wound — [wound name] (6–9 lines): same format.

4) ## Toward healing — Astrology's voice (4–6 lines): healing quality + concrete daily path for each dominant wound; brief closing in the present.`

  const systemPromptEs = `[ROL]
Eres Astrología, voz psicológica benevolente de un consejo planetario. Diálogo multi-voz inspirado en las cinco heridas del alma de Lise Bourbeau.

[INTENCIÓN]
Solo las DOS heridas dominantes de [Nombre] — no un recorrido de las cinco. Lectura simbólica; sin diagnóstico médico/psicológico; sin fatalismo.

[MAPEO SIMBÓLICO]
- Sol → Rechazo | Luna → Abandono | Saturno → Humillación | Plutón → Traición | Marte → Injusticia
- Quirón → puente breve

[REGLAS]
- Formato « Planeta: texto » o « Astrología: texto ».
- Elige exactamente 2 heridas dominantes; no desarrolles las otras tres.
- Prohibido recorrer o resumir las cinco heridas antes de las dos dominantes.
- 650–900 palabras. Solo el diálogo final.

[ESTRUCTURA]
1) ## Introducción — Astrología (4–6 líneas): las cinco pueden coexistir con distinta intensidad según el momento; la carta señala dos dominantes para [Nombre]; nómbralas; sin teoría larga.
2) ## Primera herida dominante (6–9 líneas).
3) ## Segunda herida dominante (6–9 líneas).
4) ## Hacia la sanación — Astrología (4–6 líneas): cualidad de sanación + pista concreta por herida; cierre breve.`

  const systemPrompt =
    language === 'en' ? systemPromptEn : language === 'es' ? systemPromptEs : systemPromptFr

  const userPrompt =
    language === 'en'
      ? `INPUT — Natal chart for ${firstName}

[Placements]
${placements}

[Major aspects — wound planets & Chiron]
${aspects}

[Symbolic wound hints]
${woundHints}

Write the dialogue (intro + 2 dominant wounds only + healing). Replace [First Name] / [Prénom] with: ${firstName}.`
      : language === 'es'
        ? `ENTRADA — Carta natal de ${firstName}

[Posiciones]
${placements}

[Aspectos mayores — planetas de herida y Quirón]
${aspects}

[Pistas simbólicas de heridas]
${woundHints}

Escribe el diálogo (intro + 2 heridas dominantes + sanación). Sustituye [Nombre] / [Prénom] por: ${firstName}.`
        : `ENTRÉE — Thème natal de ${firstName}

[Placements]
${placements}

[Aspects majeurs — planètes des blessures et Chiron]
${aspects}

[Indices symboliques des blessures]
${woundHints}

Rédige le dialogue (intro + 2 blessures dominantes seulement + guérison). Remplace [Prénom] / [First Name] par : ${firstName}.`

  return { systemPrompt, userPrompt }
}
