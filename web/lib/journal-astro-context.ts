/** Contexte natal + transits pour le journal / clavardage (appel API Python). */

import {
  buildJournalNextExactCacheKey,
  loadJournalNextExactCache,
  saveJournalNextExactCache,
  type NextExactHitJson,
} from '@/lib/journal-next-exact-cache'
import { journalMessageWantsNextExactDates } from '@/lib/journal-timing-intent'
import { withJournalTransitBasisCache } from '@/lib/journal-transit-basis-cache'

export type JournalUserForAstro = {
  birth_date: string
  birth_time: string
  birth_place: string
  latitude: number
  longitude: number
  timezone?: string | null
}

type NatalPlanet = { longitude?: number; sign?: string; house?: number }
type NatalResponse = {
  planets?: Record<string, NatalPlanet>
  ascendant?: number | { sign?: string; longitude?: number }
  midheaven?: number
}

export type TransitAngleRow = Transit & { angle?: string }

export type JournalTransit = {
  transiting_body?: string
  natal_body?: string
  aspect?: string
  orb_deg?: number
  applying?: boolean
  exact?: boolean
}

type Transit = JournalTransit

const ZODIAC_FR = [
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
] as const

export const JOURNAL_BODY_FR: Record<string, string> = {
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
  true_node: 'Nœud nord',
  north_node: 'Nœud nord',
  chiron: 'Chiron',
}

function bodyLabelFr(key: string): string {
  const k = key.toLowerCase()
  return JOURNAL_BODY_FR[k] || k
}

function longitudeToSignFr(longitude: number): { sign: string; degInSign: number } {
  const lon = ((longitude % 360) + 360) % 360
  const idx = Math.min(11, Math.floor(lon / 30))
  const degInSign = Math.round((lon - idx * 30) * 10) / 10
  return { sign: ZODIAC_FR[idx], degInSign }
}

function formatSnapshotInTimezone(isoUtc: string, timeZone: string): string {
  try {
    return new Date(isoUtc).toLocaleString('fr-CA', {
      timeZone: timeZone || 'UTC',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    })
  } catch {
    return isoUtc
  }
}

export function getJournalApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')
}

export type JournalNextExactHit = {
  transiting_body: string
  natal_body: string
  aspect: string
  exact_utc: string
  min_orb_deg: number
}

export function formatJournalNextExactLine(hit: JournalNextExactHit, timeZone: string): string {
  try {
    const d = new Date(hit.exact_utc)
    const local = d.toLocaleString('fr-CA', {
      timeZone: timeZone || 'UTC',
      dateStyle: 'long',
      timeStyle: 'short',
      timeZoneName: 'short',
    })
    const tb = bodyLabelFr(hit.transiting_body)
    const nb = bodyLabelFr(hit.natal_body)
    return `- ${tb} ${hit.aspect} natal ${nb} → prochain passage à l’orbe minimale (calcul éphemerides) : ${local} (orbe ~${hit.min_orb_deg}° ; réf. UTC ${hit.exact_utc})`
  } catch {
    return `- ${hit.transiting_body} ${hit.aspect} ${hit.natal_body} → ${hit.exact_utc}`
  }
}

export async function fetchNextExactTimesFromBackend(
  natalPositions: Record<string, number>,
  natalAsc: number | null | undefined,
  natalMc: number | null | undefined,
  hints: { transiting_body: string; natal_body: string; aspect: string }[],
  fromIso: string,
  horizonDays = 540,
): Promise<JournalNextExactHit[]> {
  if (hints.length === 0) return []
  try {
    const res = await fetch(`${getJournalApiBaseUrl()}/api/transits/next-exact-times`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        natal_positions: natalPositions,
        natal_asc: natalAsc ?? undefined,
        natal_mc: natalMc ?? undefined,
        from_date: fromIso,
        hints,
        horizon_days: horizonDays,
      }),
    })
    if (!res.ok) return []
    const json = (await res.json()) as { exacts?: JournalNextExactHit[] }
    return Array.isArray(json.exacts) ? json.exacts : []
  } catch {
    return []
  }
}

