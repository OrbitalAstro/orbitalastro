/**
 * Profil de tempérament / réception pour le journal — dérivé de la carte natale.
 * Sert à caler le ton d’« Astrologie » (personnalité, sensibilité, énergie).
 */

type NatalPlanet = { longitude?: number; sign?: string; house?: number }
type NatalLike = {
  planets?: Record<string, NatalPlanet>
  houses?: Record<string, number>
  ascendant?: number | { sign?: string; longitude?: number }
}

type Element = 'Feu' | 'Terre' | 'Air' | 'Eau'
type Modality = 'Cardinal' | 'Fixe' | 'Mutable'

const ELEMENT_BY_SIGN: Record<string, Element> = {
  Bélier: 'Feu',
  Taureau: 'Terre',
  Gémeaux: 'Air',
  Cancer: 'Eau',
  Lion: 'Feu',
  Vierge: 'Terre',
  Balance: 'Air',
  Scorpion: 'Eau',
  Sagittaire: 'Feu',
  Capricorne: 'Terre',
  Verseau: 'Air',
  Poissons: 'Eau',
}

const SIGN_EN_TO_FR: Record<string, string> = {
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

const MODALITY_BY_SIGN: Record<string, Modality> = {
  Bélier: 'Cardinal',
  Taureau: 'Fixe',
  Gémeaux: 'Mutable',
  Cancer: 'Cardinal',
  Lion: 'Fixe',
  Vierge: 'Mutable',
  Balance: 'Cardinal',
  Scorpion: 'Fixe',
  Sagittaire: 'Mutable',
  Capricorne: 'Cardinal',
  Verseau: 'Fixe',
  Poissons: 'Mutable',
}

/** Indices courts par signe (énergie, sensibilité, ton conseillé pour Astrologie). */
const SIGN_TEMPERAMENT: Record<
  string,
  { energie: string; sensibilite: string; tonAstrologie: string }
> = {
  Bélier: {
    energie: 'directe, entraînante, impatiente par moments',
    sensibilite: 'réagit vite ; besoin qu’on respecte son élan sans la brider',
    tonAstrologie: 'franc, stimulant, peu de détours ; valider le courage avant de nuancer',
  },
  Taureau: {
    energie: 'stable, sensuelle, lente à démarrer mais tenace',
    sensibilite: 'réceptive au corps, au concret, à la sécurité ; allergique au brusque',
    tonAstrologie: 'ancré, rassurant, concret ; pas de précipitation ni de jargon froid',
  },
  Gémeaux: {
    energie: 'vive, curieuse, multi-fil',
    sensibilite: 'intellect et mouvement ; s’ennuie si c’est trop lourd ou répétitif',
    tonAstrologie: 'léger, clair, dialogique ; plusieurs angles courts plutôt qu’un monologue',
  },
  Cancer: {
    energie: 'protectrice, cyclique, tournée vers le lien',
    sensibilite: 'fine, mémoire émotionnelle ; besoin de douceur avant le conseil',
    tonAstrologie: 'chaleureux, enveloppant ; nommer le ressenti avant la structure',
  },
  Lion: {
    energie: 'rayonnante, créative, fière',
    sensibilite: 'blessure si on la rabaisse ; besoin de reconnaissance sincère',
    tonAstrologie: 'généreux, valorisant ; éviter le ton sec ou condescendant',
  },
  Vierge: {
    energie: 'discernante, utile, orientée amélioration',
    sensibilite: 'anxieuse si trop flou ; besoin de précision et de sens pratique',
    tonAstrologie: 'sobre, structuré, utile ; une piste concrète vaut mieux qu’une grande image',
  },
  Balance: {
    energie: 'harmonisante, relationnelle, en quête d’équilibre',
    sensibilite: 'sensible au ton et à l’injustice perçue ; besoin de beauté dans les mots',
    tonAstrologie: 'élégant, équilibré ; présenter les deux versants sans juger',
  },
  Scorpion: {
    energie: 'intense, transformatrice, profonde',
    sensibilite: 'très réceptive aux sous-textes ; déteste le superficiel ou le faux-semblant',
    tonAstrologie: 'honnête, dense sans dramatiser ; aller au vrai, pas au small talk',
  },
  Sagittaire: {
    energie: 'expansive, optimiste, en quête de sens',
    sensibilite: 'besoin d’espace et de perspective ; étouffe si on micro-contrôle',
    tonAstrologie: 'ouvert, visionnaire, avec une touche d’humour ; relier au sens plus qu’au détail',
  },
  Capricorne: {
    energie: 'structurante, ambitieuse, réservée',
    sensibilite: 'fierté et pudeur ; respecte la compétence et le concret',
    tonAstrologie: 'posé, crédible, orienté résultat ; pas de familiarité forcée ni de flou',
  },
  Verseau: {
    energie: 'originale, détachée par moments, tournée vers l’avenir',
    sensibilite: 'réagit à l’authenticité et à la liberté ; fuit la morale lourde',
    tonAstrologie: 'neutre-chaleureux, lucide ; idées neuves plutôt que pathos',
  },
  Poissons: {
    energie: 'fluide, imaginative, perméable',
    sensibilite: 'très émotionnelle et intuitive ; besoin de douceur et de symboles clairs',
    tonAstrologie: 'poétique mais ancré ; éviter le ton dur, le cynisme ou la surcharge technique',
  },
}

const ELEMENT_ADAPTATION: Record<Element, string> = {
  Feu: 'Priorité : élan, courage, mouvement. Parle avec chaleur et franchise ; évite le ton professoral ou trop prudent.',
  Terre:
    'Priorité : stabilité, corps, étapes concrètes. Parle posément ; une action claire vaut mieux qu’une avalanche d’images.',
  Air: 'Priorité : clarté, échange, options. Rythme vif ; laisse de la place aux questions et aux nuances.',
  Eau: 'Priorité : ressenti, sécurité, profondeur. Commence par accueillir l’émotion ; ne précipite pas le conseil.',
}

const MODALITY_ADAPTATION: Record<Modality, string> = {
  Cardinal: 'Aime qu’on ouvre une direction et qu’on propose un premier pas.',
  Fixe: 'Aime la constance et la loyauté dans le ton ; évite les revirements brusques.',
  Mutable: 'Aime la souplesse et les formulations ouvertes ; évite les verdicts fermés.',
}

function normSign(sign?: string): string {
  if (!sign) return ''
  const raw = sign.trim()
  const s = SIGN_EN_TO_FR[raw] || raw
  return ELEMENT_BY_SIGN[s] ? s : ''
}

function dominantElement(signs: string[]): Element | null {
  const counts: Record<Element, number> = { Feu: 0, Terre: 0, Air: 0, Eau: 0 }
  for (const sign of signs) {
    const el = ELEMENT_BY_SIGN[sign]
    if (el) counts[el] += 1
  }
  const entries = Object.entries(counts) as [Element, number][]
  entries.sort((a, b) => b[1] - a[1])
  if (entries[0][1] === 0) return null
  return entries[0][0]
}

function placementLine(label: string, sign?: string, house?: number): string | null {
  const s = normSign(sign)
  if (!s) return null
  const houseBit = house ? `, maison ${house}` : ''
  const t = SIGN_TEMPERAMENT[s]
  if (!t) return `${label} en ${s}${houseBit}.`
  return `${label} en ${s}${houseBit} — énergie ${t.energie} ; sensibilité : ${t.sensibilite}.`
}

function ascSignFromNatal(natal: NatalLike): string {
  const asc = natal.ascendant
  if (typeof asc === 'object' && asc?.sign) return normSign(asc.sign)
  if (typeof asc === 'number') {
    const idx = Math.min(11, Math.floor((((asc % 360) + 360) % 360) / 30))
    const signs = [
      'Bélier',
      'Taureau',
      'Gémeaux',
      'Cancer',
      'Lion',
      'Vierge',
      'Balance',
      'Scorpion',
      'Sagittaire',
      'Capricorne',
      'Verseau',
      'Poissons',
    ]
    return signs[idx]
  }
  return ''
}

/**
 * Lignes pour le bloc « PROFIL PERSONNEL » injecté dans le contexte astro du journal.
 */
export function buildJournalPersonalityProfile(natal: NatalLike): string[] {
  const planets = natal.planets || {}
  const sun = planets.sun
  const moon = planets.moon
  const mercury = planets.mercury
  const venus = planets.venus
  const mars = planets.mars
  const ascSign = ascSignFromNatal(natal)

  const coreSigns = [sun?.sign, moon?.sign, mercury?.sign, venus?.sign, mars?.sign, ascSign]
    .map((s) => normSign(s))
    .filter(Boolean)

  const lines: string[] = []

  const dom = dominantElement(coreSigns)
  if (dom) {
    lines.push(`Tempérament global (élément dominant ${dom} parmi Soleil–Lune–Mercure–Vénus–Mars–Asc) : ${ELEMENT_ADAPTATION[dom]}`)
  }

  const sunS = normSign(sun?.sign)
  const moonS = normSign(moon?.sign)
  if (sunS && moonS && ELEMENT_BY_SIGN[sunS] && ELEMENT_BY_SIGN[moonS]) {
    const blend =
      sunS === moonS
        ? `Soleil et Lune même signe (${sunS}) : personnalité et ressenti alignés — un seul ton suffit, mais ne néglige pas la nuance intérieure.`
        : `Soleil (${sunS}) + Lune (${moonS}) : distinguer l’élan conscient (Soleil) du besoin émotionnel (Lune) dans ta manière de parler.`
    lines.push(blend)
  }

  for (const row of [
    placementLine('Identité / vitalité (Soleil)', sun?.sign, sun?.house),
    placementLine('Sensibilité / besoins (Lune)', moon?.sign, moon?.house),
    placementLine('Énergie en relation (Ascendant)', ascSign || undefined, 1),
    placementLine('Mental / échange (Mercure)', mercury?.sign, mercury?.house),
    placementLine('Affect / réceptivité (Vénus)', venus?.sign, venus?.house),
    placementLine('Action / drive (Mars)', mars?.sign, mars?.house),
  ]) {
    if (row) lines.push(row)
  }

  const modalitySigns = [sunS, moonS, ascSign].filter(Boolean)
  const modCounts: Record<Modality, number> = { Cardinal: 0, Fixe: 0, Mutable: 0 }
  for (const s of modalitySigns) {
    const m = MODALITY_BY_SIGN[s]
    if (m) modCounts[m] += 1
  }
  const topMod = (Object.entries(modCounts) as [Modality, number][]).sort((a, b) => b[1] - a[1])[0]
  if (topMod && topMod[1] > 0) {
    lines.push(`Rythme d’engagement (${topMod[0]}) : ${MODALITY_ADAPTATION[topMod[0]]}`)
  }

  const tonHints: string[] = []
  if (moonS && SIGN_TEMPERAMENT[moonS]) tonHints.push(`Lune → ${SIGN_TEMPERAMENT[moonS].tonAstrologie}`)
  if (sunS && SIGN_TEMPERAMENT[sunS]) tonHints.push(`Soleil → ${SIGN_TEMPERAMENT[sunS].tonAstrologie}`)
  if (ascSign && SIGN_TEMPERAMENT[ascSign] && ascSign !== sunS && ascSign !== moonS) {
    tonHints.push(`Ascendant → ${SIGN_TEMPERAMENT[ascSign].tonAstrologie}`)
  }

  if (tonHints.length > 0) {
    lines.push(
      'Comment « Astrologie » doit te parler (synthèse — à incarner dans chaque ligne Astrologie :, pas à réciter mot pour mot) :',
    )
    for (const h of tonHints) lines.push(`  · ${h}`)
  }

  lines.push(
    'Règle d’incarnation : la personne doit sentir que tu la connais par le **ton** (chaleur, rythme, profondeur, humour ou sobriété), pas en répétant sa carte. Les planètes en voix « je » gardent leur personnalité ; **Astrologie** est la voix qui **s’ajuste à elle**.',
  )

  if (lines.length <= 1) {
    return [
      'Profil personnel non déterminé avec précision (données natales incomplètes). Adopte un ton chaleureux, attentif au ressenti, concret quand elle pose une question pratique — puis affine selon ses messages et la mémoire du compte.',
    ]
  }

  return lines
}
