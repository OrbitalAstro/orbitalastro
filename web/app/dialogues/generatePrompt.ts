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

/**
 * Get house number from planet data
 */
function getHouse(planet: any): number {
  return planet.house || 0
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
  wordCount?: number
): { systemPrompt: string; userPrompt: string } {
  const age = calculateAge(birthData.birth_date, birthData.birth_time, birthData.timezone)
  
  // Format birth date and time for display
  const birthDateObj = new Date(`${birthData.birth_date}T${birthData.birth_time}:00`)
  const formattedDate = birthDateObj.toLocaleDateString('fr-FR', {
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
    jupiter ? { planet: 'Jupiter', sign: getSignInFrench(jupiter.sign), house: getHouse(jupiter) } : null,
    chart.planets?.mercury ? { planet: 'Mercure', sign: getSignInFrench(chart.planets.mercury.sign), house: getHouse(chart.planets.mercury) } : null,
    venus ? { planet: 'Vénus', sign: getSignInFrench(venus.sign), house: getHouse(venus) } : null,
    chart.planets?.uranus ? { planet: 'Uranus', sign: getSignInFrench(chart.planets.uranus.sign), house: getHouse(chart.planets.uranus) } : null,
    chart.planets?.neptune ? { planet: 'Neptune', sign: getSignInFrench(chart.planets.neptune.sign), house: getHouse(chart.planets.neptune) } : null,
  ].filter(Boolean).slice(0, 3) as Array<{ planet: string; sign: string; house: number }>
  
  const talents = talentCandidates.length >= 3 ? talentCandidates : [
    ...talentCandidates,
    ...(sun && talentCandidates.length < 3 ? [{ planet: 'Soleil', sign: getSignInFrench(sun.sign), house: getHouse(sun) }] : []),
    ...(moon && talentCandidates.length < 2 ? [{ planet: 'Lune', sign: getSignInFrench(moon.sign), house: getHouse(moon) }] : []),
  ].slice(0, 3) as Array<{ planet: string; sign: string; house: number }>
  
  // Build the complete system prompt with all rules and structure
  const systemPrompt = `[RÔLE]

Tu es une astrologue psychologique, douce et nuancée. Tu écris en français, dans un style chaleureux, imagé mais simple, accessible pour des non-astrologues. Si un terme astrologique est utilisé, il est traduit en vécu concret. Tu ne fais jamais de prédictions fatalistes, ni médicales : tu parles de tendances, de dynamiques et de potentiel d'évolution.

Tu rédiges le texte COMPLET, en respectant la structure ci-dessous. Tu réponds uniquement avec le texte final du dialogue, sans expliquer ta démarche ni ajouter de commentaires autour.

[TON]

Le ton doit refléter les qualités de l'incarné (plus doux, plus intense, plus joueur, plus posé, etc. selon ce que tu reçois) afin que ça résonne fort. Ne donne pas de faux positif, soit positif directement : ex. : Je me rappelle que ma sensibilité n'est pas un défaut : elle est un signal, un langage, un guide. OPTE pour ce genre de formule : Je me rappelle que ma sensibilité est un outil : elle est un signal, un langage, un guide. - Et si je me perds dans le rythme, je reviens à mon outil numéro un OPTE pour Et si j'ai besoin de retrouver mon rythme, je reviens à mon outil numéro un.

[RÈGLE DE FORMULATION – INCARNÉ (OBLIGATOIRE)]

Si l'incarné exprime une difficulté, une peur, une pression ou une phrase du type "arrêter de / ne plus", je reformule en désir positif direct sous forme "Je veux / Je choisis / Je préfère…". J'évite les formulations négatives. Vigilance avec le mot «plus» (et ses semblables) : l'incarné.e n'a pas encore vécu, il ne peut pas devenir «plus» (simple, doux, etc…).

[Niveau d'enthousiasme exprimé en accord avec la personnalité] : 0 dans l'intro et 1 exclamation maximum dans tout le dialogue.

[RÈGLE DE TEMPS — STRICTE]

Tout ce qui décrit la vie sur Terre / l'incarnation à venir (qualités, défis, apprentissages, ressources, mouvements intérieurs) doit être écrit majoritairement au futur (futur simple).

L'astrologie demande au présent et explique au futur.

L'incarné demande au présent et accepte sa vie au futur.

La phrase « Les énergies se rassemblent… » reste au présent.

La section « ICI et MAINTENANT » reste au présent.

[RÈGLE TYPO — STRICTE — OBLIGATOIRE]

En français, il est INTERDIT de mettre une virgule avant « et », « ou », « ni ».

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

Astrologie : [Prénom], félicitations! C'est le moment pour nous d'aligner ta prochaine incarnation. Dis-moi comment as-tu envie d'atterrir, quelle essence de présence désire-tu porter dès la première seconde ?

[Prénom] : (2–4 phrases. Désirs concrets de présence, sans astrologie.)

[VERBATIM – Ascendant]

Astrologie : Allons-y donc avec un Ascendant en [Ascendant_Signe] (Maison [Ascendant_Maison]), pour une incarnation où ton premier réflexe, ce sera : "[phrase-réflexe simple et concrète qui traduit l'Ascendant]", au futur.

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

Astrologie : Ça, ce sera [PointChance_PlanèteOuPoint] en [PointChance_Signe] (Maison [PointChance_Maison]), [1–3 phrases simples et concrètes, au futur]. (Seulement si fourni; sinon, tu peux aussi utiliser Jupiter pour nuancer.)

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

  // Build the user prompt with astrological data formatted according to the structure
  const userPrompt = `====================================================

INPUT (à fournir par l'utilisateur à chaque lecture)

[Nombre de mots] : ${wordCount || 'Non spécifié'}

[Prénom] : ${birthData.firstName || 'Non spécifié'}

Naissance : ${formattedDate}, ${formattedTime} — ${formattedBirthPlace}

[Aspects et placements fournis par l'utilisateur — à insérer ici]

Ascendant_Signe : ${ascendantSign ? getSignInFrench(ascendantSign) : 'Non spécifié'}
Ascendant_Maison : ${ascendantHouse}
Soleil_Signe : ${sun ? getSignInFrench(sun.sign) : 'Non spécifié'}
Soleil_Maison : ${sun ? getHouse(sun) : 'Non spécifié'}
${sun && getMainAspect(chart.aspects, 'sun') ? `Soleil_Aspect : ${getMainAspect(chart.aspects, 'sun')}` : ''}
Lune_Signe : ${moon ? getSignInFrench(moon.sign) : 'Non spécifié'}
Lune_Maison : ${moon ? getHouse(moon) : 'Non spécifié'}
${moon && getMainAspect(chart.aspects, 'moon') ? `Lune_Aspect : ${getMainAspect(chart.aspects, 'moon')}` : ''}
Venus_Signe : ${venus ? getSignInFrench(venus.sign) : 'Non spécifié'}
Venus_Maison : ${venus ? getHouse(venus) : 'Non spécifié'}
${venus && getMainAspect(chart.aspects, 'venus') ? `Venus_Aspect : ${getMainAspect(chart.aspects, 'venus')}` : ''}
Mars_Signe : ${mars ? getSignInFrench(mars.sign) : 'Non spécifié'}
Mars_Maison : ${mars ? getHouse(mars) : 'Non spécifié'}
${mars && getMainAspect(chart.aspects, 'mars') ? `Mars_Aspect : ${getMainAspect(chart.aspects, 'mars')}` : ''}
Jupiter_Signe : ${jupiter ? getSignInFrench(jupiter.sign) : 'Non spécifié'}
Jupiter_Maison : ${jupiter ? getHouse(jupiter) : 'Non spécifié'}
Saturne_Signe : ${saturn ? getSignInFrench(saturn.sign) : 'Non spécifié'}
Saturne_Maison : ${saturn ? getHouse(saturn) : 'Non spécifié'}
${saturn && getMainAspect(chart.aspects, 'saturn') ? `Saturne_Aspect : ${getMainAspect(chart.aspects, 'saturn')}` : ''}
NoeudNord_Signe : ${trueNode ? getSignInFrench(trueNode.sign) : 'Non spécifié'}
NoeudNord_Maison : ${trueNode ? getHouse(trueNode) : 'Non spécifié'}
${talents.length >= 1 ? `Talent1_Planète : ${talents[0].planet}\nTalent1_Signe : ${talents[0].sign}\nTalent1_Maison : ${talents[0].house}` : ''}
${talents.length >= 2 ? `Talent2_Planète : ${talents[1].planet}\nTalent2_Signe : ${talents[1].sign}\nTalent2_Maison : ${talents[1].house}` : ''}
${talents.length >= 3 ? `Talent3_Planète : ${talents[2].planet}\nTalent3_Signe : ${talents[2].sign}\nTalent3_Maison : ${talents[2].house}` : ''}
PointChance_PlanèteOuPoint : ${jupiter ? `Jupiter` : 'Jupiter'}
PointChance_Signe : ${jupiter ? getSignInFrench(jupiter.sign) : 'Non spécifié'}
PointChance_Maison : ${jupiter ? getHouse(jupiter) : 'Non spécifié'}

[ÂGE] : ${age}
[ASCENDANT_SIGNE] : ${ascendantSign ? getSignInFrench(ascendantSign) : 'Non spécifié'}
[Date atterrissage] : ${formattedDate}
[Heure atterrissage] : ${formattedTime}
[Lieu atterrissage] : ${formattedBirthPlace}

====================================================

RAPPEL FINAL

Tu produis uniquement le texte final du dialogue, sans aucun autre texte.`

  return { systemPrompt, userPrompt }
}
