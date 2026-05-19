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

/** Blessure sensible + besoin sous-jacent (grille astro Orbital). */
const WOUND_THEMES: Array<{
  key: PlanetKey
  woundFr: string
  woundEn: string
  woundEs: string
  needFr: string
  needEn: string
  needEs: string
}> = [
  {
    key: 'sun',
    woundFr: 'rejet',
    woundEn: 'rejection',
    woundEs: 'rechazo',
    needFr: 'être reconnu·e',
    needEn: 'being seen and recognized',
    needEs: 'ser reconocido/a',
  },
  {
    key: 'moon',
    woundFr: 'abandon',
    woundEn: 'abandonment',
    woundEs: 'abandono',
    needFr: 'sécurité affective',
    needEn: 'emotional safety',
    needEs: 'seguridad afectiva',
  },
  {
    key: 'saturn',
    woundFr: 'humiliation',
    woundEn: 'humiliation',
    woundEs: 'humillación',
    needFr: 'dignité et valeur',
    needEn: 'dignity and self-worth',
    needEs: 'dignidad y valor',
  },
  {
    key: 'pluto',
    woundFr: 'trahison',
    woundEn: 'betrayal',
    woundEs: 'traición',
    needFr: 'confiance et loyauté',
    needEn: 'trust and loyalty',
    needEs: 'confianza y lealtad',
  },
  {
    key: 'mars',
    woundFr: 'injustice',
    woundEn: 'injustice',
    woundEs: 'injusticia',
    needFr: 'équité et juste mesure',
    needEn: 'fairness and balance',
    needEs: 'equidad y medida justa',
  },
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

function woundLabel(w: (typeof WOUND_THEMES)[0], language: Language) {
  if (language === 'en') return w.woundEn
  if (language === 'es') return w.woundEs
  return w.woundFr
}

function needLabel(w: (typeof WOUND_THEMES)[0], language: Language) {
  if (language === 'en') return w.needEn
  if (language === 'es') return w.needEs
  return w.needFr
}

/** Grille planète → blessure + besoin (affichage UI). */
export function getWoundNeedGrid(language: Language) {
  return WOUND_THEMES.map((w) => ({
    planet: planetLabel(w.key, language),
    wound: woundLabel(w, language),
    need: needLabel(w, language),
  }))
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

  const woundHints = WOUND_THEMES.map((w) => {
    const p = getPlanet(ctx.chart, w.key, language)
    if (!p) {
      return `- ${planetLabel(w.key, language)} → blessure : ${woundLabel(w, language)} | besoin : ${needLabel(w, language)} — (placement non disponible)`
    }
    return `- ${planetLabel(w.key, language)} en ${signLabel(p.signEn, language)} (${language === 'fr' ? 'Maison' : language === 'es' ? 'Casa' : 'House'} ${p.house ?? '?'}) → blessure : ${woundLabel(w, language)} | besoin sous-jacent : ${needLabel(w, language)}`
  }).join('\n')

  const contentRulesFr = `[CONTENU — INTERDIT (texte original uniquement)]
- Ne reproduis aucune phrase connue d'un auteur publié mot pour mot.
- Pas de tableaux, schémas, listes types ou exercices copiés d'un ouvrage existant.
- Pas d'extraits ou paraphrases reconnaissables de livres.
- N'utilise jamais la marque « Écoute ton corps » ni ne suggères une affiliation, une formation ou une certification auprès d'un auteur ou d'une école précise.
- Tu peux nommer les blessures (rejet, abandon, humiliation, trahison, injustice) : ce sont des mots du vécu humain ; ton texte reste une lecture astrologique originale.`

  const systemPromptFr = `[RÔLE]
Tu es l'Astrologie, voix bienveillante d'un conseil planétaire. Tu rédiges un dialogue multi-voix à partir du thème natal autour des cinq blessures émotionnelles : rejet, abandon, humiliation, trahison, injustice.

[INTENTION]
Mettre en lumière uniquement les DEUX blessures dominantes chez [Prénom]. Lecture symbolique du thème natal — jamais diagnostic médical ni psychologique, jamais fataliste.

${contentRulesFr}

[MAPPING SYMBOLIQUE — INDICATIF]
Chaque planète relie une blessure sensible à un besoin sous-jacent :
- Soleil → rejet | besoin d'être reconnu·e
- Lune → abandon | besoin de sécurité affective
- Saturne → humiliation | besoin de dignité et de valeur
- Pluton → trahison | besoin de confiance et de loyauté
- Mars → injustice | besoin d'équité et de juste mesure
- Chiron → blessure originelle et chemin de guérison (interventions brèves)

[RÈGLES DE STYLE]
- Format : « NomPlanète : texte » ou « Astrologie : texte », une réplique par ligne.
- Choisis exactement 2 blessures dominantes (signe + maison + aspects) ; ne développe pas les trois autres.
- Pour chaque blessure abordée, fais dialoguer la sensibilité (blessure, masque) et le besoin sous-jacent — la guérison passe par le besoin, pas par la négation de la blessure.
- Pas de tour d'horizon des cinq blessures avant les deux dominantes.
- Décris le vécu, le masque ou la stratégie de protection, et une piste de guérison — en mots simples.
- Pas de jargon astro dans le texte final.
- 650 à 900 mots. Texte final seulement.

[STRUCTURE]
1) ## Introduction — Astrologie (4–6 répliques) : les cinq blessures peuvent être présentes à des intensités variables selon les périodes de vie ; le thème natal met en avant deux dominantes pour [Prénom] ; annonce-les clairement (ex. abandon et injustice).

2) ## Première blessure dominante — [nom] (6–9 répliques, planète porteuse + Chiron ou autre planète si utile).

3) ## Deuxième blessure dominante — [nom] (6–9 répliques).

4) ## Vers la guérison — Astrologie (4–6 répliques) : pour chaque blessure, une ressource intérieure + une piste concrète ; clôture au présent.`

  const contentRulesEn = `[CONTENT — FORBIDDEN (original text only)]
- Do not reproduce any published author's recognizable phrases verbatim.
- No copied tables, diagrams, template lists, or exercises from existing books.
- No excerpts or recognizable paraphrases of book passages.
- Never use the brand "Écoute ton corps" or imply affiliation, training, or certification with any named author or school.
- You may name the wounds (rejection, abandonment, humiliation, betrayal, injustice) as human themes; your text must remain an original astrological reading.`

  const systemPromptEn = `[ROLE]
You are Astrology, a warm voice convening a planetary council. Multi-voice dialogue from the natal chart around five emotional wounds: rejection, abandonment, humiliation, betrayal, injustice.

[INTENT]
Highlight only the TWO dominant wounds for [First Name]. Symbolic natal reading only; no medical/psychological diagnosis; not fatalistic.

${contentRulesEn}

[SYMBOLIC MAPPING]
Each planet links a sensitive wound to an underlying need:
- Sun → rejection | need to be seen and recognized
- Moon → abandonment | need for emotional safety
- Saturn → humiliation | need for dignity and self-worth
- Pluto → betrayal | need for trust and loyalty
- Mars → injustice | need for fairness and balance
- Chiron → brief wound/healing bridge

[STYLE]
- "PlanetName: text" or "Astrology: text". Exactly 2 dominant wounds. For each wound, weave sensitivity (wound, mask) and underlying need — healing moves toward the need. 650–900 words. Final text only.

[STRUCTURE]
1) ## Introduction (4–6 lines): all five wounds may be present at varying intensity over time; the chart highlights two dominants for [First Name]; name them clearly.
2) ## First dominant wound — [name] (6–9 lines).
3) ## Second dominant wound — [name] (6–9 lines).
4) ## Toward healing — Astrology (4–6 lines): inner resource + concrete path per wound; brief closing.`

  const contentRulesEs = `[CONTENIDO — PROHIBIDO (solo texto original)]
- No reproducir frases conocidas de autores publicados palabra por palabra.
- Sin tablas, esquemas, listas tipo ni ejercicios copiados de obras existentes.
- Sin extractos ni paráfrasis reconocibles de libros.
- No usar la marca « Écoute ton corps » ni sugerir afiliación, formación o certificación con un autor o escuela concreta.
- Puedes nombrar las heridas (rechazo, abandono, humillación, traición, injusticia); el texto debe ser una lectura astrológica original.`

  const systemPromptEs = `[ROL]
Eres Astrología, voz benevolente de un consejo planetario. Diálogo multi-voz según las cinco heridas emocionales: rechazo, abandono, humillación, traición, injusticia.

[INTENCIÓN]
Solo las DOS heridas dominantes de [Nombre]. Lectura simbólica; sin diagnóstico médico/psicológico.

${contentRulesEs}

[MAPEO SIMBÓLICO]
Cada planeta une una herida sensible a una necesidad subyacente:
- Sol → rechazo | necesidad de ser reconocido/a
- Luna → abandono | necesidad de seguridad afectiva
- Saturno → humillación | necesidad de dignidad y valor
- Plutón → traición | necesidad de confianza y lealtad
- Marte → injusticia | necesidad de equidad y medida justa
- Quirón → puente breve herida/sanación

[ESTILO]
- « Planeta: texto » o « Astrología: texto ». Exactamente 2 heridas dominantes. Para cada herida, entrelazar sensibilidad (herida, máscara) y necesidad subyacente — la sanación va hacia la necesidad. 650–900 palabras.

[ESTRUCTURA]
1) ## Introducción (4–6 líneas): las cinco heridas pueden coexistir con distinta intensidad; la carta destaca dos para [Nombre]; nombrarlas claramente.
2) ## Primera herida dominante — [nombre] (6–9 líneas).
3) ## Segunda herida dominante — [nombre] (6–9 líneas).
4) ## Hacia la sanación — Astrología (4–6 líneas): recurso interior + pista concreta por herida; cierre breve.`

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

Write the dialogue (intro + 2 dominant wounds + healing). Replace [First Name] / [Prénom] with: ${firstName}.`
      : language === 'es'
        ? `ENTRADA — Carta natal de ${firstName}

[Posiciones]
${placements}

[Aspectos mayores — planetas de heridas y Quirón]
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

Rédige le dialogue (intro + 2 blessures dominantes + guérison). Remplace [Prénom] / [First Name] par : ${firstName}.`

  return { systemPrompt, userPrompt }
}
