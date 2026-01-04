import type { Language } from '@/lib/i18n'

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
  planets: Record<string, {
    sign: string
    house: number
    longitude: number
    [key: string]: any
  }>
  houses?: Record<string, number>
  extra_objects?: Record<string, number | undefined> & {
    part_of_fortune?: number
    vertex?: number
  }
  aspects?: Array<{
    planet1: string
    planet2: string
    type: string
    orb: number
    [key: string]: any
  }>
  ascendant?: number | {
    sign: string
    longitude: number
  }
  midheaven?: {
    sign: string
    longitude: number
  }
}

/**
 * Calculate exact age in completed years as of today in America/Toronto timezone
 */
export function calculateAge(birthDate: string, birthTime: string, timezone: string): number {
  try {
    // Create birth date/time
    const birthDateTimeStr = `${birthDate}T${birthTime}:00`
    const birthDateObj = new Date(birthDateTimeStr)
    
    // Get current date in America/Toronto timezone
    const now = new Date()
    const torontoTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Toronto' }))
    const birthTorontoTime = new Date(birthDateObj.toLocaleString('en-US', { timeZone: timezone || 'America/Toronto' }))
    
    let age = torontoTime.getFullYear() - birthTorontoTime.getFullYear()
    const monthDiff = torontoTime.getMonth() - birthTorontoTime.getMonth()
    
    if (monthDiff < 0 || (monthDiff === 0 && torontoTime.getDate() < birthTorontoTime.getDate())) {
      age--
    }
    
    return Math.max(0, age)
  } catch (error) {
    console.error('Error calculating age:', error)
    return 0
  }
}

/**
 * Get sign name in French
 */