async function fetchNextExactTimesWithCache(
  natalPositions: Record<string, number>,
  natalAsc: number | null | undefined,
  natalMc: number | null | undefined,
  hints: { transiting_body: string; natal_body: string; aspect: string }[],
  fromIso: string,
  horizonDays: number,
): Promise<JournalNextExactHit[]> {
  if (hints.length === 0) return []
  const cacheKey = buildJournalNextExactCacheKey({
    natalPositions,
    natalAsc,
    natalMc,
    hints,
    fromIso,
    horizonDays,
  })
  const cached = await loadJournalNextExactCache(cacheKey)
  if (cached && cached.length > 0) {
    return cached as JournalNextExactHit[]
  }
  const exacts = await fetchNextExactTimesFromBackend(
    natalPositions,
    natalAsc,
    natalMc,
    hints,
    fromIso,
    horizonDays,
  )
  if (exacts.length > 0) {
    await saveJournalNextExactCache(cacheKey, exacts as NextExactHitJson[])
  }
  return exacts
}

function formatTransitLine(transit: Transit): string {
  const tBody = (transit.transiting_body || '').toLowerCase()
  const nBody = (transit.natal_body || '').toLowerCase()
  const aspect = transit.aspect || 'aspect'
  const orb = typeof transit.orb_deg === 'number' ? ` (orb ${transit.orb_deg.toFixed(2)}°)` : ''
  return `${tBody} ${aspect} ${nBody}${orb}`
}

function formatTransitTimingLine(transit: Transit): string {
  const base = formatTransitLine(transit)
  if (transit.exact === true) {
    return `${base} · exact maintenant`
  }
  if (transit.applying === true) {
    return `${base} · en approche (l’orbe se resserre)`
  }
  if (transit.applying === false) {
    return `${base} · en séparation (l’orbe s’élargit)`
  }
  return base
}

function majorTransitScore(t: Transit): number {
  const slowBodies = ['saturn', 'uranus', 'neptune', 'pluto']
  const keyNatal = [
    'sun',
    'moon',
    'ascendant',
    'midheaven',
    'asc',
    'mc',
    'ic',
    'dsc',
    'jupiter',
    'saturn',
    'true_node',
    'north_node',
  ]
  const isSlow = slowBodies.includes((t.transiting_body || '').toLowerCase())
  const isMajorAspect = ['conjunction', 'opposition', 'square', 'trine'].includes((t.aspect || '').toLowerCase())
  const isKeyNatal = keyNatal.includes((t.natal_body || '').toLowerCase())
  return (isSlow ? 2 : 0) + (isMajorAspect ? 1 : 0) + (isKeyNatal ? 1 : 0)
}

function buildNatalSummary(natal: NatalResponse): string {
  const planets = natal.planets || {}
  const sun = planets.sun
  const moon = planets.moon
  const venus = planets.venus
  const mars = planets.mars
  const jupiter = planets.jupiter
  const saturn = planets.saturn
  const ascendantSign =
    typeof natal.ascendant === 'object' && natal.ascendant?.sign
      ? natal.ascendant.sign
      : undefined

  const parts = [
    sun?.sign ? `Soleil ${sun.sign} maison ${sun.house}` : null,
    moon?.sign ? `Lune ${moon.sign} maison ${moon.house}` : null,
    venus?.sign ? `Vénus ${venus.sign} maison ${venus.house}` : null,
    mars?.sign ? `Mars ${mars.sign} maison ${mars.house}` : null,
    jupiter?.sign ? `Jupiter ${jupiter.sign} maison ${jupiter.house}` : null,
    saturn?.sign ? `Saturne ${saturn.sign} maison ${saturn.house}` : null,
    ascendantSign ? `Ascendant ${ascendantSign}` : null,
  ].filter(Boolean)

  return parts.length > 0 ? parts.join(' | ') : 'Résumé natal indisponible'
}

