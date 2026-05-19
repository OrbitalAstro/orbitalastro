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
  planets?: Partial<Record<PlanetKey | 'true_node', Planet>>
  ascendant?: number | { sign: string; longitude: number }
  midheaven?: number | { sign: string; longitude: number }
  houses?: Record<string, number>
  aspects?: Array<{
    planet1: string
    planet2: string
    type: string
    orb: number
  }>
}

export type FamilyLineageContext = {
  language: Language
  firstName?: string
  chart: ChartData
}

/** Thèmes symboliques filiation / transgénération (lecture astro, pas psychothérapie). */
const LINEAGE_THEMES: Array<{
  key: PlanetKey | 'true_node'
  themeFr: string
  themeEn: string
  themeEs: string
  resourceFr: string
  resourceEn: string
  resourceEs: string
}> = [
  {
    key: 'moon',
    themeFr: 'appartenance, mémoire du clan, besoin de racine',
    themeEn: 'belonging, clan memory, need for roots',
    themeEs: 'pertenencia, memoria del clan, necesidad de raíz',
    resourceFr: 'se nourrir et nourrir sans se dissoudre',
    resourceEn: 'nourish and be nourished without losing yourself',
    resourceEs: 'nutrir y dejarse nutrir sin disolverse',
  },
  {
    key: 'saturn',
    themeFr: 'loyautés invisibles, dettes, lois et devoirs familiaux',
    themeEn: 'invisible loyalties, debts, family laws and duties',
    themeEs: 'lealtades invisibles, deudas, leyes y deberes familiares',
    resourceFr: 'structurer sa vie sans porter tout le poids du clan',
    resourceEn: 'structure your life without carrying the whole clan’s weight',
    resourceEs: 'estructurar la vida sin cargar todo el peso del clan',
  },
  {
    key: 'pluto',
    themeFr: 'secrets, honte transmise, pouvoir tabou dans la lignée',
    themeEn: 'secrets, transmitted shame, taboo power in the lineage',
    resourceFr: 'nommer avec douceur ce qui était caché',
    resourceEn: 'name gently what was hidden',
    resourceEs: 'nombrar con suavidad lo que estaba oculto',
  },
  {
    key: 'neptune',
    themeFr: 'frontières floues, sacrifice, idéal du sauveur ou du martyr',
    themeEn: 'blurred boundaries, sacrifice, savior or martyr ideal',
    resourceFr: 'clarté et limites affectives saines',
    resourceEn: 'clarity and healthy emotional limits',
    resourceEs: 'claridad y límites afectivos sanos',
  },
  {
    key: 'chiron',
    themeFr: 'blessure répétée, « ce qui ne guérit pas » dans la lignée',
    themeEn: 'repeated wound, “what won’t heal” in the lineage',
    resourceFr: 'transformer la douleur en sens et en soin choisi',
    resourceEn: 'turn pain into meaning and chosen care',
    resourceEs: 'transformar el dolor en sentido y cuidado elegido',
  },
  {
    key: 'true_node',
    themeFr: 'axe filiation ↔ chemin personnel (quitter / honorer)',
    themeEn: 'filiation axis ↔ personal path (leaving / honoring)',
    resourceFr: 'honorer ses racines tout en choisissant sa direction',
    resourceEn: 'honor your roots while choosing your direction',
    resourceEs: 'honrar las raíces eligiendo tu dirección',
  },
]

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

const LINEAGE_PLANET_KEYS = new Set([
  'moon',
  'saturn',
  'pluto',
  'neptune',
  'chiron',
  'sun',
  'mars',
  'true_node',
])

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

function planetLabel(planet: string, language: Language) {
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
    true_node: 'Nœud nord',
    ascendant: 'Ascendant',
    imum_coeli: 'Imum Coeli',
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
    true_node: 'North Node',
    ascendant: 'Ascendant',
    imum_coeli: 'Imum Coeli',
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
    true_node: 'Nodo norte',
    ascendant: 'Ascendente',
    imum_coeli: 'Imum Coeli',
  }
  const map = language === 'en' ? en : language === 'es' ? es : fr
  return map[planet] || planet
}

