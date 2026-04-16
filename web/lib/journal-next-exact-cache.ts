import { createHash } from 'crypto'
import { getSupabaseAdmin } from '@/lib/supabase'

/** Même forme que `JournalNextExactHit` dans journal-astro-context (évite import circulaire). */
export type NextExactHitJson = {
  transiting_body: string
  natal_body: string
  aspect: string
  exact_utc: string
  min_orb_deg: number
}

/** Réponses next-exact chaudes en RAM (avant/après Supabase). */
const MEM_TTL_MS = 45 * 60 * 1000
const MEM_MAX = 400
const memNextExact = new Map<string, { hits: NextExactHitJson[]; expires: number }>()

function pruneMemNextExact(): void {
  const now = Date.now()
  if (memNextExact.size <= MEM_MAX) return
  for (const [k, v] of memNextExact) {
    if (v.expires <= now) memNextExact.delete(k)
    if (memNextExact.size <= MEM_MAX * 0.75) return
  }
  const first = memNextExact.keys().next().value as string | undefined
  if (first) memNextExact.delete(first)
}

function stableNatalFingerprint(
  natalPositions: Record<string, number>,
  natalAsc: number | null | undefined,
  natalMc: number | null | undefined,
): string {
  const keys = Object.keys(natalPositions).sort()
  const pos = keys.map((k) => `${k}:${natalPositions[k].toFixed(5)}`).join('|')
  const a = natalAsc != null && Number.isFinite(natalAsc) ? `:asc:${natalAsc.toFixed(5)}` : ''
  const m = natalMc != null && Number.isFinite(natalMc) ? `:mc:${natalMc.toFixed(5)}` : ''
  return pos + a + m
}

function stableHintsKey(hints: { transiting_body: string; natal_body: string; aspect: string }[]): string {
  return [...hints]
    .map((h) => `${h.transiting_body}|${h.natal_body}|${h.aspect}`)
    .sort()
    .join(';')
}

/** Fenêtre horaire UTC pour mutualiser les hits (le « prochain » exact ne bouge pas à la minute près pour ce cache). */
function fromIsoHourBucketUtc(fromIso: string): string {
  try {
    const d = new Date(fromIso)
    if (Number.isNaN(d.getTime())) return fromIso.slice(0, 16)
    return d.toISOString().slice(0, 13) + ':00:00.000Z'
  } catch {
    return fromIso.slice(0, 16)
  }
}

export function buildJournalNextExactCacheKey(params: {
  natalPositions: Record<string, number>
  natalAsc: number | null | undefined
  natalMc: number | null | undefined
  hints: { transiting_body: string; natal_body: string; aspect: string }[]
  fromIso: string
  horizonDays: number
}): string {
  const raw = JSON.stringify({
    natal: stableNatalFingerprint(params.natalPositions, params.natalAsc, params.natalMc),
    hints: stableHintsKey(params.hints),
    fromHourUtc: fromIsoHourBucketUtc(params.fromIso),
    horizonDays: params.horizonDays,
  })
  return createHash('sha256').update(raw, 'utf8').digest('hex')
}

function isHitRow(x: unknown): x is NextExactHitJson {
  if (!x || typeof x !== 'object') return false
  const o = x as Record<string, unknown>
  return (
    typeof o.transiting_body === 'string' &&
    typeof o.natal_body === 'string' &&
    typeof o.aspect === 'string' &&
    typeof o.exact_utc === 'string' &&
    typeof o.min_orb_deg === 'number'
  )
}

export async function loadJournalNextExactCache(cacheKey: string): Promise<NextExactHitJson[] | null> {
  const mem = memNextExact.get(cacheKey)
  if (mem && mem.expires > Date.now()) {
    return mem.hits
  }
  try {
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('journal_next_exact_cache')
      .select('result_json')
      .eq('cache_key', cacheKey)
      .maybeSingle()

    if (error || !data?.result_json) return null
    const arr = data.result_json as unknown
    if (!Array.isArray(arr)) return null
    const hits = arr.filter(isHitRow)
    if (hits.length !== arr.length) return null
    memNextExact.set(cacheKey, { hits, expires: Date.now() + MEM_TTL_MS })
    pruneMemNextExact()
    return hits
  } catch {
    return null
  }
}

export async function saveJournalNextExactCache(cacheKey: string, hits: NextExactHitJson[]): Promise<void> {
  if (hits.length > 0) {
    memNextExact.set(cacheKey, { hits, expires: Date.now() + MEM_TTL_MS })
    pruneMemNextExact()
  }
  try {
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('journal_next_exact_cache').upsert(
      {
        cache_key: cacheKey,
        result_json: hits,
        created_at: new Date().toISOString(),
      },
      { onConflict: 'cache_key' },
    )
    if (error) {
      console.warn('[journal-next-exact-cache] upsert failed', error.message)
    }
  } catch (e) {
    console.warn('[journal-next-exact-cache]', e)
  }
}
