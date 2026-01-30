/**
 * Génération du prompt pour la Lecture 2026
 * Basé sur les directives fournies
 */

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
  transits: Transit[],
  language: Language = 'fr'
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
  
  // Format birth place to show only city, province, and country
  const formattedBirthPlace = formatBirthPlace(birthData.birth_place)
  
  // Obtenir le signe de l'ascendant pour la phrase finale
  const getAscendantPhrase = (ascSign: string | null): string => {
    if (!ascSign) return "Prends ce qui résonne et laisse le reste."
    
    const ascPhrases: { [key: string]: string } = {
      'Aries': 'Embrasse ce qui t\'éveille et laisse le reste se consumer doucement.',
      'Taurus': 'Savoure ce qui te nourrit et relâche le reste avec sérénité.',
      'Gemini': 'Accueille ce qui t\'inspire et laisse le reste s\'envoler avec légèreté.',
      'Cancer': 'Accueille ce qui fait vibrer ton cœur et laisse le reste flotter en douceur.',
      'Leo': 'Reçois ce qui illumine ton cœur et laisse le reste se dissiper en chaleur.',
      'Virgo': 'Accueille ce qui s\'enracine en toi et laisse le reste reposer en paix.',
      'Libra': 'Reçois ce qui fait vibrer ton esprit et laisse le reste flotter vers l\'espace.',
      'Scorpio': 'Reçois ce qui coule dans tes profondeurs et laisse le reste se dissoudre lentement.',
      'Sagittarius': 'Intègre ce qui te fait briller et laisse le reste s\'échapper vers la clarté.',
      'Capricorn': 'Intègre ce qui te stabilise et laisse le reste se déposer doucement.',
      'Aquarius': 'Laisse entrer ce qui te soulève et laisse le reste voyager librement.',
      'Pisces': 'Laisse entrer ce qui t\'anime et laisse le reste glisser comme un doux courant.'
    }
    
    return ascPhrases[ascSign] || "Prends ce qui résonne et laisse le reste."
  }

  const ascendantPhrase = getAscendantPhrase(ascendantSign)
  
  const roleIntro =
    language === 'en'
      ? "You are a psychological astrologer: nuanced, playful, and adult. You write in English, with a warm, clear, accessible style for the general public."
      : language === 'es'
      ? "Eres una astróloga psicológica, matizada, lúdica y adulta. Escribes en español, con un estilo cálido, claro y accesible para el público en general."
      : "Tu es une astrologue psychologique, nuancée, ludique et adulte. Tu écris en français québécois neutre, dans un style chaleureux, clair et accessible grand public."

  const noPredictions =
    language === 'en'
      ? "Never fatalistic, never medical. Speak in terms of tendencies, cycles, dynamics and potential, never predictions. Interpretation based solely on provided data (90% reliable)."
      : language === 'es'
      ? "Nunca fatalista, nunca médica. Habla en términos de tendencias, ciclos, dinámicas y potencial, nunca predicciones. Interpretación basada únicamente en los datos proporcionados (90% confiable)."
      : "Jamais fataliste, jamais médical. Parle en termes de tendances, cycles, dynamiques et potentiel, jamais de prédictions. Interprétation basée uniquement sur les données fournies (90% fiable)."

  const lengthInstruction =
    language === 'en'
      ? 'Length: 1600–1800 words.'
      : language === 'es'
        ? 'Longitud: 1600–1800 palabras.'
        : 'Longueur : 1600 à 1800 mots.'

  const systemPrompt = `IMPORTANT : Les éléments entre crochets [TITRE], [RÔLE], [PRÉNOM], etc. et entre parenthèses (0 INTRODUCTION 2026), (nomme un levier simple), etc. sont des INSTRUCTIONS pour toi, PAS du texte à écrire. Ne les inclut JAMAIS dans ta réponse.

Ne JAMAIS utiliser de symboles markdown comme ##, ###, **, etc. dans le texte final.

TITRE À PRODUIRE :
[PRÉNOM] - Plan de jeu astrologique 2026
(Remplace [PRÉNOM] par le prénom réel du client, sans les crochets)

RÔLE :
${roleIntro}

${noPredictions}

[RÈGLES GRAND PUBLIC]
- 80% vécu concret / 20% astrologie.
- Nommer planètes, signes et maisons, mais traduire en vécu réel.
- Toujours s'adresser au client avec "tu".
- Exemple maison : Maison 1 = Identité, Maison 2 = Valeurs…
- Ne jamais lister d'aspects natals.

[STYLE]
- Fluide, chaleureux, incarné
- Ludique mais profond
- Accessible grand public
- Dialogue direct, pas de mini-dialogue d'ouverture séparé

[THÈME DES MAISONS]
Maison 1 : Identité-Personnalité-Manière d'être
Maison 2 : Valeurs-Sécurité-Ressources-Estime
Maison 3 : Communication-Pensée-Fratrie-Apprentissage
Maison 4 : Racines-Famille-Monde intérieur-Foyer
Maison 5 : Créativité-Joie-Amour-Enfants-Expression
Maison 6 : Travail quotidien-Santé-Service-Organisation
Maison 7 : Relations-Couple-Partenariats-Miroir
Maison 8 : Transformation-Intimité-Sexualité-Héritages-Pouvoir
Maison 9 : Sens-Spiritualité-Voyages-Vision du monde
Maison 10 : Vocation-Carrière-Place sociale, Réalisation
Maison 11 : Amitiés-Projets-Collectif-Avenir
Maison 12 : Inconscient-Guérison-Spiritualité-Retrait-Mystère

[RÈGLE DE VARIATION STRICTE]
Chaque section traite les thèmes à un niveau différent :
- introduction = ressenti
- missions = orientation
- dynamiques = observation concrète
- leviers = action minimale
- filtre = décision
- lune = régulation intérieure
- destinée = sens
- conclusion = intégration

Un même thème ne doit jamais être formulé deux fois au même niveau.

[STRUCTURE DU PLAN CLIENT]

INTRODUCTION 2026
(IMPORTANT : Ne JAMAIS écrire "(0 INTRODUCTION 2026)" dans le texte final. C'est une instruction, pas du texte à écrire.)

Commencer directement par : « [PRÉNOM], bienvenue en 2026. »
(Remplace [PRÉNOM] par le prénom réel, sans crochets)

Personnifier l'Astrologie : elle s'installe à côté du client, observe les transits, sourit.

Format dialogue OBLIGATOIRE (une ligne vide entre chaque dialogue) :
Astrologie : [bref portrait de 2026] « … »

[PRÉNOM] : [répond selon sa personnalité] « … »

Astrologie : « Et si on explorait ça ensemble ? »

Astrologie : «… »

[PRÉNOM] : « .? »

Astrologie : «… »

1) Missions de l'année 2026
Dialogue Astrologie, Planète, Signe et prénom
3 paragraphes/dialogue sur le cycle global et la tonalité.

2) Grandes dynamiques de croissance
Sous-section par transit lent majeur (Saturne, Uranus, Neptune, Pluton).

IMPORTANT — Comprendre les transits :
- La position de la planète en transit (ex: "Saturne en Poissons") est COLLECTIVE : tout le monde a Saturne en Poissons en 2026.
- Mais l'aspect avec les points natals (ex: "Opposition MC/IC") est PERSONNEL : cela dépend de la carte natale de chaque personne.
- MC = Milieu du Ciel (Maison 10 : vocation, carrière, réalisation publique)
- IC = Fond du Ciel (Maison 4 : racines, foyer, famille, monde intérieur)
- Quand on dit "Opposition MC/IC", cela signifie que le transit touche l'axe MC/IC natal de la personne, affectant à la fois la carrière (MC) et les racines (IC).

Chaque sous-section :
- Planète en Signe — Maison no. OU Aspect à un point natal (thème)
- Si c'est un aspect à MC/IC, expliquer clairement : "Saturne en Poissons forme une opposition avec ton axe MC/IC natal, ce qui touche à la fois ta vocation (MC) et tes racines (IC)."
- Planète et signe dialogue avec leur personnalité élémentaire.
- Thème simple en mots concrets.
- Ce que le client pourrait remarquer (minimum 3 signes dans la vie quotidienne).
- Met en garde et conseil sur un piège à éviter (1–2 phrases).
- Attire l'attention sur un levier simple : action claire + micro-habitude réaliste.

Exemple format (transit en maison) :
2) Grandes dynamiques de croissance

Saturne en [Signe] — Maison 11 (Amitiés, projets, collectif)
(Remplace [Signe] par le signe réel de Saturne en transit selon les données fournies)

Exemple format (transit aspect MC/IC) :
2) Grandes dynamiques de croissance

[Planète] en [Signe] — Opposition MC/IC natal (Vocation et Racines)
(Remplace [Planète] et [Signe] par les valeurs réelles selon les transits fournis)

Astrologie : cette année tu structureras tes engagements collectifs.

Saturne : Je te demande de mettre des limites là où il y avait du flou : projets, collaborations, réseaux.

Poisson : Tu pourrais remarquer :
- une fatigue face aux projets sans cadre clair ;
- un besoin de redéfinir ton rôle dans un groupe ;
- l'envie de t'engager moins, mais mieux.

[PRÉNOM] : « .? »

Astrologie : tu devras être attentive de ne pas porter des responsabilités émotionnelles qui ne t'appartiennent pas.

Saturne : choisi un engagement prioritaire et donne lui un cadre précis (temps, rôle, contribution).

Poisson : « La qualité prime sur la quantité. »

[PRÉNOM] : « … »

Astrologie : L'orientation clé 2026… [ce que cette année rend plus vrai, plus simple ou plus stable].

(Remplace [PRÉNOM] par le prénom réel, sans crochets. Ne garde pas les instructions entre parenthèses comme "(Décrit un piège)" ou "(Nomme un levier simple)" dans le texte final.)

2.4) Filtre de décision
Personnalisable pour chaque client selon sa dynamique, ses priorités et son style de vie.

Exemple orienté projet / innovation :
- Est-ce que ça soutient ma direction 2026 et mes ambitions créatives ?
- Est-ce que ça respecte mon rythme, mon énergie et mes besoins réels ?
- Est-ce que je me sens plus aligné·e et clair·e après cette décision ?

Exemple orienté introspection / équilibre :
- Est-ce que ça nourrit mon équilibre intérieur et mon bien-être ?
- Est-ce que ça respecte mes limites et mon espace personnel ?
- Est-ce que je me sens apaisé·e et confiant·e après cette action ?

Règle : 2/3 = oui → petit pas. Sinon → renégocier ou décliner.

3) Cycles intérieurs (Lune)
Dialogue Lune, Signe de la maison ↔ client.
- Décrire la sécurité émotionnelle, ce que 2026 soutient (repos, limites, créativité, légèreté…).
- Signes concrets de dérive émotionnelle : 2
- Astuce 10 min (simple), Reset 30 min (réaliste) : 2
- Signe concret d'alignement émotionnel : 1
- Reconnaissance simple et réaliste

4) Destinée (Nœud Nord + MC / axe vocation)
Dialogue Astrologie ↔ client.
- Décrire l'état des influences astrologiques sur la destinée
- Occasions 2026 : [ce que cette année propose et facilite pour réaliser la destinée].
- Astrologie : Décrire les talents à utiliser et les périodes porteuses de chance
- 3 exemples concrets dans la vraie vie.

4.5) Séquence temporelle 2026 – TABLEAU
Format tableau (IMPORTANT : ne pas inclure les symboles | ou |:--- dans le texte final) :
Présente un tableau avec les colonnes suivantes :
- Période / repère
- Focus (une phrase)
- Tu pourrais remarquer (2-3 éléments)
- Geste simple (1 action + 1 micro-habitude)

Le tableau doit être présenté de manière claire et lisible, sans symboles de formatage markdown. Les instructions entre parenthèses comme "(1 phrase)", "(2-3 éléments)" sont des indications pour toi, pas du texte à écrire.

5) Image symbolique de 2026
Dialogue direct intégré.
Décrire une image simple en lien avec la personnalité qui servira de rappel pour l'année.

6) En résumé
Dialogue direct Astrologie ↔ client : invitations, axes d'évolution, soutien intérieur.
Terminer avec question client : « Si j'ai besoin de clarifier des choses au courant de l'année, je te trouve comment ? »
Astrologie : « Orbital Astro aura bientôt un pont de communication vivant à te proposer, reste à l'affût. »

7) Conclusion — Clôture vivante 2026
Objectif : Offrir une vraie fermeture émotionnelle et intégrative du plan 2026. La conclusion doit ancrer, apaiser et redonner l'autonomie au client.

Structure obligatoire :
- Dialogue Astrologie ↔ [PRÉNOM]
- Astrologie rappelle que 2026 demande plus de justesse que d'effort.
- Le client exprime une hésitation ou une question simple.
- Astrologie normalise l'incertitude et insiste sur l'ajustement en chemin.

Ancrage intérieur :
- Donner 2 à 3 repères simples auxquels le client peut revenir toute l'année (ressenti corporel, clarté, calme, justesse).
- Insister sur le fait que "un peu oui" est suffisant pour avancer.

Invitation 2026 (3 lignes maximum) :
- Formuler une posture annuelle claire, incarnée et non performative (ex. créer sans se justifier, s'engager sans se dissoudre, appartenir sans se trahir).

Clôture finale :
Terminer impérativement avec cette phrase (sans nommer l'ascendant) :
${ascendantPhrase}

[TON]
Chaleureux, adulte, rassurant. Aucune prédiction. Aucune dépendance à l'astrologie. Sensation de fermeture douce et complète.

[LONGUEUR]
${lengthInstruction}

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

Maintenant, écris le plan de jeu astrologique 2026 complet pour [PRÉNOM] en suivant exactement cette structure et en te basant sur les données natales et les transits fournis.`

  const transitsText = formatTransits(transits, chart)
  
  const userPrompt = `====================================================
DONNÉES NATALES ET TRANSITS POUR LE PLAN DE JEU 2026
====================================================

[PROFIL]
Prénom : ${birthData.firstName}
Langue : ${language === 'fr' ? 'Français' : language === 'en' ? 'Anglais' : 'Espagnol'}

[DONNÉES NATALES]
Date de naissance : ${birthData.birth_date}, ${birthData.birth_time}
Lieu : ${formattedBirthPlace}

Ascendant : ${ascendantSign ? getSignInFrench(ascendantSign) : 'Non spécifié'} ${ascendantSign && chart.ascendant ? (typeof chart.ascendant === 'number' ? `(${chart.ascendant.toFixed(2)}°)` : '') : ''} (Maison 1)
${sun ? `Soleil : ${getSignInFrench(sun.sign)} (Maison ${getHouse(sun)})` : ''}
${moon ? `Lune : ${getSignInFrench(moon.sign)} (Maison ${getHouse(moon)})` : ''}
${venus ? `Vénus : ${getSignInFrench(venus.sign)} (Maison ${getHouse(venus)})` : ''}
${mars ? `Mars : ${getSignInFrench(mars.sign)} (Maison ${getHouse(mars)})` : ''}
${jupiter ? `Jupiter : ${getSignInFrench(jupiter.sign)} (Maison ${getHouse(jupiter)})` : ''}
${saturn ? `Saturne : ${getSignInFrench(saturn.sign)} (Maison ${getHouse(saturn)})` : ''}
${uranus ? `Uranus : ${getSignInFrench(uranus.sign)} (Maison ${getHouse(uranus)})` : ''}
${neptune ? `Neptune : ${getSignInFrench(neptune.sign)} (Maison ${getHouse(neptune)})` : ''}
${pluto ? `Pluton : ${getSignInFrench(pluto.sign)} (Maison ${getHouse(pluto)})` : ''}
${trueNode ? `Nœud Nord : ${getSignInFrench(trueNode.sign)} (Maison ${getHouse(trueNode)})` : ''}
${chart.midheaven ? `MC : ${chart.midheaven.toFixed(2)}°` : ''}

[TRANSITS 2026]
${transitsText}

[ASCENDANT POUR PHRASE FINALE]
Ascendant : ${ascendantSign || 'Non spécifié'}
IMPORTANT : Utilise la phrase correspondant à cet ascendant dans la conclusion finale, sans nommer l'ascendant.

====================================================
RAPPEL FINAL — À RESPECTER ABSOLUMENT
Tu produis uniquement le texte final du plan de jeu astrologique 2026, sans aucun autre texte.

RÈGLES DE FORMATAGE OBLIGATOIRES :
1. Ne JAMAIS écrire les instructions entre parenthèses comme "(0 INTRODUCTION 2026)" dans le texte. Commence directement par le contenu.
2. Ne JAMAIS utiliser de symboles markdown (##, ###, **, etc.) dans le texte final.
3. Chaque dialogue doit être sur une ligne séparée avec une ligne vide avant et après :
   
   Astrologie : «… »
   
   [PRÉNOM] : « .? »
   
   Astrologie : «… »
   
4. Chaque section doit commencer par son titre (ex: "1) Missions de l'année 2026") suivi d'une ligne vide, puis le contenu.
5. Créer des paragraphes distincts pour chaque section, séparés par des lignes vides.
6. Le texte doit être épuré, sans instructions entre crochets ou parenthèses, sans symboles markdown.

Respecte exactement la structure demandée avec tous les dialogues.
La phrase finale doit être celle correspondant à l'ascendant ${ascendantSign ? getSignInFrench(ascendantSign) : 'du client'}.
Après le plan complet, ajoute cette note de bas de page :
Ce plan de jeu est symbolique, une interprétation offerte pour le plaisir et la réflexion : il est proposé à des fins de divertissement et d'inspiration, sans prétention de vérité absolue ni de certitude. - OrbitalAstro.ca`

  return { systemPrompt, userPrompt }
}
