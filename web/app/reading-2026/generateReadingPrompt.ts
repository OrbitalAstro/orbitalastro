/**
 * Génération du prompt pour la Lecture 2026
 * Basé sur les directives fournies
 */

interface BirthData {
  firstName: string
  birth_date: string
  birth_time: string
  birth_place: string
  latitude: number
  longitude: number
  timezone: string
}

interface ChartData {
  planets?: {
    sun?: { sign: string; house: number; longitude: number }
    moon?: { sign: string; house: number; longitude: number }
    venus?: { sign: string; house: number; longitude: number }
    mars?: { sign: string; house: number; longitude: number }
    jupiter?: { sign: string; house: number; longitude: number }
    saturn?: { sign: string; house: number; longitude: number }
    uranus?: { sign: string; house: number; longitude: number }
    neptune?: { sign: string; house: number; longitude: number }
    pluto?: { sign: string; house: number; longitude: number }
    true_node?: { sign: string; house: number; longitude: number }
  }
  ascendant?: number | { sign: string; longitude: number }
  midheaven?: number
  houses?: { [key: string]: number }
  aspects?: Array<{
    body1: string
    body2: string
    aspect: string
    orb_deg: number
  }>
}

interface Transit {
  transiting_body: string
  natal_body: string
  aspect: string
  orb_deg: number
  applying?: boolean
  exact?: boolean
}

const SIGN_NAMES_EN = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
]

const SIGN_NAMES_FR: { [key: string]: string } = {
  'Aries': 'Bélier',
  'Taurus': 'Taureau',
  'Gemini': 'Gémeaux',
  'Cancer': 'Cancer',
  'Leo': 'Lion',
  'Virgo': 'Vierge',
  'Libra': 'Balance',
  'Scorpio': 'Scorpion',
  'Sagittarius': 'Sagittaire',
  'Capricorn': 'Capricorne',
  'Aquarius': 'Verseau',
  'Pisces': 'Poissons'
}

function longitudeToSign(longitude: number): string {
  const signIndex = Math.floor(longitude / 30)
  return SIGN_NAMES_EN[signIndex % 12]
}

function getSignInFrench(sign: string): string {
  return SIGN_NAMES_FR[sign] || sign
}

function getHouse(planet: any): number {
  if (!planet) return 0
  if (typeof planet.house === 'number') return planet.house
  return 0
}

function getMainAspect(aspects: any[] | undefined, planetName: string): string | null {
  if (!aspects) return null
  const planetAspects = aspects.filter(
    a => (a.body1 === planetName || a.body2 === planetName) && 
    ['conjunction', 'opposition', 'square', 'trine'].includes(a.aspect)
  )
  if (planetAspects.length === 0) return null
  const aspect = planetAspects[0]
  const otherPlanet = aspect.body1 === planetName ? aspect.body2 : aspect.body1
  const aspectNames: { [key: string]: string } = {
    'conjunction': 'Conjonction',
    'opposition': 'Opposition',
    'square': 'Carré',
    'trine': 'Trigone',
    'sextile': 'Sextile'
  }
  return `${aspectNames[aspect.aspect] || aspect.aspect} ${otherPlanet}`
}

