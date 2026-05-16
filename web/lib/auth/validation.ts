/**
 * Règles communes inscription / mot de passe oublié (une seule source pour les tests).
 */

export function parseNormalizedAuthEmail(raw: unknown): string | null {
  const s = String(raw ?? '')
    .toLowerCase()
    .trim()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return null
  return s
}

export function isAuthPasswordLongEnough(raw: unknown, minLen = 8): boolean {
  return String(raw ?? '').length >= minLen
}
