/** Contexte natal + transits pour le journal / clavardage (appel API Python). */

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
}

type Transit = {
  transiting_body?: string
  natal_body?: string
  aspect?: string
  orb_deg?: number
}

function getApiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/+$/, '')
}

function formatTransitLine(transit: Transit): string {
  const tBody = (transit.transiting_body || '').toLowerCase()
  const nBody = (transit.natal_body || '').toLowerCase()
  const aspect = transit.aspect || 'aspect'
  const orb = typeof transit.orb_deg === 'number' ? ` (orb ${transit.orb_deg.toFixed(2)}°)` : ''
  return `${tBody} ${aspect} ${nBody}${orb}`
}

function majorTransitScore(t: Transit): number {
  const slowBodies = ['saturn', 'uranus', 'neptune', 'pluto']
  const keyNatal = ['sun', 'moon', 'ascendant', 'midheaven', 'jupiter', 'saturn', 'true_node', 'north_node']
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

export type JournalAstroContext = {
  natalSummary: string
  majorTransitSummary: string
  majorTransits: string[]
  targetDate: string
}

export async function fetchJournalAstroContext(user: JournalUserForAstro): Promise<JournalAstroContext> {
  const apiBase = getApiBaseUrl()
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

  const transitsResponse = await fetch(`${apiBase}/api/transits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      natal_positions: natalPositions,
      natal_asc: natalAsc ?? null,
      natal_mc: null,
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

  const transitsPayload = await transitsResponse.json()
  const allTransits: Transit[] = [
    ...((transitsPayload.transits as Transit[]) || []),
    ...(((transitsPayload.transits_to_angles as Transit[]) || []).map((t) => ({
      ...t,
      natal_body: t.natal_body || t.transiting_body || t.aspect || 'angle',
    }))),
  ]

  const majorTransits = allTransits
    .map((t) => ({ t, score: majorTransitScore(t) }))
    .sort((a, b) => b.score - a.score || (a.t.orb_deg || 999) - (b.t.orb_deg || 999))
    .slice(0, 8)
    .map((x) => formatTransitLine(x.t))

  const natalSummary = buildNatalSummary(natalData)
  const majorTransitSummary =
    majorTransits.length > 0 ? majorTransits.join('\n- ') : 'Aucun transit majeur filtré.'

  return {
    natalSummary,
    majorTransitSummary,
    majorTransits,
    targetDate,
  }
}
