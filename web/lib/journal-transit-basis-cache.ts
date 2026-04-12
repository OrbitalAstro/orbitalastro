import { createHash } from 'crypto'

/** Durée de réutilisation du couple natal + transits (même personne, même fenêtre). */
export const JOURNAL_BASIS_TTL_MS = 5 * 60 * 1000

const basisCache = new Map<string, { value: unknown; expires: number }>()
const basisInflight = new Map<string, Promise<unknown>>()

export function journalBasisProfileKey(user: {
  birth_date: string
  birth_time: string
  birth_place: string
  latitude: number
  longitude: number
  timezone?: string | null
}): string {
  const raw = JSON.stringify({
    bd: String(user.birth_date).trim(),
    bt: String(user.birth_time).trim(),
    bp: String(user.birth_place).trim().toLowerCase(),
    lat: Number(user.latitude).toFixed(5),
    lon: Number(user.longitude).toFixed(5),
    tz: (user.timezone || 'UTC').trim(),
  })
  return createHash('sha256').update(raw, 'utf8').digest('hex')
}

function basisCacheKey(profileKey: string): string {
  const bucket = Math.floor(Date.now() / JOURNAL_BASIS_TTL_MS)
  return `${profileKey}|${bucket}`
}

function pruneBasisCache(): void {
  const now = Date.now()
  if (basisCache.size <= 200) return
  for (const [k, v] of basisCache) {
    if (v.expires <= now) basisCache.delete(k)
    if (basisCache.size <= 150) return
  }
  const first = basisCache.keys().next().value as string | undefined
  if (first) basisCache.delete(first)
}

/**
 * Une requête natal + transits par (profil × créneau TTL), avec fusion des appels concurrents.
 */
export async function withJournalTransitBasisCache<T>(user: Parameters<typeof journalBasisProfileKey>[0], compute: () => Promise<T>): Promise<T> {
  const key = basisCacheKey(journalBasisProfileKey(user))
  const now = Date.now()
  const hit = basisCache.get(key)
  if (hit && hit.expires > now) {
    return hit.value as T
  }

  let p = basisInflight.get(key) as Promise<T> | undefined
  if (p) return p

  p = compute()
    .then((value) => {
      basisCache.set(key, { value, expires: Date.now() + JOURNAL_BASIS_TTL_MS })
      basisInflight.delete(key)
      pruneBasisCache()
      return value
    })
    .catch((e) => {
      basisInflight.delete(key)
      throw e
    })
  basisInflight.set(key, p)
  return p
}