/** Aspects classés conservés pour indices next-exact (au-delà des lignes affichées). */
const JOURNAL_TRANSIT_RANK_CAP = 36
/** Lignes « aspects majeurs » dans le prompt (léger) ; le reste sert aux calculs d’orbe. */
const JOURNAL_TRANSIT_DISPLAY_LINES = 8

async function computeJournalTransitBasisCore(user: JournalUserForAstro): Promise<{
  natalSummary: string
  majorTransitSummary: string
  majorTransits: string[]
  targetDate: string
  natalPositions: Record<string, number>
  natalAsc: number | undefined
  natalMc: number | undefined
  majorTransitObjects: JournalTransit[]
  transitsPayload: Record<string, unknown>
  natalData: NatalResponse
  tz: string
}> {
  const apiBase = getJournalApiBaseUrl()
  const now = new Date()
  const targetDate = now.toISOString()

  const natalResponse = await fetch(`${apiBase}/natal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      birth_date: user.birth_date,
      birth_time: user.birth_time,
      birth_place: user.birth_place,
      birth_city: user.birth_place,
      latitude: user.latitude,
      longitude: user.longitude,
      timezone: user.timezone || 'UTC',
      include_extra_objects: true,
    }),
  })

  if (!natalResponse.ok) {
    const errText = await natalResponse.text()
    throw new Error(`Erreur natal API: ${errText}`)
  }

  const natalData = (await natalResponse.json()) as NatalResponse
  const natalPositions: Record<string, number> = {}
  Object.entries(natalData.planets || {}).forEach(([key, value]) => {
    if (typeof value?.longitude === 'number') {
      natalPositions[key] = value.longitude
    }
  })

  const natalAsc = typeof natalData.ascendant === 'number' ? natalData.ascendant : natalData.ascendant?.longitude
  const natalMc = typeof natalData.midheaven === 'number' ? natalData.midheaven : undefined

  const transitsResponse = await fetch(`${apiBase}/api/transits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      natal_positions: natalPositions,
      natal_asc: natalAsc ?? null,
      natal_mc: natalMc ?? null,
      target_date: targetDate,
      latitude: user.latitude,
      longitude: user.longitude,
      house_system: 'placidus',
      include_angles: true,
    }),
  })

  if (!transitsResponse.ok) {
    const errText = await transitsResponse.text()
    throw new Error(`Erreur transits API: ${errText}`)
  }

  const transitsPayload = (await transitsResponse.json()) as Record<string, unknown>
  const angleToNatal: Record<string, string> = { ASC: 'asc', MC: 'mc', IC: 'ic', DSC: 'dsc' }
  const allTransits: Transit[] = [
    ...((transitsPayload.transits as Transit[]) || []),
    ...(((transitsPayload.transits_to_angles as TransitAngleRow[]) || []).map((t) => {
      const ak = (t.angle || '').toUpperCase()
      const fromAngle = angleToNatal[ak]
      return {
        ...t,
        natal_body: fromAngle || (t.natal_body || '').toLowerCase() || 'asc',
      }
    })),
  ]

  const ranked = allTransits
    .map((t) => ({ t, score: majorTransitScore(t) }))
    .sort((a, b) => b.score - a.score || (a.t.orb_deg || 999) - (b.t.orb_deg || 999))
    .slice(0, JOURNAL_TRANSIT_RANK_CAP)

  const majorTransitObjects = ranked.map((x) => x.t)
  const displayTransits = ranked.slice(0, JOURNAL_TRANSIT_DISPLAY_LINES).map((x) => x.t)
  const majorTransits = displayTransits.map((t) => formatTransitTimingLine(t))
  const majorTransitSummary =
    majorTransits.length > 0 ? majorTransits.join('\n- ') : 'Aucun transit majeur filtré.'

  return {
    natalSummary: buildNatalSummary(natalData),
    majorTransitSummary,
    majorTransits,
    targetDate,
    natalPositions,
    natalAsc,
    natalMc,
    majorTransitObjects,
    transitsPayload,
    natalData,
    tz: user.timezone || 'UTC',
  }
}