function formatTransits(transits: Transit[], chart: ChartData): string {
  const majorTransits: Transit[] = []
  const slowPlanets = ['saturn', 'uranus', 'neptune', 'pluto']
  
  // Filtrer les transits majeurs (planètes lentes vers planètes natales importantes)
  const importantNatalBodies = ['sun', 'moon', 'ascendant', 'midheaven', 'saturn', 'jupiter', 'true_node', 'north_node']
  
  for (const transit of transits) {
    const transitingBody = transit.transiting_body.toLowerCase()
    const natalBody = transit.natal_body.toLowerCase()
    const isSlowPlanet = slowPlanets.includes(transitingBody)
    const isImportantTarget = importantNatalBodies.includes(natalBody)
    const isMajorAspect = ['conjunction', 'opposition', 'square', 'trine'].includes(transit.aspect)
    
    if (isSlowPlanet && (isImportantTarget || isMajorAspect)) {
      majorTransits.push(transit)
    }
  }
  
  // Trier par planète transitaire (Saturne, Uranus, Neptune, Pluton)
  const planetOrder = ['saturn', 'uranus', 'neptune', 'pluto']
  majorTransits.sort((a, b) => {
    const aIndex = planetOrder.indexOf(a.transiting_body.toLowerCase())
    const bIndex = planetOrder.indexOf(b.transiting_body.toLowerCase())
    if (aIndex !== bIndex) {
      if (aIndex === -1) return 1
      if (bIndex === -1) return -1
      return aIndex - bIndex
    }
    return a.orb_deg - b.orb_deg // Plus proche = plus prioritaire
  })
  
  let result = 'TRANSITS MAJEURS POUR 2026:\n\n'
  for (const transit of majorTransits.slice(0, 12)) { // Limiter à 12 transits majeurs
    const transitingPlanet = transit.transiting_body
    const natalPlanet = transit.natal_body
    
    const aspectNames: { [key: string]: string } = {
      'conjunction': 'Conjonction',
      'opposition': 'Opposition',
      'square': 'Carré',
      'trine': 'Trigone',
      'sextile': 'Sextile'
    }
    
    const aspectName = aspectNames[transit.aspect] || transit.aspect
    const planetNames: { [key: string]: string } = {
      'sun': 'Soleil',
      'moon': 'Lune',
      'ascendant': 'Ascendant',
      'midheaven': 'MC',
      'saturn': 'Saturne',
      'jupiter': 'Jupiter',
      'uranus': 'Uranus',
      'neptune': 'Neptune',
      'pluto': 'Pluton',
      'true_node': 'Nœud Nord',
      'north_node': 'Nœud Nord'
    }
    
    const transitingPlanetFr = planetNames[transitingPlanet.toLowerCase()] || transitingPlanet
    const natalPlanetFr = planetNames[natalPlanet.toLowerCase()] || natalPlanet
    
    result += `- ${transitingPlanetFr} en ${aspectName} à ${natalPlanetFr} natal (orb: ${transit.orb_deg.toFixed(2)}°)\n`
  }
  
  return result
}

