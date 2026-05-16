/**
 * Nettoie les URL publiques (secrets Fly parfois saisis avec guillemets → redirect "https://"https).
 */
export function sanitizePublicUrl(raw: string | undefined | null): string | undefined {
  if (!raw) return undefined
  let s = raw.trim().replace(/^["']+|["']+$/g, '')
  if (!/^https?:\/\//i.test(s)) return undefined
  try {
    const u = new URL(s)
    return u.origin
  } catch {
    return undefined
  }
}