/** Natal + transits ; mis en cache mémoire par profil × ~5 min pour limiter les appels Python. */
export function computeJournalTransitBasis(user: JournalUserForAstro): Promise<{
  natalSummary: string
  majorTransitSummary: string
  majorTransits: string[]
  targetDate: string
  natalPositions: Record<string, number>
  natalAsc: number | undefined
  natalMc: number | undefined
  majorTransitObjects: JournalTransit[]
  transitsPayload: Record<string, unknown>
  natalData: NatalResponse
  tz: string
}> {
  return withJournalTransitBasisCache(user, () => computeJournalTransitBasisCore(user))
}

/**
 * Même logique que le bloc « Prochains passages » injecté dans `fetchJournalAstroContext` ;
 * exposé pour l’API / le bouton « Lancer le calcul » (affichage ou collage manuel).
 */
export async function computeJournalNextExactTimes(
  user: JournalUserForAstro,
  options?: { horizonDays?: number; hintLimit?: number; transitRankLimit?: number },
): Promise<{
  exacts: JournalNextExactHit[]
  linesFr: string[]
  referenceIso: string
  hintsUsed: { transiting_body: string; natal_body: string; aspect: string }[]
}> {
  const basis = await computeJournalTransitBasis(user)
  const hintLimit = options?.hintLimit ?? 20
  const horizonDays = options?.horizonDays ?? 540

  const hints = basis.majorTransitObjects
    .slice(0, hintLimit)
    .map((t) => ({
      transiting_body: (t.transiting_body || '').toLowerCase(),
      natal_body: (t.natal_body || '').toLowerCase(),
      aspect: (t.aspect || '').toLowerCase(),
    }))
    .filter((h) => h.transiting_body && h.natal_body && h.aspect)

  const exacts = await fetchNextExactTimesWithCache(
    basis.natalPositions,
    basis.natalAsc,
    basis.natalMc,
    hints,
    basis.targetDate,
    horizonDays,
  )

  const linesFr = exacts.map((h) => formatJournalNextExactLine(h, basis.tz))

  return {
    exacts,
    linesFr,
    referenceIso: basis.targetDate,
    hintsUsed: hints,
  }
}

export type JournalAstroContext = {
  natalSummary: string
  majorTransitSummary: string
  majorTransits: string[]
  targetDate: string
  /** Date lisible + ciel à l’instant T + aspects détaillés (pour prévisions / cycles). */
  astroTimingBlock: string
}

/** Politique du bloc « prochains passages » (calcul lourd + cache Supabase). */
export type JournalAstroContextPolicy = {
  /** Texte du message courant : sert à `nextExactPolicy: 'auto'`. */
  userMessage?: string
  /**
   * always : toujours calculer (indices élargis sauf surcharge).
   * never : jamais (économie maximale).
   * auto : si userMessage absent → calculer (comportement sûr pour appels sans texte) ;
   *        si présent → calcul seulement si le message ressemble à une question timing / transits.
   */
  nextExactPolicy?: 'always' | 'never' | 'auto'
  nextExactHintLimit?: number
}

