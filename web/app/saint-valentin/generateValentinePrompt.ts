import type { Language } from '@/lib/i18n'

type PlanetKey = 'sun' | 'moon' | 'mercury' | 'venus' | 'mars'

type Planet = { sign: string; house: number; longitude: number }

type ChartData = {
  planets?: Partial<Record<PlanetKey, Planet>>
  ascendant?: number | { sign: string; longitude: number }
  houses?: Record<string, number>
}

export type ValentineContext = {
  language: Language
  youName?: string
  partnerName?: string
  relationshipContext?: string
  chartYou: ChartData
  chartPartner: ChartData
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

function planetLabel(planet: PlanetKey | 'ascendant', language: Language) {
  if (language === 'en') {
    const map: Record<string, string> = { sun: 'Sun', moon: 'Moon', mercury: 'Mercury', venus: 'Venus', mars: 'Mars', ascendant: 'Ascendant' }
    return map[planet]
  }
  if (language === 'es') {
    const map: Record<string, string> = { sun: 'Sol', moon: 'Luna', mercury: 'Mercurio', venus: 'Venus', mars: 'Marte', ascendant: 'Ascendente' }
    return map[planet]
  }
  const map: Record<string, string> = { sun: 'Soleil', moon: 'Lune', mercury: 'Mercure', venus: 'Vénus', mars: 'Mars', ascendant: 'Ascendant' }
  return map[planet]
}

function aspectLabel(aspect: 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition', language: Language) {
  if (language === 'en') {
    const map: Record<string, string> = {
      conjunction: 'conjunction',
      sextile: 'sextile',
      square: 'square',
      trine: 'trine',
      opposition: 'opposition',
    }
    return map[aspect]
  }
  if (language === 'es') {
    const map: Record<string, string> = {
      conjunction: 'conjunción',
      sextile: 'sextil',
      square: 'cuadratura',
      trine: 'trígono',
      opposition: 'oposición',
    }
    return map[aspect]
  }
  const map: Record<string, string> = {
    conjunction: 'conjonction',
    sextile: 'sextile',
    square: 'carré',
    trine: 'trigone',
    opposition: 'opposition',
  }
  return map[aspect]
}

function getAscendantLongitude(chart: ChartData) {
  const a = chart.ascendant
  if (typeof a === 'number') return normalizeDeg(a)
  if (a && typeof a === 'object' && typeof a.longitude === 'number') return normalizeDeg(a.longitude)
  return null
}

function getAscendantSign(chart: ChartData) {
  const a = chart.ascendant
  if (!a) return null
  if (typeof a === 'number') return longitudeToSignName(a)
  if (a && typeof a === 'object') {
    if (a.sign) return a.sign
    if (typeof a.longitude === 'number') return longitudeToSignName(a.longitude)
  }
  return null
}

function buildCuspsArray(houses: Record<string, number> | undefined) {
  if (!houses) return null
  const cusps: number[] = []
  for (let i = 1; i <= 12; i++) {
    const v = houses[String(i)]
    if (typeof v !== 'number' || !Number.isFinite(v)) return null
    cusps.push(normalizeDeg(v))
  }
  return cusps
}

function houseForLongitude(longitude: number, houses: Record<string, number> | undefined) {
  const cusps = buildCuspsArray(houses)
  if (!cusps) return null
  const lon = normalizeDeg(longitude)
  for (let i = 0; i < 12; i++) {
    const start = cusps[i]
    const next = cusps[(i + 1) % 12]
    const end = i === 11 ? cusps[0] + 360 : next <= start ? next + 360 : next
    const adj = lon < start ? lon + 360 : lon
    if (adj >= start && adj < end) return i + 1
  }
  return null
}

function angleDistance(a: number, b: number) {
  const d = Math.abs(normalizeDeg(a) - normalizeDeg(b))
  return Math.min(d, 360 - d)
}

const ASPECTS: Array<{ name: 'conjunction' | 'sextile' | 'square' | 'trine' | 'opposition'; deg: number; orb: number }> = [
  { name: 'conjunction', deg: 0, orb: 7 },
  { name: 'sextile', deg: 60, orb: 5 },
  { name: 'square', deg: 90, orb: 6 },
  { name: 'trine', deg: 120, orb: 6 },
  { name: 'opposition', deg: 180, orb: 7 },
]

function detectAspect(a: number, b: number) {
  const dist = angleDistance(a, b)
  const hit = ASPECTS.map((asp) => ({ asp, delta: Math.abs(dist - asp.deg) }))
    .filter((x) => x.delta <= x.asp.orb)
    .sort((x, y) => x.delta - y.delta)[0]
  if (!hit) return null
  return { aspect: hit.asp.name, closeness: hit.delta }
}

function getPlanet(chart: ChartData, key: PlanetKey) {
  const p = chart.planets?.[key]
  if (!p) return null
  if (typeof p.longitude !== 'number' || !Number.isFinite(p.longitude)) return null
  return p
}

function buildPlacements(chart: ChartData, language: Language) {
  const sun = getPlanet(chart, 'sun')
  const moon = getPlanet(chart, 'moon')
  const mercury = getPlanet(chart, 'mercury')
  const venus = getPlanet(chart, 'venus')
  const mars = getPlanet(chart, 'mars')
  const ascSign = getAscendantSign(chart)

  const lines: string[] = []
  const houseWord = language === 'fr' ? 'Maison' : language === 'es' ? 'Casa' : 'House'
  const fmtPlanet = (key: PlanetKey, p: Planet | null) => {
    if (!p) return
    lines.push(
      `- ${planetLabel(key, language)}: ${signLabel(p.sign || longitudeToSignName(p.longitude), language)} (${houseWord} ${p.house || '?'})`,
    )
  }
  fmtPlanet('sun', sun)
  fmtPlanet('moon', moon)
  if (ascSign) lines.push(`- ${planetLabel('ascendant', language)}: ${signLabel(ascSign, language)}`)
  fmtPlanet('mercury', mercury)
  fmtPlanet('venus', venus)
  fmtPlanet('mars', mars)
  return lines.join('\n')
}

function buildHouseOverlays(args: { chartYou: ChartData; chartPartner: ChartData; language: Language; partnerName: string }) {
  const { chartYou, chartPartner, language, partnerName } = args
  const list: string[] = []
  const targets: Array<{ who: 'you' | 'partner'; planet: PlanetKey | 'ascendant' }> = [
    { who: 'you', planet: 'sun' },
    { who: 'you', planet: 'moon' },
    { who: 'you', planet: 'venus' },
    { who: 'you', planet: 'mars' },
    { who: 'partner', planet: 'sun' },
    { who: 'partner', planet: 'moon' },
    { who: 'partner', planet: 'venus' },
    { who: 'partner', planet: 'mars' },
  ]

  for (const t of targets) {
    const sourceChart = t.who === 'you' ? chartYou : chartPartner
    const destChart = t.who === 'you' ? chartPartner : chartYou
    const lon =
      t.planet === 'ascendant'
        ? getAscendantLongitude(sourceChart)
        : (getPlanet(sourceChart, t.planet as PlanetKey)?.longitude ?? null)

    if (lon == null) continue
    const h = houseForLongitude(lon, destChart.houses)
    if (!h) continue
    const planet = planetLabel(t.planet as any, language)

    const phrase =
      t.who === 'you'
        ? language === 'en'
          ? `Your ${planet} falls in ${partnerName}'s House ${h}.`
          : language === 'es'
            ? `Tu ${planet} cae en la Casa ${h} de ${partnerName}.`
            : `Ta ${planet} tombe dans la maison ${h} de ${partnerName}.`
        : language === 'en'
          ? `${partnerName}'s ${planet} falls in your House ${h}.`
          : language === 'es'
            ? `El/la ${planet} de ${partnerName} cae en tu Casa ${h}.`
            : `La ${planet} de ${partnerName} tombe dans ta maison ${h}.`
    list.push(`- ${phrase}`)
  }

  return list.slice(0, 12).join('\n')
}

function buildAspects(args: { chartYou: ChartData; chartPartner: ChartData; language: Language; partnerName: string }) {
  const { chartYou, chartPartner, language, partnerName } = args
  const keys: Array<PlanetKey | 'ascendant'> = ['sun', 'moon', 'mercury', 'venus', 'mars', 'ascendant']

  const aspects: Array<{ text: string; closeness: number }> = []
  for (const aKey of keys) {
    const aLon = aKey === 'ascendant' ? getAscendantLongitude(chartYou) : getPlanet(chartYou, aKey as PlanetKey)?.longitude
    if (aLon == null) continue
    for (const bKey of keys) {
      const bLon = bKey === 'ascendant' ? getAscendantLongitude(chartPartner) : getPlanet(chartPartner, bKey as PlanetKey)?.longitude
      if (bLon == null) continue
      const hit = detectAspect(aLon, bLon)
      if (!hit) continue

      const aName = planetLabel(aKey as any, language)
      const bName = planetLabel(bKey as any, language)
      const asp = aspectLabel(hit.aspect, language)
      const line =
        language === 'en'
          ? `Your ${aName} is in ${asp} with ${partnerName}'s ${bName}.`
          : language === 'es'
            ? `Tu ${aName} está en ${asp} con el/la ${bName} de ${partnerName}.`
            : `Ton ${aName} est en ${asp} avec le/la ${bName} de ${partnerName}.`
      aspects.push({ text: `- ${line}`, closeness: hit.closeness })
    }
  }

  // Deduplicate identical lines and keep the closest ones
  const uniq = new Map<string, number>()
  for (const a of aspects) {
    const prev = uniq.get(a.text)
    if (prev == null || a.closeness < prev) uniq.set(a.text, a.closeness)
  }

  return Array.from(uniq.entries())
    .map(([text, closeness]) => ({ text, closeness }))
    .sort((a, b) => a.closeness - b.closeness)
    .slice(0, 14)
    .map((x) => x.text)
    .join('\n')
}

export function generateValentinePrompt(ctx: ValentineContext): { systemPrompt: string; userPrompt: string } {
  const language = ctx.language || 'fr'
  const youName = (ctx.youName || '').trim()
  const partnerName = (ctx.partnerName || '').trim() || (language === 'en' ? 'the other person' : language === 'es' ? 'la otra persona' : "l'autre personne")
  const relationshipContext = (ctx.relationshipContext || '').trim()

  const role =
    language === 'en'
      ? 'You are a psychological astrologer: nuanced, playful, and warm. Never fatalistic, never medical. You talk about tendencies, dynamics, and growth potential.'
      : language === 'es'
        ? 'Eres una astróloga psicológica, matizada y juguetona. Nunca fatalista, nunca médica. Hablas de tendencias, dinámicas y potencial de evolución.'
        : 'Tu es une astrologue psychologique, nuancée et ludique. Jamais fataliste, jamais médicale. Tu parles de tendances, de dynamiques et de potentiel d’évolution.'

  const address =
    language === 'en'
      ? `You address the reader as "you". The other person is named "${partnerName}". The anchor point is always "you": what you feel, what secures you, how you can communicate.`
      : language === 'es'
        ? `Te diriges a la persona que lee usando "tú". La otra persona se llama "${partnerName}". El punto de anclaje es siempre "tú": lo que sientes, lo que te da seguridad, cómo puedes comunicar.`
        : `Tu t’adresses à la personne qui lit en utilisant “tu”. L’autre personne s’appelle “${partnerName}”. Le point d’ancrage reste “tu” : ce que tu ressens, ce qui te sécurise, comment tu peux communiquer.`

  const rules =
    language === 'en'
      ? [
          '80% lived experience / 20% astrology.',
          'You may mention planets and houses, but immediately translate into concrete daily life.',
          'No degrees, no orbs, no technical aspect lists.',
          'No destiny language; avoid clichés like "soulmate".',
          'Default gender-neutral, always "you".',
        ].join('\n')
      : language === 'es'
        ? [
            '80% experiencia vivida / 20% astrología.',
            'Puedes nombrar planetas y casas, pero traduces de inmediato a lo cotidiano.',
            'Prohibido: grados, orbes y listas técnicas de aspectos.',
            'Nada de destino; evita clichés como "alma gemela".',
            'Género neutro por defecto; siempre "tú".',
          ].join('\n')
        : [
            '80% vécu / 20% astro.',
            'Tu peux nommer les planètes et les maisons, mais tu traduis immédiatement en vécu concret.',
            'Interdit : degrés, orbes, et liste d’aspects techniques.',
            'Pas de “destin” : évite les clichés (“âme sœur”, “destiné”).',
            'Genre neutre par défaut. Toujours “tu”.',
          ].join('\n')

  const structure =
    language === 'en'
      ? [
          'Mandatory structure:',
          '1) Punchy title (1 line): Valentine, playful, not cheesy.',
          '2) Mini intro (3–5 lines): why it helps + entertainment/free will disclaimer.',
          '3) The spark (3 bullet points): what attracts, what makes it click.',
          '4) What feels safe (3 bullet points): how love becomes reliable and tender.',
          '5) Cute frictions (3 bullet points): tensions + how to soften/transform them.',
          '6) Love manual (2 sections):',
          '   - "When you feel loved, it’s often when..."',
          `   - "When ${partnerName} feels loved, it’s often when..."`,
          '7) 3 ultra-concrete Valentine gestures (adapted to placements):',
          '   - 1 text message idea',
          '   - 1 activity idea',
          '   - 1 micro-ritual',
          '8) Orbital signature line (1–2 lines): cosmic, simple, memorable.',
        ].join('\n')
      : language === 'es'
        ? [
            'Estructura obligatoria:',
            '1) Título con gancho (1 línea): San Valentín, cómplice, no cursi.',
            '2) Mini intro (3–5 líneas): por qué sirve + aviso entretenimiento/libre albedrío.',
            '3) La química que se enciende (3 puntos): atracción, "clic".',
            '4) Lo que da seguridad (3 puntos): cómo el amor se vuelve fiable y tierno.',
            '5) Fricciones bonitas (3 puntos): tensiones + cómo transformarlas con suavidad.',
            '6) Manual de uso amoroso (2 secciones):',
            '   - "Cuando tú te sientes amado/a, suele ser cuando..."',
            `   - "Cuando ${partnerName} se siente amado/a, suele ser cuando..."`,
            '7) 3 gestos de San Valentín ultra concretos (según placements):',
            '   - 1 idea de mensaje',
            '   - 1 idea de actividad',
            '   - 1 micro-ritual',
            '8) Frase firma Orbital (1–2 líneas): cósmica, simple, memorable.',
          ].join('\n')
        : [
            'STRUCTURE OBLIGATOIRE (format St-Valentin) :',
            '1) Titre punché (1 ligne) : St-Valentin, complice, pas cucul.',
            '2) Mini-intro (3–5 lignes) : pourquoi c’est utile + rappel “divertissement / libre arbitre”.',
            '3) La chimie qui s’allume (3 points) : ce qui attire, ce qui fait “clic”.',
            '4) Ce qui sécurise (3 points) : comment l’amour devient fiable et tendre.',
            '5) Les frictions mignonnes (3 points) : tensions possibles + comment les transformer avec douceur.',
            '6) Mode d’emploi amoureux (2 sections) :',
            '   - “Quand toi tu te sens aimé(e), c’est souvent quand…”',
            `   - “Quand ${partnerName} se sent aimé(e), c’est souvent quand…”`,
            '7) 3 gestes St-Valentin ultra concrets (adaptés à vos placements) :',
            '   - 1 idée de texto',
            '   - 1 idée d’activité',
            '   - 1 micro-rituel relationnel',
            '8) Phrase-signature Orbital (1–2 lignes) : cosmique simple, complice, mémorable.',
          ].join('\n')

  const length =
    language === 'en'
      ? 'Length: 1600–1800 words.'
      : language === 'es'
        ? 'Longitud: 1600–1800 palabras.'
        : 'Longueur : 1600 à 1800 mots.'

  const systemPrompt = `[RÔLE]\n${role}\n\n[ADRESSE & POINT DE VUE]\n${address}\n\n[RÈGLES]\n${rules}\n\n[STRUCTURE]\n${structure}\n\n[LONGUEUR]\n${length}\n`

  const youPlacements = buildPlacements(ctx.chartYou, language)
  const partnerPlacements = buildPlacements(ctx.chartPartner, language)
  const overlays = buildHouseOverlays({ chartYou: ctx.chartYou, chartPartner: ctx.chartPartner, language, partnerName })
  const aspects = buildAspects({ chartYou: ctx.chartYou, chartPartner: ctx.chartPartner, language, partnerName })

  const header =
    language === 'en'
      ? 'Inputs (from the app)'
      : language === 'es'
        ? 'Entradas (de la app)'
        : 'ENTRÉES (fournies par l’app)'

  const youLabel = youName ? `${youName} (you)` : language === 'en' ? 'You (Person A)' : language === 'es' ? 'Tú (Persona A)' : 'Toi (Personne A)'
  const partnerLabel = `${partnerName} (${language === 'en' ? 'Person B' : language === 'es' ? 'Persona B' : 'Personne B'})`

  const relationshipBlock = relationshipContext
    ? language === 'en'
      ? `\n\nRelationship context (1–2 lines):\n${relationshipContext}`
      : language === 'es'
        ? `\n\nContexto de la relación (1–2 líneas):\n${relationshipContext}`
        : `\n\nContexte relationnel (1–2 lignes) :\n${relationshipContext}`
    : ''

  const userPrompt = `${header}\n\n${youLabel}:\n${youPlacements}\n\n${partnerLabel}:\n${partnerPlacements}${relationshipBlock}\n\n${
    overlays
      ? language === 'en'
        ? `\nHouse overlays (optional):\n${overlays}`
        : language === 'es'
          ? `\nSuperposiciones de casas (opcional):\n${overlays}`
          : `\nSuperpositions de maisons (optionnel) :\n${overlays}`
      : ''
  }\n\n${
    aspects
      ? language === 'en'
        ? `Major synastry aspects (optional, no degrees):\n${aspects}`
        : language === 'es'
          ? `Aspectos mayores de sinastría (opcional, sin grados):\n${aspects}`
          : `Aspects majeurs (optionnel, sans degrés) :\n${aspects}`
      : ''
  }\n\n${
    language === 'en'
      ? 'Write the Valentine synastry now, strictly following the mandatory structure.'
      : language === 'es'
        ? 'Escribe ahora la sinastría de San Valentín, siguiendo estrictamente la estructura obligatoria.'
        : 'Rédige maintenant la synastrie St-Valentin, en respectant strictement la structure obligatoire.'
  }`

  return { systemPrompt, userPrompt }
}