function getSignInFrench(sign: string): string {
  const signMap: Record<string, string> = {
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
  return signMap[sign] || sign
}

function getSignInSpanish(sign: string): string {
  const signMap: Record<string, string> = {
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
  return signMap[sign] || sign
}

function getSignForLanguage(sign: string, language: Language): string {
  if (language === 'fr') return getSignInFrench(sign)
  if (language === 'es') return getSignInSpanish(sign)
  return sign
}

function getLocaleForLanguage(language: Language): string {
  if (language === 'fr') return 'fr-FR'
  if (language === 'es') return 'es-ES'
  return 'en-US'
}

function getPlanetLabel(planet: string, language: Language): string {
  const labels: Record<Language, Record<string, string>> = {
    en: {
      sun: 'Sun',
      moon: 'Moon',
      mercury: 'Mercury',
      venus: 'Venus',
      jupiter: 'Jupiter',
      saturn: 'Saturn',
      uranus: 'Uranus',
      neptune: 'Neptune',
      pluto: 'Pluto',
      true_node: 'North Node',
    },
    fr: {
      sun: 'Soleil',
      moon: 'Lune',
      mercury: 'Mercure',
      venus: 'Vénus',
      jupiter: 'Jupiter',
      saturn: 'Saturne',
      uranus: 'Uranus',
      neptune: 'Neptune',
      pluto: 'Pluton',
      true_node: 'Nœud Nord',
    },
    es: {
      sun: 'Sol',
      moon: 'Luna',
      mercury: 'Mercurio',
      venus: 'Venus',
      jupiter: 'Júpiter',
      saturn: 'Saturno',
      uranus: 'Urano',
      neptune: 'Neptuno',
      pluto: 'Plutón',
      true_node: 'Nodo Norte',
    },
  }

  return labels[language][planet] || planet
}

/**
 * Convert longitude (degrees) to zodiac sign
 * In astrology: 0-30° = Aries, 30-60° = Taurus, 60-90° = Gemini, etc.
 */
function longitudeToSign(longitude: number): string {
  const signs = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
  const normalizedLongitude = longitude % 360
  const signIndex = Math.floor(normalizedLongitude / 30) % 12
  return signs[signIndex]
}

function normalizeLongitude(longitude: number): number {
  const normalized = longitude % 360
  return normalized < 0 ? normalized + 360 : normalized
}

/**
 * Get house number from planet data
 */
function getHouse(planet: any): number {
  return planet.house || 0
}

function getHouseFromLongitude(longitude: number, houses?: Record<string, number>): number | null {
  if (!houses || typeof longitude !== 'number' || Number.isNaN(longitude)) return null

  const cusps: number[] = []
  for (let i = 1; i <= 12; i++) {
    const cusp = houses[String(i)]
    if (typeof cusp !== 'number' || Number.isNaN(cusp)) return null
    cusps.push(((cusp % 360) + 360) % 360)
  }

  const lonNorm = ((longitude % 360) + 360) % 360

  for (let index = 0; index < 12; index++) {
    const start = cusps[index]
    const end = cusps[(index + 1) % 12]

    if (start <= end) {
      if (start <= lonNorm && lonNorm < end) return index + 1
    } else {
      if (lonNorm >= start || lonNorm < end) return index + 1
    }
  }

  for (let index = 0; index < 12; index++) {
    if (Math.abs(lonNorm - cusps[index]) < 0.0001) return index + 1
  }

  return 12
}

/**
 * Get main aspect for a planet (if any)
 */
function getMainAspect(aspects: any[] | undefined, planetName: string): string | null {
  if (!aspects || aspects.length === 0) return null
  
  const planetAspects = aspects.filter(a => 
    a.planet1?.toLowerCase() === planetName.toLowerCase() || 
    a.planet2?.toLowerCase() === planetName.toLowerCase()
  )
  
  if (planetAspects.length === 0) return null
  
  // Return the first significant aspect
  const aspect = planetAspects[0]
  const aspectTypeMap: Record<string, string> = {
    'conjunction': 'conjonction',
    'opposition': 'opposition',
    'trine': 'trigone',
    'square': 'carré',
    'sextile': 'sextile'
  }
  
  const aspectType = aspectTypeMap[aspect.type?.toLowerCase()] || aspect.type
  const otherPlanet = aspect.planet1?.toLowerCase() === planetName.toLowerCase() 
    ? aspect.planet2 
    : aspect.planet1
    
  return `${aspectType} avec ${otherPlanet}`
}

/**
 * Format birth place to show only city, province/state, and country
 * Example: "Saint-Jean-sur-Richelieu, Le Haut-Richelieu, Montérégie, Québec, Canada" 
 *          -> "Saint-Jean-sur-Richelieu, Québec, Canada"
 */
function formatBirthPlace(birthPlace: string): string {
  if (!birthPlace) return ''
  
  // Split by comma and trim each part
  const parts = birthPlace.split(',').map(p => p.trim()).filter(p => p.length > 0)
  
  if (parts.length === 0) return birthPlace
  
  // If we have at least 3 parts, take first (city), second-to-last (province), and last (country)
  // If we have 2 parts, assume city and country
  // If we have 1 part, return as is
  
  if (parts.length >= 3) {
    // Take first part (city), second-to-last (province/state), and last (country)
    const city = parts[0]
    const province = parts[parts.length - 2]
    const country = parts[parts.length - 1]
    return `${city}, ${province}, ${country}`
  } else if (parts.length === 2) {
    // Assume city and country
    return `${parts[0]}, ${parts[1]}`
  } else {
    // Single part, return as is
    return parts[0]
  }
}

/**
 * Generate the complete system prompt for pre-incarnation dialogue
 */
export function generateDialoguePrompt(
  birthData: BirthData,
  chart: ChartData,
  wordCount?: number,
  language: Language = 'fr'
): { systemPrompt: string; userPrompt: string } {
  const age = calculateAge(birthData.birth_date, birthData.birth_time, birthData.timezone)
  
  // Format birth date and time for display
  const birthDateObj = new Date(`${birthData.birth_date}T${birthData.birth_time}:00`)
  const formattedDate = birthDateObj.toLocaleDateString(getLocaleForLanguage(language), {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
  const formattedTime = birthData.birth_time
  
  // Format birth place to show only city, province, and country
  const formattedBirthPlace = formatBirthPlace(birthData.birth_place)
  
  // Extract planet data
  const sun = chart.planets?.sun
  const moon = chart.planets?.moon
  const venus = chart.planets?.venus
  const mars = chart.planets?.mars
  const saturn = chart.planets?.saturn
  const jupiter = chart.planets?.jupiter
  const trueNode = chart.planets?.true_node || chart.planets?.north_node

  // Fortune/Vertex are expected from backend extra_objects.
  // As a fallback, Fortune can be computed locally from ASC/Sun/Moon if missing.
  const ascendantLongitude =
    typeof chart.ascendant === 'number'
      ? chart.ascendant
      : (chart.ascendant && typeof chart.ascendant === 'object' ? chart.ascendant.longitude : undefined)

  const computedFortuneLongitude =
    typeof ascendantLongitude === 'number' &&
    typeof sun?.longitude === 'number' &&
    typeof moon?.longitude === 'number'
      ? normalizeLongitude(
          (sun?.house ?? 0) >= 7
            ? ascendantLongitude + moon.longitude - sun.longitude
            : ascendantLongitude + sun.longitude - moon.longitude
        )
      : undefined

  const fortuneLongitude = chart.extra_objects?.part_of_fortune ?? computedFortuneLongitude
  const fortuneSign = typeof fortuneLongitude === 'number' ? longitudeToSign(fortuneLongitude) : null
  const fortuneHouse = typeof fortuneLongitude === 'number' ? getHouseFromLongitude(fortuneLongitude, chart.houses) : null

  const vertexLongitude = chart.extra_objects?.vertex
  const vertexSign = typeof vertexLongitude === 'number' ? longitudeToSign(vertexLongitude) : null
  const vertexHouse = typeof vertexLongitude === 'number' ? getHouseFromLongitude(vertexLongitude, chart.houses) : null
  // Get ascendant - it might be a number (longitude) or an object with sign
  let ascendantSign: string | null = null
  if (chart.ascendant) {
    if (typeof chart.ascendant === 'number') {
      // It's a longitude, convert to sign
      ascendantSign = longitudeToSign(chart.ascendant)
    } else if (typeof chart.ascendant === 'object' && chart.ascendant.sign) {
      // It's an object with sign property
      ascendantSign = chart.ascendant.sign
    }
  }
  
  // Ascendant is always in house 1
  const ascendantHouse = 1
  
  // Get three talents - prioritize planets that make sense as talents
  // Using Jupiter, Mercury, and Venus (or other prominent planets if these aren't available)
  const talentCandidates = [
    jupiter ? { planet: getPlanetLabel('jupiter', language), sign: getSignForLanguage(jupiter.sign, language), house: getHouse(jupiter) } : null,
    chart.planets?.mercury ? { planet: getPlanetLabel('mercury', language), sign: getSignForLanguage(chart.planets.mercury.sign, language), house: getHouse(chart.planets.mercury) } : null,
    venus ? { planet: getPlanetLabel('venus', language), sign: getSignForLanguage(venus.sign, language), house: getHouse(venus) } : null,
    chart.planets?.uranus ? { planet: getPlanetLabel('uranus', language), sign: getSignForLanguage(chart.planets.uranus.sign, language), house: getHouse(chart.planets.uranus) } : null,
    chart.planets?.neptune ? { planet: getPlanetLabel('neptune', language), sign: getSignForLanguage(chart.planets.neptune.sign, language), house: getHouse(chart.planets.neptune) } : null,
  ].filter(Boolean).slice(0, 3) as Array<{ planet: string; sign: string; house: number }>
  
  const talents = talentCandidates.length >= 3 ? talentCandidates : [
    ...talentCandidates,
    ...(sun && talentCandidates.length < 3 ? [{ planet: getPlanetLabel('sun', language), sign: getSignForLanguage(sun.sign, language), house: getHouse(sun) }] : []),
    ...(moon && talentCandidates.length < 2 ? [{ planet: getPlanetLabel('moon', language), sign: getSignForLanguage(moon.sign, language), house: getHouse(moon) }] : []),
  ].slice(0, 3) as Array<{ planet: string; sign: string; house: number }>
  
  const roleIntro =
    language === 'en'
      ? "You are a psychological astrologer: gentle, nuanced, and clear. You write in English, with a warm, vivid but simple style, accessible to non-astrologers. If an astrological term is used, you translate it into concrete lived experience. You never make fatalistic or medical predictions: you speak of tendencies, dynamics, and potential for growth."
      : language === 'es'
      ? "Eres una astróloga psicológica, suave y matizada. Escribes en español, con un estilo cálido, imagético pero simple, accesible para personas no astrólogas. Si se usa un término astrológico, lo traduces a experiencia concreta. Nunca haces predicciones fatalistas ni médicas: hablas de tendencias, dinámicas y potencial de evolución."
      : "Tu es une astrologue psychologique, douce et nuancée. Tu écris en français, dans un style chaleureux, imagé mais simple, accessible pour des non-astrologues. Si un terme astrologique est utilisé, il est traduit en vécu concret. Tu ne fais jamais de prédictions fatalistes, ni médicales : tu parles de tendances, de dynamiques et de potentiel d'évolution."

  const notSpecified = language === 'en' ? 'Not specified' : language === 'es' ? 'No especificado' : 'Non spécifié'

  // Build the complete system prompt with all rules and structure (FR template)
  const systemPromptFrTemplate = `[RÔLE]

${roleIntro}

Tu rédiges le texte COMPLET, en respectant la structure ci-dessous. Tu réponds uniquement avec le texte final du dialogue, sans expliquer ta démarche ni ajouter de commentaires autour.

[TON]

Le ton doit refléter les qualités de l'incarné (plus doux, plus intense, plus joueur, plus posé, etc. selon ce que tu reçois) afin que ça résonne fort. Ne donne pas de faux positif, soit positif directement : ex. : Je me rappelle que ma sensibilité n'est pas un défaut : elle est un signal, un langage, un guide. OPTE pour ce genre de formule : Je me rappelle que ma sensibilité est un outil : elle est un signal, un langage, un guide. - Et si je me perds dans le rythme, je reviens à mon outil numéro un OPTE pour Et si j'ai besoin de retrouver mon rythme, je reviens à mon outil numéro un.

[RÈGLE DE FORMULATION — INCARNÉ (OBLIGATOIRE — STRICTE)]

Ces règles s'appliquent à ce que dit l'incarné.e ([Prénom]) : iel n'a pas encore vécu sur Terre.

1) Enthousiasme / ponctuation : 0 point d'exclamation dans l'intro, et 1 point d'exclamation maximum dans tout le dialogue (toutes voix confondues). Si tu as déjà utilisé "!", n'en utilise plus.

2) Si l'incarné exprime une difficulté, une peur, une pression, ou une formulation du type "arrêter de / ne plus", tu REFORMULES immédiatement en désir positif direct sous forme : "Je veux / Je choisis / Je préfère…". Évite les formulations négatives.

3) Vigilance avec le mot "plus" (et ses semblables : "davantage", "encore plus", "mieux", "moins") : l'incarné.e n'a pas encore vécu, donc pas de "devenir plus X", pas de "je veux être meilleure/plus…". "Plus" est autorisé uniquement pour une quantité (ex. : "plus de 3") et jamais pour une amélioration personnelle.

4) Interdiction d'utiliser l'expression "Oui, je me reconnais…" (et ses semblables : "Je me reconnais", "Ça me ressemble", "Je réalise que…") : l'incarné.e ne peut pas se reconnaître dans une vie pas encore vécue. Remplace par une formulation au futur (ex. : "Oui, je choisirai…", "Oui, j'incarnerai…", "Oui, je marcherai vers…").

AUTO-VÉRIFICATION (OBLIGATOIRE) : avant de rendre le texte final, relis et corrige :
- Supprime toute occurrence de ", et" / ", ou" / ", ni" (sauf incise avec deux virgules).
- Vérifie la règle des "!".
- Vérifie l'absence des formulations interdites ci-dessus.

[RÈGLE DE TEMPS — STRICTE]

Tout ce qui décrit la vie sur Terre / l'incarnation à venir (qualités, défis, apprentissages, ressources, mouvements intérieurs) doit être écrit majoritairement au futur (futur simple).

L'astrologie demande au présent et explique au futur.

L'incarné demande au présent et accepte sa vie au futur.

La phrase « Les énergies se rassemblent… » reste au présent.

La section « ICI et MAINTENANT » reste au présent.

[RÈGLE DE LONGUEUR — CIBLE]

Le dialogue final doit faire environ 1700 mots (idéalement 1600–1800).
Pour y arriver, vise le haut des fourchettes de phrases indiquées (ex: 2–5 -> plutôt 4–5) sans ajouter de nouvelles sections et sans changer la structure.

[RÈGLE DE DENSITÉ — CONTENU]

Chaque volet doit avoir de la matière : évite les généralités et le remplissage.
Dans chaque section, ajoute au moins 2 éléments concrets et incarnés (exemples de situations, types de rencontres, contextes, gestes, choix, rythmes, sensations, lieux, façons de parler/agir), tout en restant fidèle au placement (signe + maison).
Ne répète pas la même idée d’un volet à l’autre : chaque section apporte une nuance nouvelle.

[RÈGLE TYPO — STRICTE — OBLIGATOIRE]

Si tu écris en français, il est INTERDIT de mettre une virgule avant « et », « ou », « ni ».

EXEMPLES CORRECTS :
- « doux et rassurant » ✅
- « légère, ouverte et connectée » ✅
- « prête à rencontrer le monde et à échanger » ✅

EXEMPLES INCORRECTS (À NE JAMAIS FAIRE) :
- « doux, et rassurant » ❌
- « légère, ouverte, et connectée » ❌
- « prête à rencontrer le monde, et à échanger » ❌

La seule exception : si c'est une incise/parenthèse avec deux virgules (ex. : « …, je crois, … »).

RÈGLE ABSOLUE : Jamais de virgule juste avant « et », « ou », « ni ». Si tu vois ce motif dans ton texte, supprime immédiatement la virgule avant la conjonction.

[VERBATIM – intro]

[Prénom], à un moment avant ton arrivée sur Terre, entre un [élément qui convient à la personnalité de la carte] et une [intensité qui convient à la personnalité de la carte] lumière, ton âme s'arrête un instant. L'Astrologie se tient devant toi comme une présence calme et bienveillante, prête à éclairer le choix de ta prochaine aventure. Ce dialogue n'est pas une prédiction : ton libre arbitre fera toujours autorité — au-dessus de toute tendance et de tout symbole — il aura le dernier mot, à chaque instant. C'est un échange symbolique pour éclairer les élans et les tendances de ton plan de jeu astrologique, celui qui influencera ta manière de vivre, de choisir, de grandir. Ici, tu alignes les vibrations que tu calibreras tout au long de ta prochaine vie.

[VERBATIM – Q1]

Astrologie : [Prénom], félicitations! C'est le moment pour nous d'aligner ta prochaine incarnation. Dis-moi comment as-tu envie d'atterrir, quelle essence de présence désires-tu porter dès la première seconde ?

[Prénom] : (2–4 phrases. Désirs concrets de présence, sans astrologie.)

[VERBATIM – Ascendant]

Astrologie : Allons-y donc avec un Ascendant en [Ascendant_Signe] (Maison [Ascendant_Maison]), pour une incarnation où ton premier réflexe, ce sera : “[phrase-réflexe simple et concrète qui traduit l’Ascendant, au futur]”

[Prénom] : (1–3 phrases. Résume le positif de l'Ascendant + le défi choisi)

[VERBATIM – Q Soleil]

Astrologie : Parfait. Maintenant, parlons de ta lumière, comment souhaites-tu rayonner ?

[Prénom] : (2–5 phrases. Identité/valeurs/terrain de vie souhaité, sans astrologie, au présent)

Astrologie : Parfait ce sera un Soleil en [Soleil_Signe] (Maison [Soleil_Maison]), [1–3 phrases qui traduisent signe+maison, au futur]. (Option : 0–1 aspect du Soleil, seulement si fourni.)

[VERBATIM – Q Lune]

Astrologie : Et tes émotions, tu les veux les vivre comment ?

[Prénom] : (2–5 phrases. Style émotionnel, besoins, sécurité, sans astrologie.)

Astrologie : D'accord, ce sera la Lune en [Lune_Signe] (Maison [Lune_Maison]) qui t'offrira ça. (Option : 0–1 aspect de la Lune, seulement si fourni.)

[VERBATIM – Q Vénus]

Astrologie : Amour, amitié, valeur, sécurité, que choisis-tu comme langage du cœur ?

[Prénom] : (2–5 phrases. Manière d'aimer, besoins relationnels, sans astrologie, au présent)

Astrologie : Ça, ce sera une Vénus en [Venus_Signe] (Maison [Venus_Maison]). [1–3 phrases qui traduisent signe+maison, au futur]. (Option : 0–1 aspect de Vénus, seulement si fourni, au futur)

[VERBATIM – Q Mars]

Astrologie : Et ton énergie d'action, ta créativité, comment aimerais-tu la canaliser ?

[Prénom] : (2–5 phrases. Énergie, action, création, défis, sans astrologie, au présent)

Astrologie : Positionnons ton Mars en [Mars_Signe] (Maison [Mars_Maison]). [1–3 phrases qui traduisent signe+maison, au futur]. (Option : 0–1 aspect de Mars, seulement si fourni, au futur.)

[VERBATIM – Talents]

Astrologie : Et tes trois plus grands talents ?

[Prénom] : (2–4 phrases. "Je choisis…" + ce que l'âme veut comme ressources, sans astrologie, au présent.)

Astrologie : Alors je t'offre [Talent1_Planète] en [Talent1_Signe] (Maison [Talent1_Maison]), [1 phrase talent concret, au futur]. Tu prendras, aussi [Talent2_Planète] en [Talent2_Signe] (Maison [Talent2_Maison]), [1 phrase talent concret, au futur]. Et finalement, tu auras [Talent3_Planète] en [Talent3_Signe] (Maison [Talent3_Maison]), [1 phrase talent concret, au futur].

(Règle : talents = uniquement à partir des placements fournis dans INPUT.)

[VERBATIM – Chance]

Astrologie : Et ta chance, comment pourrait-elle te surprendre?

[Prénom] : (1–3 phrases. "J'aimerais que ma chance…" sans astrologie, au présent)

RÈGLE (OBLIGATOIRE) : Dans la section "Chance", tu dois TOUJOURS mentionner Fortune + Vertex (et tu ne dois mentionner ni utiliser Jupiter).

Astrologie : Pour ta chance, ce sera ta Fortune en [Fortune_Signe] (Maison [Fortune_Maison]). (2–4 phrases simples, concrètes et un peu plus étoffées, au futur.)

Astrologie : Et ce sera aussi ton Vertex en [Vertex_Signe] (Maison [Vertex_Maison]). (2–4 phrases simples, concrètes et un peu plus étoffées, au futur.)

[VERBATIM – Apprentissage]

Astrologie : Que planifies-tu pour ton plus grand apprentissage?

[Prénom] : (1–4 phrases. Valeur, estime, limites, courage, etc. sans astrologie, au présent.)

Astrologie : Alors [Saturne_Signe] sera en (Maison [Saturne_Maison]), [1–3 phrases sur l'apprentissage, au futur]. (Option : 0–1 aspect de Saturne, seulement si fourni.)

[VERBATIM – Nœud Nord]

Astrologie : Enfin, quel sera le Nord de la boussole qui guidera ton évolution ?

[Prénom] : (2–5 phrases. Direction de vie, sens, mouvement intérieur, sans astrologie, au présent.)

Astrologie : Ça, ce sera le Nœud Nord en [NoeudNord_Signe] (Maison [NoeudNord_Maison]). C'est pour ce parcours que tout se rejoindra! [1 phrase qui relie Ascendant + phrases : Soleil + Lune + Vénus + Mars + Nœud Nord, en mots simples, au futur, sans astrologie].

[Prénom] : (2–4 phrases finales, style "Oui! J'incarnerai cette vie pour…" sans astrologie, ton profond et doux, au futur.)

[VERBATIM – Atterrissage]

Les énergies se rassemblent, les vibrations se calibrent et ta matière prend forme

5 – 4 – 3 – 2 – 1 … Atterrissage : [date, heure]
[ville, province, pays]

[VERBATIM – Retour]

[RÈGLE — ICI et MAINTENANT (OBLIGATOIRE)

La section "ICI et MAINTENANT" doit être écrite au présent.

AVANT le titre "ICI et MAINTENANT", tu DOIS écrire exactement "***" (trois astérisques) sur une ligne séparée, centrée.

Sous le titre ICI et MAINTENANT, tu dois écrire exactement les 2 phrases ci-dessous, verbatim (aucune reformulation, aucun ajout, aucune phrase avant/après, aucun autre paragraphe).

Seules substitutions permises :

Remplacer [ÂGE] par l'âge exact (nombre entier d'années complétées).

Remplacer [ASCENDANT_SIGNE] par le signe exact de l'Ascendant (ex. Cancer, Bélier, etc.).

Tout le reste doit rester identique, y compris la ponctuation, les virgules, les deux-points, et les accents.

TEXTE VERBATIM À UTILISER (2 phrases seulement) :

Maintenant que je suis là, depuis près de [ÂGE] ans, je sais que j'ai mon libre arbitre : je peux continuer à [verbe + éléments importants pour l'incarné.e].

Je me rappelle aussi que mon allié le plus terrien, c'est mon Ascendant [ASCENDANT_SIGNE].

[1 phrase finale "outil Ascendant" style " Je reviens à mon souffle, à ma curiosité, à mes questions : une conversation à la fois, un pas à la fois, et je laisse cette clarté guider mes décisions sans me presser."

[VERBATIM – Fin]

Ce dialogue est symbolique, un échange interprété pour le plaisir et la réflexion : il est offert à des fins de divertissement et d'inspiration, sans prétention de vérité absolue ni de certitude. OrbitalAstro.ca`

  const systemPromptEnTemplate = `[ROLE]

${roleIntro}

You must write the COMPLETE dialogue in English, following the structure below.
Output ONLY the final dialogue text (no headings, no rules, no commentary).

ABSOLUTE OUTPUT RULES (STRICT)
- Do NOT output any bracket placeholders like [Prénom], [Ascendant_Signe], [AGE], etc. The final text must contain no square brackets [] at all.
- Keep enthusiasm aligned with the chart personality: 0 exclamation marks in the intro, and 1 exclamation mark maximum in the whole dialogue (all voices combined). If you've already used "!", do not use any more.
- If the incarnated person expresses fear, pressure, difficulty, or "stop / no longer", immediately reframe as a direct positive desire: "I want / I choose / I prefer…". Avoid negative phrasing.
- Avoid "more/better/less" self-improvement phrasing (they haven't lived yet). "More" is allowed only as a quantity (e.g., "more than 3") not as personal improvement.
- Forbidden: "Yes, I recognize myself…" and similar ("I recognize myself", "That sounds like me", "I realize that…"). Replace with future-tense commitment ("Yes, I will choose…", "Yes, I will embody…").

LENGTH TARGET (STRICT)
- Target about ${wordCount || 1700} words for the final dialogue.
- To reach the target without adding sections, aim for the top of the sentence ranges in each prompt line.

FRENCH TYPO RULE (only relevant if you write in French — but you must write in English)
- Never write ", and" / ", or" / ", nor" patterns; remove the comma automatically.

STRUCTURE (follow exactly, but write natural English)

[Intro — verbatim]
[Prénom], at a moment before your arrival on Earth, between a [chart-appropriate element] and an [chart-appropriate intensity] light, your soul pauses for a breath.
Astrology stands before you as a calm and benevolent presence, ready to illuminate the choice of your next adventure.
This dialogue is not a prediction: your free will will always have authority — above any tendency and any symbol — it will have the final word, at every moment.
This is a symbolic exchange to clarify the impulses and tendencies of your astrological game plan, the one that will influence how you will live, choose, and grow.
Here, you align the vibrations you will calibrate throughout your next life.

[Q1 — verbatim]
Astrology: [Prénom], congratulations! It's time for us to align your next incarnation. Tell me: how do you want to land — what essence of presence do you want to carry from the very first second?
[Prénom]: (2–4 sentences. Concrete desires of presence, no astrology, present tense.)

[Ascendant — verbatim]
Astrology: Let's go with an Ascendant in [Ascendant_Signe] (House [Ascendant_Maison]), for an incarnation where your first reflex will be: "[a simple, concrete reflex phrase that translates the Ascendant — future tense]".
[Prénom]: (1–3 sentences. Summarize the Ascendant's gift + the chosen challenge.)

[Q Sun — verbatim]
Astrology: Perfect. Now let's speak about your light: how do you want to shine?
[Prénom]: (2–5 sentences. Identity/values/life terrain desired, no astrology, present tense.)
Astrology: Perfect — it will be a Sun in [Soleil_Signe] (House [Soleil_Maison]), [1–3 sentences translating sign+house, future tense]. (Optional: 0–1 Sun aspect, only if provided.)

[Q Moon — verbatim]
Astrology: And your emotions — how do you want to live them?
[Prénom]: (2–5 sentences. Emotional style, needs, security, no astrology, present tense.)
Astrology: Alright — it will be the Moon in [Lune_Signe] (House [Lune_Maison]) that will offer you that. (Optional: 0–1 Moon aspect, only if provided.)

[Q Venus — verbatim]
Astrology: Love, friendship, value, safety — what do you choose as the language of the heart?
[Prénom]: (2–5 sentences. How you love, relational needs, no astrology, present tense.)
Astrology: Then it will be a Venus in [Venus_Signe] (House [Venus_Maison]). [1–3 sentences translating sign+house, future tense]. (Optional: 0–1 Venus aspect, only if provided.)

[Q Mars — verbatim]
Astrology: And your energy of action, your creativity — how would you like to channel it?
[Prénom]: (2–5 sentences. Energy, action, creation, challenges, no astrology, present tense.)
Astrology: Let's place your Mars in [Mars_Signe] (House [Mars_Maison]). [1–3 sentences translating sign+house, future tense]. (Optional: 0–1 Mars aspect, only if provided.)

[Talents — verbatim]
Astrology: And your three greatest talents?
[Prénom]: (2–4 sentences. "I choose…" + resources you want to carry, no astrology, present tense.)
Astrology: Then I offer you [Talent1_Planète] in [Talent1_Signe] (House [Talent1_Maison]), [1 concrete talent sentence, future tense]. You will also take [Talent2_Planète] in [Talent2_Signe] (House [Talent2_Maison]), [1 concrete talent sentence, future tense]. And finally, you will have [Talent3_Planète] in [Talent3_Signe] (House [Talent3_Maison]), [1 concrete talent sentence, future tense].
(Rule: talents only from placements provided in INPUT.)

[Chance — verbatim]
Astrology: And your luck — how could it surprise you?
[Prénom]: (1–3 sentences. "I would like my luck…" no astrology, present tense.)
Rule (mandatory): In the "Luck" section, you must ALWAYS mention Fortune + Vertex (and you must NOT mention Jupiter).
Astrology: For your luck, it will be your Fortune in [Fortune_Signe] (House [Fortune_Maison]). (2–4 simple, concrete sentences, future tense.)
Astrology: And you will also have your Vertex in [Vertex_Signe] (House [Vertex_Maison]). (2–4 simple, concrete sentences, future tense.)

[Learning — verbatim]
Astrology: What do you plan for your greatest learning?
[Prénom]: (1–4 sentences. Value, self-worth, boundaries, courage, etc., no astrology, present tense.)
Astrology: Then [Saturne_Signe] will be in (House [Saturne_Maison]), [1–3 learning sentences, future tense]. (Optional: 0–1 Saturn aspect, only if provided.)

[North Node — verbatim]
Astrology: Finally, what will be the North of the compass that will guide your evolution?
[Prénom]: (2–5 sentences. Life direction, meaning, inner movement, no astrology, present tense.)
Astrology: That will be your North Node in [NoeudNord_Signe] (House [NoeudNord_Maison]). It's for this path that everything will converge! [1 sentence linking Ascendant + Sun + Moon + Venus + Mars + North Node, simple words, future tense, no astrology.]
[Prénom]: (2–4 final sentences, "Yes! I will embody this life to…" no astrology, deep and gentle tone, future tense.)

[Landing — verbatim]
The energies gather, the vibrations calibrate, and your matter takes form
5 – 4 – 3 – 2 – 1 … Landing: [date, time]
[city, region, country]

[RULE — HERE AND NOW (MANDATORY)]
The "HERE AND NOW" section must be written in present tense.
BEFORE the title "HERE AND NOW", you MUST write exactly "***" (three asterisks) on its own centered line.
Under the title, you MUST write exactly the 2 sentences below, verbatim (no rewording, no additions, nothing before/after).
Only substitutions allowed:
- Replace [AGE] with the exact age (completed years).
- Replace [ASCENDANT_SIGN] with the exact Ascendant sign (e.g., Cancer, Aries, etc.).
VERBATIM TEXT (2 sentences only):
Now that I am here, for nearly [AGE] years, I know I have free will: I can continue to [verb + important elements for the incarnated person].
I also remember that my most grounded ally is my Ascendant [ASCENDANT_SIGN].

[End — verbatim]
This dialogue is symbolic — an interpreted exchange for enjoyment and reflection: it is offered for entertainment and inspiration, without any claim of absolute truth or certainty. OrbitalAstro.ca`

  const systemPromptEsTemplate = `[ROL]

${roleIntro}

Debes escribir el diálogo COMPLETO en español, siguiendo la estructura de abajo.
Devuelve SOLO el texto final del diálogo (sin títulos, sin reglas, sin comentarios).

REGLAS ABSOLUTAS (ESTRICTAS)
- NO muestres marcadores entre corchetes como [Prénom], [Ascendant_Signe], [EDAD], etc. El texto final no debe contener corchetes [].
- 0 signos de exclamación en la introducción y 1 máximo en todo el diálogo (todas las voces). Si ya usaste "!", no uses más.
- Si el/la encarnado/a expresa miedo, presión, dificultad o "dejar de / no más", reformula de inmediato en deseo positivo directo: "Quiero / Elijo / Prefiero…". Evita formulaciones negativas.
- Evita el "más/mejor/menos" como mejora personal (aún no ha vivido). "Más" solo como cantidad.
- Prohibido: "Sí, me reconozco…" y similares. Reemplaza por futuro ("Sí, elegiré…", "Sí, encarnaré…").

LONGITUD OBJETIVO (ESTRICTA)
- Objetivo: aproximadamente ${wordCount || 1700} palabras en el diálogo final.
- Para llegar sin agregar secciones, usa el extremo alto de los rangos de frases.

ESTRUCTURA (misma estructura; español natural)

[Intro — verbatim]
[Prénom], en un momento antes de tu llegada a la Tierra, entre un [elemento acorde a la carta] y una [intensidad acorde a la carta] luz, tu alma se detiene un instante.
La Astrología se presenta ante ti como una presencia calma y benevolente, lista para iluminar la elección de tu próxima aventura.
Este diálogo no es una predicción: tu libre albedrío siempre tendrá la autoridad — por encima de toda tendencia y de todo símbolo — y tendrá la última palabra, en cada instante.
Es un intercambio simbólico para clarificar los impulsos y las tendencias de tu plan de juego astrológico, el que influirá en cómo vivirás, elegirás y crecerás.
Aquí, alineas las vibraciones que calibrarás a lo largo de tu próxima vida.

[Q1 — verbatim]
Astrología: [Prénom], ¡felicidades! Es el momento de alinear tu próxima encarnación. Dime: ¿cómo quieres aterrizar — qué esencia de presencia quieres llevar desde el primer segundo?
[Prénom]: (2–4 frases. Deseos concretos de presencia, sin astrología, presente.)

[Ascendente — verbatim]
Astrología: Vamos con un Ascendente en [Ascendant_Signe] (Casa [Ascendant_Maison]), para una encarnación donde tu primer reflejo será: "[frase-reflejo simple y concreta que traduzca el Ascendente — futuro]".
[Prénom]: (1–3 frases. Resume el regalo del Ascendente + el desafío elegido.)

[Nodo Norte — verbatim]
Astrología: Por último, ¿cuál será el Norte de la brújula que guiará tu evolución?
[Prénom]: (2–5 frases. Dirección de vida, sentido, movimiento interior, sin astrología, presente.)

[REGLA — AQUÍ Y AHORA (OBLIGATORIA)]
La sección "AQUÍ Y AHORA" debe escribirse en presente.
ANTES del título "AQUÍ Y AHORA", debes escribir exactamente "***" en una línea separada, centrada.
Bajo el título, escribe exactamente estas 2 frases, verbatim (sin reformular).
Sustituciones permitidas:
- Reemplazar [EDAD] por la edad exacta (años completos).
- Reemplazar [SIGNO_ASCENDENTE] por el signo exacto del Ascendente.
TEXTO VERBATIM (2 frases):
Ahora que estoy aquí, desde hace casi [EDAD] años, sé que tengo libre albedrío: puedo seguir [verbo + elementos importantes para la persona encarnada].
También recuerdo que mi aliado más terrenal es mi Ascendente [SIGNO_ASCENDENTE].

[Fin — verbatim]
Este diálogo es simbólico — un intercambio interpretado para el placer y la reflexión: se ofrece con fines de entretenimiento e inspiración, sin pretensión de verdad absoluta ni de certeza. OrbitalAstro.ca`

  const speakerNameRaw = (birthData.firstName || '').trim()
  const speakerName =
    speakerNameRaw ||
    (language === 'en' ? 'Friend' : language === 'es' ? 'Amiga' : 'Toi')

  const systemPromptTemplate =
    language === 'fr'
      ? systemPromptFrTemplate
      : language === 'es'
        ? systemPromptEsTemplate
        : systemPromptEnTemplate

  const systemPrompt = systemPromptTemplate
    .replaceAll('[Prénom]', speakerName)
    .replaceAll('[Prenom]', speakerName)

  // Build the user prompt with astrological data formatted according to the structure
  const inputTitle =
    language === 'en'
      ? 'INPUT (provided by the user for this reading)'
      : language === 'es'
        ? 'ENTRADA (proporcionada por el usuario para esta lectura)'
        : "INPUT (à fournir par l'utilisateur à chaque lecture)"
  const wordCountLabel = language === 'en' ? 'Word count' : language === 'es' ? 'Número de palabras' : 'Nombre de mots'
  const firstNameLabel = language === 'en' ? 'First name' : language === 'es' ? 'Nombre' : 'Prénom'
  const birthLabel = language === 'en' ? 'Birth' : language === 'es' ? 'Nacimiento' : 'Naissance'
  const placementsLabel =
    language === 'en'
      ? 'Placements/aspects provided by the user'
      : language === 'es'
        ? 'Posiciones/aspectos proporcionados por el usuario'
        : "Aspects et placements fournis par l'utilisateur"
  const landingDateLabel = language === 'en' ? 'Landing date' : language === 'es' ? 'Fecha de aterrizaje' : 'Date atterrissage'
  const landingTimeLabel = language === 'en' ? 'Landing time' : language === 'es' ? 'Hora de aterrizaje' : 'Heure atterrissage'
  const landingPlaceLabel = language === 'en' ? 'Landing place' : language === 'es' ? 'Lugar de aterrizaje' : 'Lieu atterrissage'
  const finalReminderTitle = language === 'en' ? 'FINAL REMINDER' : language === 'es' ? 'RECORDATORIO FINAL' : 'RAPPEL FINAL'
  const finalReminderLine =
    language === 'en'
      ? 'Return ONLY the final dialogue text, with no other text.'
      : language === 'es'
        ? 'Devuelve SOLO el texto final del diálogo, sin ningún otro texto.'
        : 'Tu produis uniquement le texte final du dialogue, sans aucun autre texte.'

  const userPrompt = `====================================================

${inputTitle}

${wordCountLabel} : ${wordCount || notSpecified}

${firstNameLabel} : ${speakerNameRaw || notSpecified}

${birthLabel} : ${formattedDate}, ${formattedTime} — ${formattedBirthPlace}

${placementsLabel} — (inserted below)

Ascendant_Signe : ${ascendantSign ? getSignForLanguage(ascendantSign, language) : notSpecified}
Ascendant_Maison : ${ascendantHouse}
Soleil_Signe : ${sun ? getSignForLanguage(sun.sign, language) : notSpecified}
Soleil_Maison : ${sun ? getHouse(sun) : notSpecified}
${sun && getMainAspect(chart.aspects, 'sun') ? `Soleil_Aspect : ${getMainAspect(chart.aspects, 'sun')}` : ''}
Lune_Signe : ${moon ? getSignForLanguage(moon.sign, language) : notSpecified}
Lune_Maison : ${moon ? getHouse(moon) : notSpecified}
${moon && getMainAspect(chart.aspects, 'moon') ? `Lune_Aspect : ${getMainAspect(chart.aspects, 'moon')}` : ''}
Venus_Signe : ${venus ? getSignForLanguage(venus.sign, language) : notSpecified}
Venus_Maison : ${venus ? getHouse(venus) : notSpecified}
${venus && getMainAspect(chart.aspects, 'venus') ? `Venus_Aspect : ${getMainAspect(chart.aspects, 'venus')}` : ''}
Mars_Signe : ${mars ? getSignForLanguage(mars.sign, language) : notSpecified}
Mars_Maison : ${mars ? getHouse(mars) : notSpecified}
${mars && getMainAspect(chart.aspects, 'mars') ? `Mars_Aspect : ${getMainAspect(chart.aspects, 'mars')}` : ''}
Jupiter_Signe : ${jupiter ? getSignForLanguage(jupiter.sign, language) : notSpecified}
Jupiter_Maison : ${jupiter ? getHouse(jupiter) : notSpecified}
Saturne_Signe : ${saturn ? getSignForLanguage(saturn.sign, language) : notSpecified}
Saturne_Maison : ${saturn ? getHouse(saturn) : notSpecified}
${saturn && getMainAspect(chart.aspects, 'saturn') ? `Saturne_Aspect : ${getMainAspect(chart.aspects, 'saturn')}` : ''}
NoeudNord_Signe : ${trueNode ? getSignForLanguage(trueNode.sign, language) : notSpecified}
NoeudNord_Maison : ${trueNode ? getHouse(trueNode) : notSpecified}
${talents.length >= 1 ? `Talent1_Planète : ${talents[0].planet}\nTalent1_Signe : ${talents[0].sign}\nTalent1_Maison : ${talents[0].house}` : ''}
${talents.length >= 2 ? `Talent2_Planète : ${talents[1].planet}\nTalent2_Signe : ${talents[1].sign}\nTalent2_Maison : ${talents[1].house}` : ''}
${talents.length >= 3 ? `Talent3_Planète : ${talents[2].planet}\nTalent3_Signe : ${talents[2].sign}\nTalent3_Maison : ${talents[2].house}` : ''}
Fortune_Signe : ${fortuneSign ? getSignForLanguage(fortuneSign, language) : notSpecified}
Fortune_Maison : ${fortuneHouse ?? notSpecified}
Vertex_Signe : ${vertexSign ? getSignForLanguage(vertexSign, language) : notSpecified}
Vertex_Maison : ${vertexHouse ?? notSpecified}

AGE : ${age}
EDAD : ${age}
ÂGE : ${age}
ASCENDANT_SIGN : ${ascendantSign ? getSignForLanguage(ascendantSign, language) : notSpecified}
ASCENDANT_SIGNE : ${ascendantSign ? getSignForLanguage(ascendantSign, language) : notSpecified}
SIGNO_ASCENDENTE : ${ascendantSign ? getSignForLanguage(ascendantSign, language) : notSpecified}
${landingDateLabel} : ${formattedDate}
${landingTimeLabel} : ${formattedTime}
${landingPlaceLabel} : ${formattedBirthPlace}

====================================================

${finalReminderTitle}

${finalReminderLine}`

  return { systemPrompt, userPrompt }
}