export async function fetchJournalAstroContext(
  user: JournalUserForAstro,
  policy?: JournalAstroContextPolicy,
): Promise<JournalAstroContext> {
  const nextExactPolicy = policy?.nextExactPolicy ?? 'auto'
  const fromUserMsg = policy?.userMessage?.trim() ?? ''
  const detected = fromUserMsg.length > 0 && journalMessageWantsNextExactDates(fromUserMsg)

  let includeNextExact = true
  if (nextExactPolicy === 'never') includeNextExact = false
  else if (nextExactPolicy === 'always') includeNextExact = true
  else {
    includeNextExact = fromUserMsg.length === 0 || detected
  }

  const useExpandedHints =
    includeNextExact && (nextExactPolicy === 'always' || (nextExactPolicy === 'auto' && detected))

  const hintLimit = policy?.nextExactHintLimit ?? (useExpandedHints ? 20 : 7)

  const basis = await computeJournalTransitBasis(user)
  const { targetDate, majorTransitObjects, majorTransits, transitsPayload, natalSummary, majorTransitSummary, tz } =
    basis

  const horizonDays = 540
  const hints = majorTransitObjects
    .slice(0, hintLimit)
    .map((t) => ({
      transiting_body: (t.transiting_body || '').toLowerCase(),
      natal_body: (t.natal_body || '').toLowerCase(),
      aspect: (t.aspect || '').toLowerCase(),
    }))
    .filter((h) => h.transiting_body && h.natal_body && h.aspect)

  const exacts = includeNextExact
    ? await fetchNextExactTimesWithCache(
        basis.natalPositions,
        basis.natalAsc,
        basis.natalMc,
        hints,
        targetDate,
        horizonDays,
      )
    : []
  const nextExactLinesFr = exacts.map((h) => formatJournalNextExactLine(h, tz))

  const snapshotFr = formatSnapshotInTimezone(targetDate, tz)
  const sky = transitsPayload.planets as Record<string, number> | undefined
  const displayForSky = majorTransitObjects.slice(0, JOURNAL_TRANSIT_DISPLAY_LINES)
  const transitingKeys = Array.from(
    new Set(displayForSky.map((t) => (t.transiting_body || '').toLowerCase()).filter(Boolean)),
  )
  const skyLines = transitingKeys.map((body) => {
    const lon = sky?.[body]
    if (typeof lon !== 'number') {
      return `- ${bodyLabelFr(body)} : longitude indisponible à cet instant`
    }
    const { sign, degInSign } = longitudeToSignFr(lon)
    return `- ${bodyLabelFr(body)} : ~${degInSign}° ${sign} (à la date de référence ci-dessous)`
  })

  const nextExactSection = !includeNextExact
    ? 'Prochains passages à l’orbe minimale : non calculés pour ce message (aucun besoin timing / transits détecté dans la question — économie de calcul). Ne pas inventer de dates ; si la personne demande ensuite « quand » ou un transit précis, le prochain tour pourra inclure le bloc calculé ou elle peut utiliser le bouton de calcul dans l’app.'
    : nextExactLinesFr.length > 0
      ? [
          'Prochains passages à l’orbe minimale (sortie moteur / éphemerides — à lire et interpréter, pas à compléter de tête) :',
          nextExactLinesFr.join('\n'),
        ].join('\n')
      : hints.length === 0
        ? 'Prochains passages à l’orbe minimale : aucun indice d’aspect dérivé des transits filtrés ; ne pas inventer de dates.'
        : 'Prochains passages à l’orbe minimale : calcul indisponible ou vide ; ne pas inventer de dates — la personne peut relancer le calcul côté app ou coller un résultat dans le fil.'

  const astroTimingBlock = [
    'RÉFÉRENCE TEMPORELLE (ancre pour toute prévision ou « temps » astrologique)',
    `- Date & heure de calcul (fuseau profil ${tz}) : ${snapshotFr}`,
    `- Même instant en ISO (UTC) : ${targetDate}`,
    '',
    'Ciel à cet instant (corps impliqués dans les aspects listés) :',
    skyLines.length > 0 ? skyLines.join('\n') : '- (positions non fournies)',
    '',
    'Aspects majeurs filtrés (chaque ligne = un cycle en cours à cette date ; utilise exact / approche / séparation) :',
    majorTransits.length > 0 ? majorTransits.map((l) => `- ${l}`).join('\n') : '- Aucun',
    '',
    nextExactSection,
  ].join('\n')

  return {
    natalSummary,
    majorTransitSummary,
    majorTransits,
    targetDate,
    astroTimingBlock,
  }
}