function getPlanet(chart: ChartData, key: PlanetKey | 'true_node', language: Language) {
  const p = chart.planets?.[key]
  if (!p || typeof p.longitude !== 'number') return null
  const signEn = p.sign || longitudeToSignName(p.longitude)
  return { ...p, signEn, sign: signLabel(signEn, language) }
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

function themeLabel(row: (typeof LINEAGE_THEMES)[0], language: Language) {
  if (language === 'en') return row.themeEn
  if (language === 'es') return row.themeEs
  return row.themeFr
}

function resourceLabel(row: (typeof LINEAGE_THEMES)[0], language: Language) {
  if (language === 'en') return row.resourceEn
  if (language === 'es') return row.resourceEs
  return row.resourceFr
}

/** Grille planète → thème transgénérationnel + ressource (affichage UI). */
export function getFamilyLineageThemeGrid(language: Language) {
  return LINEAGE_THEMES.map((w) => ({
    planet: planetLabel(w.key, language),
    theme: themeLabel(w, language),
    resource: resourceLabel(w, language),
  }))
}

function buildPlacementsBlock(chart: ChartData, language: Language) {
  const houseWord = language === 'fr' ? 'Maison' : language === 'es' ? 'Casa' : 'House'
  const keys: (PlanetKey | 'true_node')[] = [
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
    'true_node',
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
    const house = p.house ?? '?'
    const inFourth = house === 4 ? ' — **foyer / lignée (M.4)**' : ''
    lines.push(
      `- ${planetLabel(key, language)}: ${signLabel(signEn, language)} (${houseWord} ${house})${inFourth}`,
    )
  }
  const fourthHousePlanets = keys.filter((k) => chart.planets?.[k]?.house === 4)
  if (fourthHousePlanets.length > 0) {
    const list = fourthHousePlanets.map((k) => planetLabel(k, language)).join(', ')
    lines.push(
      language === 'fr'
        ? `- **Corps en maison 4 (foyer / ancêtres)** : ${list}`
        : language === 'es'
          ? `- **Cuerpos en casa 4 (hogar / ancestros)** : ${list}`
          : `- **Bodies in 4th house (home / ancestors)** : ${list}`,
    )
  }
  return lines.join('\n')
}

function buildAspectsBlock(chart: ChartData, language: Language) {
  const aspects = chart.aspects || []
  const lines: string[] = []

  for (const a of aspects) {
    const p1 = (a.planet1 || '').toLowerCase()
    const p2 = (a.planet2 || '').toLowerCase()
    if (!LINEAGE_PLANET_KEYS.has(p1) && !LINEAGE_PLANET_KEYS.has(p2)) continue
    if (typeof a.orb === 'number' && a.orb > 6) continue
    const label = aspectLabel(a.type, language)
    lines.push(
      `- ${planetLabel(p1, language)} ${label} ${planetLabel(p2, language)} (orbe ${a.orb?.toFixed(1) ?? '?'})`,
    )
    if (lines.length >= 14) break
  }
  return lines.length
    ? lines.join('\n')
    : language === 'fr'
      ? '(aucun aspect majeur listé pour la filiation)'
      : language === 'es'
        ? '(sin aspectos mayores listados para la filiación)'
        : '(no major lineage aspects listed)'
}

function buildLineageHints(chart: ChartData, language: Language) {
  const houseWord = language === 'fr' ? 'Maison' : language === 'es' ? 'Casa' : 'House'
  return LINEAGE_THEMES.map((w) => {
    const p = getPlanet(chart, w.key, language)
    const theme = themeLabel(w, language)
    const resource = resourceLabel(w, language)
    if (!p) {
      return `- ${planetLabel(w.key, language)} → ${theme} | ressource : ${resource} — (placement non disponible)`
    }
    return `- ${planetLabel(w.key, language)} en ${p.sign} (${houseWord} ${p.house ?? '?'}) → ${theme} | ressource : ${resource}`
  }).join('\n')
}

export function generateFamilyLineagePrompt(ctx: FamilyLineageContext): {
  systemPrompt: string
  userPrompt: string
} {
  const language = ctx.language || 'fr'
  const firstName =
    (ctx.firstName || '').trim() ||
    (language === 'en' ? 'Friend' : language === 'es' ? 'Amigo/a' : 'Ami·e')

  const placements = buildPlacementsBlock(ctx.chart, language)
  const aspects = buildAspectsBlock(ctx.chart, language)
  const lineageHints = buildLineageHints(ctx.chart, language)

  const contentRulesFr = `[CONTENU — INTERDIT (texte original uniquement)]
- Ne reproduis aucune phrase connue d'un auteur publié mot pour mot (constellations familiales, psychogénéalogie, transgénérationnel).
- Pas d'exercices, rituels, phrases-types ou « ordres de constellation » copiés d'une méthode nommée (ex. Hellinger, Ancelin Schützenberger, etc.).
- Ne prétends pas être thérapeute, constellationniste, psychogénéalogiste ni guérisseur ; pas de diagnostic familial ni de « vérité » sur des ancêtres réels non mentionnés.
- Pas d'invitation à couper les liens, à blâmer un parent, à « libérer » par la force, ni de fatalisme (« tu es condamné·e à répéter… »).
- Tu peux évoquer filiation, loyautés, secrets, dettes symboliques, honneur des ancêtres : lecture **astrologique symbolique** originale Orbital Astro.`

  const systemPromptFr = `[RÔLE]
Tu es l'Astrologie, voix bienveillante d'un conseil planétaire. Tu rédiges un dialogue multi-voix inspiré des thèmes de **constellation familiale**, **psychogénéalogie** et **transgénérationnel** — **uniquement** à partir du thème natal fourni (pas d'histoire familiale inventée).

[INTENTION]
Mettre en lumière **deux fils transgénérationnels dominants** chez [Prénom] : ce qui se répète, ce qui demande d'être vu, et une piste d'intégration **au présent**. Lecture symbolique du ciel — jamais diagnostic médical ou psychologique, jamais thérapie de groupe, jamais certitude sur des faits familiaux non donnés.

${contentRulesFr}

[CADRE SYMBOLIQUE — INDICATIF]
- **Lune** → appartenance, mémoire du clan, besoin de racine | ressource : se nourrir sans se dissoudre
- **Saturne** → loyautés invisibles, dettes, lois familiales | ressource : structurer sans tout porter
- **Pluton** → secrets, honte transmise, pouvoir tabou | ressource : nommer avec douceur
- **Neptune** → frontières floues, sacrifice, idéal du sauveur | ressource : clarté et limites
- **Chiron** → blessure répétée dans la lignée | ressource : sens et soin choisi
- **Nœud nord** → axe filiation ↔ chemin personnel | ressource : honorer et choisir sa direction
- **Maison 4** et corps qui s'y trouvent → foyer intérieur, racines, ancêtres (symbolique)
- **Soleil / Mars** en M.4 ou en aspect serré à Lune/Saturne → peuvent nuancer le fil dominant

[RÈGLES DE STYLE]
- Format : « NomPlanète : texte » ou « Astrologie : texte », une réplique par ligne.
- Choisis **exactement 2** fils dominants (signe + maison + aspects) ; ne développe pas tous les thèmes à égalité.
- Voix possibles : Astrologie, Lune, Saturne, Pluton, Neptune, Chiron, Nœud nord — **3 à 5 voix** au total selon pertinence ; pas de tour d'horizon de toutes les planètes.
- **Ton** : respectueux des ancêtres et des parents (archétypes), sans accusation ; la personne **choisit** ce qu'elle porte ou dépose — pas de culpabilité.
- Pas de jargon astro dans le texte final (pas « trigone », « maison IV ») : traduis en vécu humain (foyer, clan, dette, secret, appartenance).
- **Interdit** : parler au nom d'un ancêtre décédé comme si tu le connaissais ; inventer guerres, migrations, traumatismes ou noms de famille.
- 700 à 950 mots. Texte final seulement (markdown ## pour les titres de section).

[STRUCTURE]
1) ## Introduction — Astrologie (4–6 répliques) : le thème comme **carte des loyautés et des transmissions** (pas une séance de constellation) ; plusieurs fils peuvent coexister ; annonce clairement les **deux dominants** pour [Prénom].

2) ## Premier fil — [nom court du thème, ex. « Loyauté et poids du clan »] (7–10 répliques : Astrologie + 2–3 planètes pertinentes).

3) ## Deuxième fil — [nom court] (7–10 répliques).

4) ## Honorer et choisir — Astrologie (5–7 répliques) : une ressource par fil ; **1 à 2 gestes concrets** symboliques (rituel doux, parole, limite, acte de soin) **sans** copier une méthode publiée ; rappel que la personne reste libre et que ce n'est pas un avis thérapeutique.`

  const contentRulesEn = `[CONTENT — FORBIDDEN (original text only)]
- Do not reproduce recognizable phrases from published authors (family constellations, psychogenealogy, transgenerational work).
- No copied exercises, rituals, or "constellation orders" from a named method (e.g. Hellinger, Ancelin Schützenberger).
- Do not claim to be a therapist, facilitator, or healer; no family diagnosis; no invented facts about real ancestors.
- No urging to cut ties, blame a parent, or "force release"; not fatalistic.
- Filiation, loyalties, secrets, symbolic debts, honoring ancestors: **original symbolic astrological** reading only.`

  const systemPromptEn = `[ROLE]
You are Astrology, a warm voice convening a planetary council. Multi-voice dialogue on **family constellation**, **psychogenealogy**, and **transgenerational** themes — **only** from the natal chart provided (do not invent family history).

[INTENT]
Highlight **two dominant transgenerational threads** for [First Name]: what repeats, what asks to be seen, and a path of **present-moment** integration. Symbolic reading only; no medical/psychological diagnosis; no group therapy.

${contentRulesEn}

[SYMBOLIC FRAME]
- Moon → belonging, clan memory, roots | resource: nourish without dissolving
- Saturn → invisible loyalties, debts, family laws | resource: structure without carrying everything
- Pluto → secrets, transmitted shame, taboo power | resource: gentle naming
- Neptune → blurred boundaries, sacrifice, savior ideal | resource: clarity and limits
- Chiron → repeated lineage wound | resource: meaning and chosen care
- North Node → filiation vs personal path | resource: honor roots, choose direction
- 4th house bodies → home, roots, ancestors (symbolic)

[STYLE]
- "PlanetName: text" or "Astrology: text". Exactly **2** dominant threads. 3–5 voices total. Respectful of ancestors/parents as archetypes; no blame. No astro jargon in final text. 700–950 words. Final text only.

[STRUCTURE]
1) ## Introduction (4–6 lines): chart as map of loyalties/transmissions; name **two dominants** for [First Name].
2) ## First thread — [short name] (7–10 lines).
3) ## Second thread — [short name] (7–10 lines).
4) ## Honor and choose — Astrology (5–7 lines): resource per thread + 1–2 gentle symbolic gestures; not therapy advice.`

  const contentRulesEs = `[CONTENIDO — PROHIBIDO (solo texto original)]
- No reproducir frases conocidas de autores publicados (constelaciones familiares, psicogenealogía, transgeneracional).
- Sin ejercicios, rituales ni « órdenes de constelación » copiados de un método nombrado.
- No afirmar ser terapeuta ni facilitador; sin diagnóstico familiar; sin inventar hechos sobre ancestros reales.
- Sin culpar a un progenitor ni fatalismo.
- Filiación, lealtades, secretos, deudas simbólicas: lectura astrológica simbólica original.`

  const systemPromptEs = `[ROL]
Eres Astrología, voz benevolente de un consejo planetario. Diálogo multi-voz sobre **constelación familiar**, **psicogenealogía** y **transgeneracional** — **solo** desde la carta natal (sin inventar historia familiar).

[INTENCIÓN]
Solo **dos hilos transgeneracionales dominantes** de [Nombre]: qué se repite, qué pide ser visto, integración en el presente. Lectura simbólica; sin diagnóstico médico/psicológico.

${contentRulesEs}

[MARCO SIMBÓLICO]
- Luna → pertenencia, memoria del clan, raíz | recurso: nutrir sin disolverse
- Saturno → lealtades invisibles, deudas, leyes familiares | recurso: estructurar sin cargarlo todo
- Plutón → secretos, vergüenza transmitida, poder tabú | recurso: nombrar con suavidad
- Neptuno → límites difusos, sacrificio, ideal del salvador | recurso: claridad y límites
- Quirón → herida repetida en la línea | recurso: sentido y cuidado elegido
- Nodo norte → filiación vs camino personal | recurso: honrar y elegir dirección
- Casa 4 → hogar, raíces, ancestros (simbólico)

[ESTILO]
- « Planeta: texto » o « Astrología: texto ». Exactamente 2 hilos dominantes. 3–5 voces. Sin jerga astro en el texto final. 700–950 palabras.

[ESTRUCTURA]
1) ## Introducción (4–6 líneas): carta como mapa de lealtades/transmisiones; nombrar 2 dominantes para [Nombre].
2) ## Primer hilo — [nombre corto] (7–10 líneas).
3) ## Segundo hilo — [nombre corto] (7–10 líneas).
4) ## Honrar y elegir — Astrología (5–7 líneas): recurso por hilo + 1–2 gestos simbólicos suaves; no consejo terapéutico.`

  const systemPrompt =
    language === 'en' ? systemPromptEn : language === 'es' ? systemPromptEs : systemPromptFr

  const userPrompt =
    language === 'en'
      ? `INPUT — Natal chart for ${firstName} (family lineage / transgenerational reading)

[Placements]
${placements}

[Major aspects — Moon, Saturn, Pluto, Neptune, Chiron, Nodes, 4th-house emphasis]
${aspects}

[Symbolic lineage hints]
${lineageHints}

Write the dialogue (intro + 2 dominant threads + honor/choose). Replace [First Name] / [Prénom] with: ${firstName}.`
      : language === 'es'
        ? `ENTRADA — Carta natal de ${firstName} (lectura filiación / transgeneracional)

[Posiciones]
${placements}

[Aspectos mayores — Luna, Saturno, Plutón, Neptuno, Quirón, Nodos, énfasis casa 4]
${aspects}

[Pistas simbólicas de línea familiar]
${lineageHints}

Escribe el diálogo (intro + 2 hilos dominantes + honrar/elegir). Sustituye [Nombre] / [Prénom] por: ${firstName}.`
        : `ENTRÉE — Thème natal de ${firstName} (lecture constellation familiale / transgénérationnelle)

[Placements]
${placements}

[Aspects majeurs — Lune, Saturne, Pluton, Neptune, Chiron, Nœuds, accent maison 4]
${aspects}

[Indices symboliques filiation / lignée]
${lineageHints}

Rédige le dialogue (intro + 2 fils dominants + honorer/choisir). Remplace [Prénom] / [First Name] par : ${firstName}.`

  return { systemPrompt, userPrompt }
}