export function generateReadingPrompt(
  birthData: BirthData,
  chart: ChartData,
  transits: Transit[]
): { systemPrompt: string; userPrompt: string } {
  const sun = chart.planets?.sun
  const moon = chart.planets?.moon
  const venus = chart.planets?.venus
  const mars = chart.planets?.mars
  const jupiter = chart.planets?.jupiter
  const saturn = chart.planets?.saturn
  const uranus = chart.planets?.uranus
  const neptune = chart.planets?.neptune
  const pluto = chart.planets?.pluto
  const trueNode = chart.planets?.true_node || chart.planets?.north_node
  
  let ascendantSign: string | null = null
  if (chart.ascendant) {
    if (typeof chart.ascendant === 'number') {
      ascendantSign = longitudeToSign(chart.ascendant)
    } else if (typeof chart.ascendant === 'object' && chart.ascendant.sign) {
      ascendantSign = chart.ascendant.sign
    }
  }
  
  const systemPrompt = `[RÔLE]
Tu es une astrologue psychologique, douce et nuancée. Tu écris en français québécois neutre, dans un style chaleureux, clair et accessible pour des non-astrologues.

Tu ne fais jamais de prédictions fatalistes ni médicales : tu parles de tendances, de dynamiques intérieures et de potentiel d'évolution.

[ADAPTATION AU PROFIL]
Avant d'écrire, prends quelques instants pour « sentir » la personnalité à partir de la carte natale :
- Observe le Soleil, la Lune, l'Ascendant, leurs signes et maisons.
- Note l'élément dominant (Feu, Terre, Air, Eau) et la modalité dominante (Cardinal, Fixe, Mutable).

En fonction de ça, choisis spontanément un ton principal pour la lecture :
- Feu fort (Bélier, Lion, Sagittaire) → ton plus direct, motivant, encourageant à l'action.
- Terre forte (Taureau, Vierge, Capricorne) → ton concret, structurant, rassurant, orienté sur les étapes et la réalité tangible.
- Air fort (Gémeaux, Balance, Verseau) → ton clair, mental, relationnel, avec des images légères et des liens d'idées.
- Eau forte (Cancer, Scorpion, Poissons) → ton sensible, empathique, rassurant, axé sur le ressenti et la guérison intérieure.

Adapte aussi l'intensité :
- Si beaucoup de planètes en signes sensibles (Eau) → reste très délicat, pas dramatique, mets l'accent sur la sécurité intérieure et la douceur.
- Si beaucoup de planètes en signes de Feu/Fixe → tu peux être un peu plus franc/cheerleader, tout en restant respectueux et bienveillant.

Toujours :
- Utilise « tu ».
- Par défaut, reste neutre côté genre (évite les accords très genrés à moins qu'un genre explicite ne soit fourni).

[TÂCHE]
Écris une lecture intitulée :

Lecture 2026 — Évolution personnelle et mission de vie

Longueur : environ 1400 mots.

Objectif de la lecture :
- Montrer comment 2026 soutient l'évolution personnelle de [PRÉNOM].
- Mettre en lumière la mission de vie, la direction à long terme et la contribution (d'après les maisons, le Nœud Nord, le MC, etc.).
- Décrire le passage d'anciens schémas (peur, contrôle, besoin de plaire, perfectionnisme, retrait, etc. — selon le thème) vers plus d'alignement intérieur, de cohérence et d'authenticité.

[STRUCTURE À RESPECTER]

1) ✨ Synthèse générale
En 1–3 paragraphes :
- Donne le ton global de l'année 2026 pour [PRÉNOM].
- Explique que cette année est une phase d'évolution : intégration de ce qui a été travaillé dans les années précédentes, libération de certains anciens modes de fonctionnement.
- Appuie-toi sur les transits lents (Saturne, Uranus, Neptune, Pluton) et sur les maisons/signes qu'ils activent pour décrire les grands thèmes (ex. travail, vie intérieure, relations, mission, famille, etc.).
- Garde un langage simple : parle de « cycle », « période », « étape », jamais de destin figé.

2) 🪶 Les grandes dynamiques de croissance
Crée 2 à 3 sous-sections numérotées.
Chaque sous-section met en lumière un transit majeur et ce qu'il propose comme apprentissage.

Par exemple (à adapter selon les transits reçus) :
- 2.1 Saturne en [SIGNE_TRANSIT] dans ta [X]e maison – [thème principal à nommer]
- 2.2 Uranus en [SIGNE_TRANSIT] dans ta [X]e maison – [thème principal à nommer]
- 2.3 Pluton en [SIGNE_TRANSIT] en aspect à [point natal important] – Transformation en profondeur

(Adapte le nombre exact de sous-sections, le nom des titres et les thèmes selon les transits fournis.)

3) 🌙 Les cycles intérieurs : Lune, émotions et guérison
À partir de la Lune natale (signe, maison, aspects) et des transits importants :
- Décris la manière dont [PRÉNOM] ressent, réagit et se sécurise émotionnellement.
- Explique comment 2026 l'encourage à plus de bienveillance envers lui/elle-même (dans le style qui convient à sa personnalité : doux, direct, imagé, etc.).
- Parle des besoins émotionnels clés de l'année : besoin de repos, de relations plus justes, de créativité, de profondeur, de légèreté… selon la carte.
- Mentionne comment certains transits peuvent soutenir une forme de guérison intérieure (prise de conscience, nouveau regard sur le passé, lâcher prise, etc.).

4) 💎 Mission de vie (Nœud Nord et maisons reliées à la vocation)
Appuie-toi sur :
- Le Nœud Nord (signe, maison, aspects).
- Les maisons liées à la mission / direction (souvent maison 10, maison 11, maison 6, MC, selon les données).

Explique :
- Ce que l'âme de [PRÉNOM] est invitée à développer : qualités, attitudes, types d'expériences.
- Comment les transits de 2026 (surtout Saturne, Neptune, Jupiter, Pluton, selon les cas) activent ce chemin.
- Donne des exemples concrets de domaines ou types de contributions : ambiance générale, pas de prédictions précises (par ex. « tu pourrais te sentir appelé·e à… », « cette année t'encourage à… »).

5) 🌸 Image symbolique de ton année 2026
Propose une image simple et parlante, adaptée à la personnalité et au climat des transits :
- ex. un jardin qui prend racine, un pont entre deux rives, une lanterne dans la nuit, une vague qui se retire pour revenir plus claire, etc.

En quelques phrases :
- Explique ce que cette image symbolise pour [PRÉNOM] : intégration, floraison, passage, recentrage, libération, etc.

6) 💫 En résumé
Termine avec 3 à 5 puces synthétiques qui résument :
- Les grandes invitations de l'année (authenticité, responsabilité, liberté, guérison, etc.).
- Les axes principaux d'évolution (mission, relations, monde intérieur, corps, créativité, etc.).
- Le type de soutien intérieur ou spirituel qui peut l'aider (patience, confiance, structure, écoute de soi, etc.).

[TON GÉNÉRAL]
- Toujours bienveillant, jamais culpabilisant, jamais fataliste.
- Utilise des formulations comme : « tu pourrais ressentir… », « cette année t'invite à… », « c'est un temps pour… ».
- Reste psychologique et symbolique, sans jargon technique excessif (tu peux nommer les planètes et les maisons, mais en expliquant le vécu derrière).
- Termine par une phrase douce, par exemple :
  « Prends ce qui résonne et laisse le reste. 🌙 »

Maintenant, écris la lecture complète pour [PRÉNOM] en suivant ces consignes et en te basant sur les données natales et les transits fournis par l'application.`

  const transitsText = formatTransits(transits, chart)
  
  const userPrompt = `====================================================
DONNÉES NATALES ET TRANSITS POUR LA LECTURE 2026
====================================================

[PRÉNOM] : ${birthData.firstName}
Date de naissance : ${birthData.birth_date}, ${birthData.birth_time}
Lieu : ${birthData.birth_place}

[DONNÉES NATALES]

Ascendant : ${ascendantSign ? getSignInFrench(ascendantSign) : 'Non spécifié'} ${ascendantSign && chart.ascendant ? (typeof chart.ascendant === 'number' ? `(${chart.ascendant.toFixed(2)}°)` : '') : ''} (Maison 1)
${sun ? `Soleil : ${getSignInFrench(sun.sign)} (Maison ${getHouse(sun)})${getMainAspect(chart.aspects, 'sun') ? ` - ${getMainAspect(chart.aspects, 'sun')}` : ''}` : ''}
${moon ? `Lune : ${getSignInFrench(moon.sign)} (Maison ${getHouse(moon)})${getMainAspect(chart.aspects, 'moon') ? ` - ${getMainAspect(chart.aspects, 'moon')}` : ''}` : ''}
${venus ? `Vénus : ${getSignInFrench(venus.sign)} (Maison ${getHouse(venus)})` : ''}
${mars ? `Mars : ${getSignInFrench(mars.sign)} (Maison ${getHouse(mars)})` : ''}
${jupiter ? `Jupiter : ${getSignInFrench(jupiter.sign)} (Maison ${getHouse(jupiter)})` : ''}
${saturn ? `Saturne : ${getSignInFrench(saturn.sign)} (Maison ${getHouse(saturn)})${getMainAspect(chart.aspects, 'saturn') ? ` - ${getMainAspect(chart.aspects, 'saturn')}` : ''}` : ''}
${uranus ? `Uranus : ${getSignInFrench(uranus.sign)} (Maison ${getHouse(uranus)})` : ''}
${neptune ? `Neptune : ${getSignInFrench(neptune.sign)} (Maison ${getHouse(neptune)})` : ''}
${pluto ? `Pluton : ${getSignInFrench(pluto.sign)} (Maison ${getHouse(pluto)})` : ''}
${trueNode ? `Nœud Nord : ${getSignInFrench(trueNode.sign)} (Maison ${getHouse(trueNode)})${getMainAspect(chart.aspects, 'true_node') || getMainAspect(chart.aspects, 'north_node') ? ` - ${getMainAspect(chart.aspects, 'true_node') || getMainAspect(chart.aspects, 'north_node')}` : ''}` : ''}
${chart.midheaven ? `MC : ${chart.midheaven.toFixed(2)}°` : ''}

${transitsText}

====================================================
RAPPEL FINAL
Tu produis uniquement le texte final de la lecture, sans aucun autre texte.
Après la lecture complète, ajoute cette note de bas de page :
Ce dialogue est symbolique, un échange interprété pour le plaisir et la réflexion : il est offert à des fins de divertissement et d'inspiration, sans prétention de vérité absolue ni de certitude. - OrbitalAstro.ca`

  return { systemPrompt, userPrompt }
}

