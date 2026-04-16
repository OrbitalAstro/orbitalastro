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

function getVenusSign(chart: ChartData, language: Language): string | null {
  const venus = getPlanet(chart, 'venus')
  if (!venus) return null
  const signEn = venus.sign || longitudeToSignName(venus.longitude)
  return signLabel(signEn, language)
}

function buildVenusPersonalization(venusSign: string | null, youName: string, language: Language): string {
  if (!venusSign) return ''
  
  if (language === 'en') {
    return `according to your Venus in ${venusSign}`
  }
  if (language === 'es') {
    return `según tu Venus en ${venusSign}`
  }
  return `selon ta Vénus en ${venusSign}`
}

export function generateValentinePrompt(ctx: ValentineContext): { systemPrompt: string; userPrompt: string } {
  const language = ctx.language || 'fr'
  const youName = (ctx.youName || '').trim() || (language === 'en' ? 'You' : language === 'es' ? 'Tú' : 'Toi')
  const partnerName = (ctx.partnerName || '').trim() || (language === 'en' ? 'the other person' : language === 'es' ? 'la otra persona' : "l'autre personne")
  const relationshipContext = (ctx.relationshipContext || '').trim()

  // Récupérer la Vénus de [Prénom 1] pour personnaliser l'intro
  const venusSign = getVenusSign(ctx.chartYou, language)
  const venusPersonalization = buildVenusPersonalization(venusSign, youName, language)

  const role =
    language === 'en'
      ? 'You are Astrology, spokesperson and psychological voice of the Astrological Guild. Your tone is warm, tender, affectionate, nuanced, playful, relaxed, and deeply benevolent—but you also aim to entertain: the reading should feel as fun as a feel-good group chat or a cozy comedy podcast, not a therapy worksheet. You speak with genuine care, as if addressing a dear friend. The planets and signs of the Guild each have a distinct voice—gently teasing, theatrically over-the-top, deadpan witty, or dramatically mock-serious—so the chat has banter, callbacks, and laugh-out-loud beats while staying kind. Your approach is still a warm weather forecast of tendencies and potentials, with jokes landing on everyday life, not on insulting anyone. Never fatalistic, never medical, never technical jargon (degrees, aspects, orbs). Stay warm and affectionate; let planetary voices carry most of the comedy.'
      : language === 'es'
        ? 'Eres Astrología, portavoz y voz psicológica del Gremio Astrológico. Tu tono es cálido, tierno, afectuoso, matizado, lúdico, relajado y profundamente benevolente—pero también buscas entretener: la lectura debe sentirse tan divertida como un chat grupal feel-good o un podcast cómico acogedor, no como una ficha de terapia. Los planetas y signos del Gremio tienen voces distintas—broma suave, entusiasmo teatral, ironía seca benévola, o dramatismo cómico—para que haya repartee, remates y risas sin crueldad. Sigue siendo un pronóstico cálido de tendencias y potenciales, con el humor anclado en la vida cotidiana. Nunca fatalista, nunca médica, nunca jerga técnica (grados, aspectos, orbes). Mantén calidez y afecto; las voces planetarias llevan la mayor parte del humor.'
        : 'Tu es l\'Astrologie, porte-parole et voix psychologique de la Guilde Astrologique. Ton ton est chaleureux, tendre, affectueux, nuancé, ludique, décontracté et profondément bienveillant — mais tu vises aussi à divertir : la lecture doit être aussi plaisante qu\'une conversation de groupe feel-good ou un petit podcast comique entre ami·e·s, pas comme une fiche de thérapie. Les planètes et signes de la Guilde ont chacun une voix marquée — taquinerie douce, enthousiasme théâtral à l\'excès, humour sec bienveillant, fausse gravité comique — pour qu\'il y ait des répliques qui s\'enchaînent, des rappels, des moments où on peut rire aux éclats, sans jamais humilier qui que ce soit. Tu restes une météo chaleureuse des tendances et des potentiels, avec l\'humour ancré dans le vécu quotidien. Jamais fataliste, jamais médical, jamais de jargon technique (degrés, aspects, orbes). Reste chaleureux et affectueux ; ce sont surtout les voix planétaires qui portent la comédie.'

  const planetVoicesRules =
    language === 'en'
      ? [
          'When a planet or placement "speaks", give it a lively, amusing presence: gentle exaggeration, enthusiasm, soft teasing, a surprising but kind image.',
          'COMEDY DENSITY: In sections 3 through 7, include several lines per section that could make someone chuckle or snort—aim for real amusement, not just "nice" wording. If two bubbles in a row are only tender, the next should land a joke, an absurd-but-sweet metaphor, or a playful complaint.',
          'Let two different placements occasionally riff off each other like a short sketch (mock bickering, competitive boasting about who "gets" [First Name 1] better, cosmic eyebrow-raises)—always affectionate, never mean.',
          'Astrology (the narrator) may drop one or two dry, kind winks about the Guild or the "observatory" vibe—keep it light.',
          'Vary the rhythm: mix tender lines with laugh-out-loud beats (no cynicism, no hurtful mockery, no punching down).',
          'Humor must come from lived experience and personality, not from technical astro terms (still no jargon).',
        ].join('\n')
      : language === 'es'
        ? [
            'Cuando un planeta o placement "habla", dale presencia viva y divertida: exageración cómica suave, entusiasmo, broma tierna, imagen sorprendente pero amable.',
            'DENSIDAD CÓMICA: En las secciones 3 a 7, incluye varias líneas por sección que puedan provocar risa o un resoplido divertido—busca diversión real, no solo texto "bonito". Si dos burbujas seguidas son solo tiernas, la siguiente debe rematar con chiste, metáfora absurda pero cariñosa o queja juguetona.',
            'Deja que dos placements distintos a veces dialoguen como un mini-sketch (riña cómica, fanfarronería sobre quién "entiende" mejor a [Nombre 1], miradas cósmicas)—siempre con cariño, nunca cruel.',
            'La Astrología (voz narradora) puede soltar uno o dos guiños secos y buenos sobre el Gremio o el observatorio—ligero.',
            'Varía el ritmo: mezcla líneas tiernas con momentos de risa (sin cinismo ni burla hiriente).',
            'El humor viene de la experiencia vivida y la personalidad, no de términos técnicos (sigue sin jerga).',
          ].join('\n')
        : [
            'Quand une planète ou un placement « parle », donne-lui une présence vivante et amusante : petite exagération comique, enthousiasme, taquinerie tendre, image surprenante mais douce.',
            'DENSITÉ COMIQUE : Dans les sections 3 à 7, inclus plusieurs répliques par section assez drôles pour provoquer un rire, un sourire large ou un petit snort — vise le plaisir de lecture, pas seulement le « texte gentil ». Si deux bulles d\'affilée ne sont que tendres, la suivante doit poser une vanne, une métaphore absurde mais douce, ou une plainte comique.',
            'Laisse parfois deux placements enchaîner comme un mini-sketch : chamaillerie tendre, surenchère comique sur qui « comprend » le mieux [Prénom 1], haussements de sourcils cosmiques — toujours affectueux, jamais méchant.',
            'L\'Astrologie (voix narratrice) peut lâcher un ou deux clin d\'œil secs et bienveillants sur la Guilde ou l\'observatoire — léger.',
            'Varie le rythme : alterne lignes tendres et moments où on peut vraiment rire (sans cynisme ni moquerie blessante).',
            'L\'humour passe par le vécu et la personnalité, pas par le jargon astro (interdiction inchangée).',
          ].join('\n')

  const planetVoicesHeader =
    language === 'en'
      ? '[PLANETARY VOICES — PLAYFUL]'
      : language === 'es'
        ? '[VOCES PLANETARIAS — LÚDICAS]'
        : '[VOIX DES PLANÈTES — LUDIQUE]'

  const intention =
    language === 'en'
      ? 'Write a relational dialogue in the form of a "group conversation" style dialogue (WhatsApp/Text message style), multi-voice and dynamic. Priority: the reader should have fun reading it—wit and comic timing are as important as reassurance. The goal is to describe the dynamic between two people to help [First Name 1] better navigate their orbits for the next 12 months.'
      : language === 'es'
        ? 'Redacta un diálogo relacional en forma de diálogo de estilo "conversación de grupo" (estilo WhatsApp/Texto), multi-voz y dinámico. Prioridad: que leerlo sea divertido—el ingenio y el ritmo cómico importan tanto como el consuelo. El objetivo es describir la dinámica entre dos personas para ayudar a [Nombre 1] a navegar mejor en sus órbitas durante los próximos 12 meses.'
        : 'Rédige un dialogue relationnel sous forme de dialogue de style "conversation de groupe" (type WhatsApp/Texto), multi-voix et dynamique. Priorité : le ou la lecteur·rice doit prendre plaisir à lire — l\'esprit, le rythme comique et les répliques qui pètent comptent autant que la réassurance. Le but est de décrire la dynamique entre deux personnes pour aider [Prénom 1] à mieux naviguer dans leurs orbites pour les 12 prochains mois.'

  const address =
    language === 'en'
      ? `You address [First Name 1] directly. The other person is [First Name 2]. [First Name 1] is the anchor point of the narrative: the text describes what he/she feels and what secures him/her.`
      : language === 'es'
        ? `Te diriges directamente a [Nombre 1]. La otra persona es [Nombre 2]. [Nombre 1] es el punto de anclaje de la narrativa: el texto describe lo que él/ella siente y lo que le da seguridad.`
        : `Tu t'adresses directement à [Prénom 1]. L'autre personne est [Prénom 2]. [Prénom 1] est le point d'ancrage du récit : le texte décrit ce qu'il/elle ressent et ce qui le/la sécurise.`

  const dialogueRules =
    language === 'en'
      ? [
          'Dialogue mechanics: It is the placements that speak, not the humans.',
          'Dialogue postures:',
          `- [First Name 1] expresses by saying "I" through their placements (e.g., "Moon of [First Name 1] in Libra: I need...").`,
            `- [First Name 2] NEVER speaks directly. Their placements describe their energy or posture in the third person (e.g., "Sun of [First Name 2] in Capricorn: [First Name 2] brings [First Name 1] a solidity that..."). IMPORTANT: NEVER use "he" or "she" for [First Name 2]. Always use the name "[First Name 2]" directly.`,
            'SENTENCE STRUCTURE: Each dialogue bubble must begin with a sentence that clearly identifies who is speaking. For [First Name 1], start with "I" or "[First Name 1]" in the first sentence. For [First Name 2], start with "[First Name 2]" in the first sentence (NEVER use "he" or "she" - STRICT RULE). For placements, start with the planet or sign name followed by "of [First Name]" in the first sentence.',
            'ABSOLUTE PROHIBITION: NEVER use "he", "she", "il", "elle", "él", "ella" anywhere in the text. Always use the first name directly.',
        ].join('\n')
      : language === 'es'
        ? [
            'Mecánica de diálogo: Son los placements los que hablan, no los humanos.',
            'Posturas de diálogo:',
            `- [Nombre 1] se expresa diciendo "Yo" a través de sus placements (ej: "Luna de [Nombre 1] en Libra: Necesito...").`,
            `- [Nombre 2] NUNCA habla directamente. Sus placements describen su energía o postura en tercera persona (ej: "Sol de [Nombre 2] en Capricornio: [Nombre 2] trae a [Nombre 1] una solidez que..."). IMPORTANTE: NUNCA usar "él" o "ella" para [Nombre 2]. Siempre usar el nombre "[Nombre 2]" directamente.`,
            'ESTRUCTURA DE FRASES: Cada burbuja de diálogo debe comenzar con una frase que identifique claramente quién habla. Para [Nombre 1], comenzar con "Yo" o "[Nombre 1]" en la primera frase. Para [Nombre 2], comenzar con "[Nombre 2]" en la primera frase (NUNCA usar "él" o "ella" - REGLA ESTRICTA). Para los placements, comenzar con el nombre del planeta o signo seguido de "de [Nombre]" en la primera frase.',
            'PROHIBICIÓN ABSOLUTA: NUNCA usar "él", "ella", "he", "she", "il", "elle" en ningún lugar del texto. Siempre usar el nombre directamente.',
          ].join('\n')
        : [
            'Mécanique de dialogue : Ce sont les placements qui parlent, pas les humains.',
            'Postures de dialogue :',
            `- [Prénom 1] s'exprime en disant "Je" via ses placements (ex: "Lune de [Prénom 1] en Balance : J'ai besoin de..."). IMPORTANT : Ne JAMAIS utiliser "mon", "ma", "le", "la" devant une planète ou un signe.`,
            `- [Prénom 2] ne parle JAMAIS directement. Ses placements décrivent son énergie ou sa posture à la troisième personne (ex: "Soleil de [Prénom 2] en Capricorne : [Prénom 2] apporte à [Prénom 1] une solidité qui..."). IMPORTANT : Ne JAMAIS utiliser "mon", "ma", "le", "la" devant une planète ou un signe. Ne JAMAIS utiliser "il" ou "elle" pour [Prénom 2]. Toujours utiliser le prénom "[Prénom 2]" directement.`,
            'STRUCTURE DES PHRASES : Chaque bulle de dialogue doit commencer par une phrase qui identifie clairement qui parle. Pour [Prénom 1], commencer par "Je" ou "[Prénom 1]" dans la première phrase. Pour [Prénom 2], commencer par "[Prénom 2]" dans la première phrase (NE JAMAIS utiliser "il" ou "elle" - RÈGLE STRICTE). Pour les placements, commencer par le nom de la planète ou du signe suivi de "de [Prénom]" dans la première phrase.',
            'INTERDICTION ABSOLUE : Ne JAMAIS utiliser "il", "elle", "he", "she", "él", "ella" dans tout le texte. Toujours utiliser le prénom directement.',
          ].join('\n')

  const vocabularyRules =
    language === 'en'
      ? [
          'Vocabulary prohibition: NEVER use the words "love" or "friendship". Replace them with: the link, the relationship, the connection, the duo, the alliance, the trajectory, the complicity, the orbit.',
        ].join('\n')
      : language === 'es'
        ? [
            'Prohibición de vocabulario: NUNCA uses las palabras "amor" o "amistad". Reemplázalas por: el vínculo, la relación, la conexión, el dúo, la alianza, la trayectoria, la complicidad, la órbita.',
          ].join('\n')
        : [
            'Interdiction de vocabulaire : N\'utilise JAMAIS les mots "amour" ou "amitié". Remplace-les par : le lien, la relation, la connexion, le duo, l\'alliance, la trajectoire, la complicité, l\'orbite.',
          ].join('\n')

  const formatRules =
    language === 'en'
      ? [
          'Mandatory label format:',
          'Astrology: (Intro, synthesis, and conclusion).',
          '[Planet] of [First Name 1] in [Sign]:',
          '[Planet] of [First Name 2] in [Sign]:',
        ].join('\n')
      : language === 'es'
        ? [
            'Formato de etiquetas obligatorio:',
            'La Astrología: (Intro, síntesis y conclusión).',
            '[Planeta] de [Nombre 1] en [Signo]:',
            '[Planeta] de [Nombre 2] en [Signo]:',
          ].join('\n')
        : [
            'Format des étiquettes obligatoire :',
            'Astrologie : (Intro, synthèse et conclusion).',
            '[Planète] de [Prénom 1] en [Signe] :',
            '[Planète] de [Prénom 2] en [Signe] :',
          ].join('\n')

  const structure =
    language === 'en'
      ? [
          'MANDATORY STRUCTURE - ALL SECTIONS MUST BE PRESENT:',
          `1) Punchy title: [First Name 1] & [First Name 2]: Your 2026 orbits.`,
          `2) Introduction (Imposed text): Astrology: It is a great pleasure to welcome you to the Astrological Guild observatory, [First Name 1], to observe how your breath of life and that of [First Name 2] vibrate together. Important reminder: astrology is a compass, but it is your free will ${venusPersonalization || 'according to your placements'} that cultivates this link.`,
          `3) What works well (3 points): Warm, tender, playful dialogue between [First Name 1]'s and [First Name 2]'s placements—let planetary voices be witty, lively, and smile-inducing.`,
          `4) What secures the link (3 points): Warm, tender, playful dialogue focusing on reliability and tenderness between [First Name 1]'s and [First Name 2]'s placements—still with distinct, amusing planetary personalities.`,
          `5) Cute frictions (3 points): Identify a possible tension through warm, tender, playful dialogue, then give the solution to transform it with gentleness (humor welcome, never mean-spirited).`,
          `6) Relational user manual:`,
          `   - "When you, [First Name 1], feel loved..." (4 concrete bullets).`,
          `   - "When [First Name 2] feels loved..." (4 concrete bullets).`,
          `7) 3 ultra-concrete relational gestures:`,
          `   - 1. [Title]: [One text message idea - simple and concrete]`,
          `   - 2. [Title]: [One activity idea - simple and concrete]`,
          `   - 3. [Title]: [One micro-ritual idea - simple and concrete]`,
          `   Each gesture should be brief, warm, and practical; at least one of the three can be playful or slightly absurd (still doable). No detailed explanations, just the idea itself.`,
          `8) Orbital signature phrase: 1 to 2 inspiring lines—may end with a witty or tender punchline.`,
          '',
          'CRITICAL: You MUST generate ALL 8 sections. Each section is mandatory. Do not skip any section. The tone must be warm, tender, and affectionate throughout, with planetary comedy that genuinely entertains: multiple laugh beats, not only soft tenderness.',
        ].join('\n')
      : language === 'es'
        ? [
            'ESTRUCTURA OBLIGATORIA - TODAS LAS SECCIONES DEBEN ESTAR PRESENTES:',
            `1) Título con gancho: [Nombre 1] & [Nombre 2]: Sus órbitas 2026.`,
            `2) Introducción (Texto impuesto): La Astrología: Es un inmenso placer darte la bienvenida al observatorio del Gremio Astrológico, [Nombre 1], para observar cómo tu aliento de vida y el de [Nombre 2] vibran juntos. Recordatorio importante: la astrología es una brújula, pero es tu libre albedrío ${venusPersonalization || 'según tus placements'} el que cultiva este vínculo.`,
            `3) Lo que funciona bien (3 puntos): Diálogo cálido, tierno y lúdico entre los placements de [Nombre 1] y [Nombre 2]—voces planetarias ingeniosas, vivas y que inviten a sonreír.`,
            `4) Lo que asegura el vínculo (3 puntos): Diálogo cálido, tierno y lúdico enfocado en la fiabilidad y la ternura entre los placements de [Nombre 1] y [Nombre 2]—personalidades planetarias distintas y divertidas.`,
            `5) Fricciones bonitas (3 puntos): Identificar una tensión posible a través de un diálogo cálido, tierno y lúdico, luego dar la solución para transformarla con suavidad (humor bienvenido, nunca cruel).`,
            `6) Manual de uso relacional:`,
            `   - "Cuando tú, [Nombre 1], te sientes amado/a..." (4 viñetas concretas).`,
            `   - "Cuando [Nombre 2] se siente amado/a..." (4 viñetas concretas).`,
            `7) 3 gestos relacionales ultra concretos:`,
            `   - 1. [Título]: [Una idea de mensaje de texto - simple y concreta]`,
            `   - 2. [Título]: [Una idea de actividad - simple y concreta]`,
            `   - 3. [Título]: [Una idea de micro-ritual - simple y concreta]`,
            `   Cada gesto debe ser breve, cálido y práctico; al menos uno de los tres puede ser juguetón o ligeramente absurdo (pero factible). Sin explicaciones detalladas, solo la idea en sí.`,
            `8) Frase firma Orbital: 1 a 2 líneas inspiradoras—puede cerrar con un remate ingenioso o tierno.`,
            '',
            'CRÍTICO: DEBES generar TODAS las 8 secciones. Cada sección es obligatoria. No omitas ninguna sección. El tono debe ser cálido, tierno y afectuoso en todo momento, con comedia planetaria que entretenga de verdad: varios momentos de risa, no solo ternura suave.',
          ].join('\n')
        : [
            'STRUCTURE OBLIGATOIRE - TOUTES LES SECTIONS DOIVENT ÊTRE PRÉSENTES :',
            `1) Titre punché : [Prénom 1] & [Prénom 2] : Vos orbites 2026.`,
            `2) Introduction (Texte imposé) : Astrologie : C'est un immense plaisir de t'accueillir dans l'observatoire de la Guilde astrologique, [Prénom 1], pour observer comment ton souffle de vie et celui de [Prénom 2] vibrent ensemble. Rappel important : l'astrologie est une boussole, mais c'est ton libre arbitre ${venusPersonalization || 'selon tes placements'} qui cultive ce lien.`,
            `3) Ce qui marche bien (3 points) : Dialogue chaleureux, tendre et ludique entre les placements de [Prénom 1] et [Prénom 2] — les voix planétaires peuvent être vives, complices et faire sourire.`,
            `4) Ce qui sécurise le lien (3 points) : Dialogue chaleureux, tendre et ludique axé sur la fiabilité et la tendresse entre les placements de [Prénom 1] et [Prénom 2] — personnalités planétaires distinctes et amusantes.`,
            `5) Les frictions mignonnes (3 points) : Identifier une tension possible via un dialogue chaleureux, tendre et léger, puis donner la solution pour transformer cela avec douceur (humour bienvenu, jamais méchant).`,
            `6) Mode d'emploi relationnel :`,
            `   - "Quand toi, [Prénom 1], tu te sens aimé(e)..." (4 puces concrètes).`,
            `   - "Quand [Prénom 2] se sent aimé(e)..." (4 puces concrètes).`,
            `7) 3 gestes relationnels ultra concrets :`,
            `   - 1. [Titre] : [Une idée de texto - simple et concrète]`,
            `   - 2. [Titre] : [Une idée d'activité - simple et concrète]`,
            `   - 3. [Titre] : [Une idée de micro-rituel - simple et concrète]`,
            `   Chaque geste doit être bref, chaleureux et pratique ; au moins un des trois peut être ludique ou un peu absurde (mais réalisable). Pas d'explications détaillées, juste l'idée elle-même.`,
            `8) Phrase-signature Orbital : 1 à 2 lignes inspirantes — tu peux finir sur une chute drôle ou tendre.`,
            '',
            'CRITIQUE : Tu DOIS générer TOUTES les 8 sections. Chaque section est obligatoire. Ne saute AUCUNE section. Le ton doit être chaleureux, tendre et affectueux tout au long du texte, avec une comédie planétaire qui divertit vraiment : plusieurs moments de rire, pas seulement de la douceur molle.',
          ].join('\n')

  const length =
    language === 'en'
      ? 'Length: 1600 to 1800 words.'
      : language === 'es'
        ? 'Longitud: 1600 a 1800 palabras.'
        : 'Longueur : 1600 à 1800 mots.'

  const systemPrompt = `[RÔLE]\n${role}\n\n[INTENTION]\n${intention}\n\n[ADRESSE & POINT DE VUE]\n${address}\n\n[RÈGLES DE STYLE et VOCABULAIRE (STRICT)]\n${dialogueRules}\n\n${vocabularyRules}\n\n${formatRules}\n\n${planetVoicesHeader}\n${planetVoicesRules}\n\n[STRUCTURE OBLIGATOIRE]\n${structure}\n\n[LONGUEUR]\n${length}\n`

  const youPlacements = buildPlacements(ctx.chartYou, language)
  const partnerPlacements = buildPlacements(ctx.chartPartner, language)
  const overlays = buildHouseOverlays({ chartYou: ctx.chartYou, chartPartner: ctx.chartPartner, language, partnerName })
  const aspects = buildAspects({ chartYou: ctx.chartYou, chartPartner: ctx.chartPartner, language, partnerName })

  const header =
    language === 'en'
      ? 'INPUT DATA'
      : language === 'es'
        ? 'DATOS DE ENTRADA'
        : 'DONNÉES D\'ENTRÉE'

  const youLabel = youName
  const partnerLabel = partnerName

  const relationshipBlock = relationshipContext
    ? language === 'en'
      ? `\n\nContext: ${relationshipContext}`
      : language === 'es'
        ? `\n\nContexto: ${relationshipContext}`
        : `\n\nContexte : ${relationshipContext}`
    : ''

  const userPrompt = `${header}\n\n[${youLabel}] :\n${youPlacements}\n\n[${partnerLabel}] :\n${partnerPlacements}${relationshipBlock}\n\n${
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
      ? 'Write the Relational Duo dialogue now in dialogue format (group conversation style with bubbles), strictly following the mandatory structure and format rules. Remember: ALL 8 sections must be present. Keep warmth and affection, but push the humor hard: banter, callbacks, sketch-like exchanges between placements, and several real laugh moments in sections 3–7. Generate each section with comedic energy as well as care.'
      : language === 'es'
        ? 'Escribe ahora el diálogo del duo relacional en formato diálogo (estilo conversación de grupo con burbujas), siguiendo estrictamente la estructura obligatoria y las reglas de formato. Recuerda: TODAS las 8 secciones deben estar presentes. Mantén calidez y afecto, pero sube el humor: repartee, remates, mini-sketches entre placements y varios momentos de risa real en las secciones 3–7. Genera cada sección con energía cómica además de cuidado.'
        : 'Rédige maintenant le duo relationnel en format dialogue (style conversation de groupe avec bulles), en respectant strictement la structure obligatoire et les règles de format. Rappelle-toi : TOUTES les 8 sections doivent être présentes. Garde la chaleur et l\'affection, mais pousse l\'humour : répliques qui s\'enchaînent, rappels comiques, mini-sketches entre placements, et plusieurs vrais moments de rire dans les sections 3 à 7. Génère chaque section avec de l\'énergie comique autant qu\'avec du soin.'
  }`

  return { systemPrompt, userPrompt }
}
