/**
 * Comptes avec accès journal sans abonnement Stripe (liste blanche).
 * Ajouter des courriels via JOURNAL_FREE_ACCESS_EMAILS (séparés par virgule ou saut de ligne).
 */

/** Liste de base — compléter via variable d'environnement en prod. */
const BUILTIN_FREE_ACCESS_EMAILS: readonly string[] = [
  'isabelle_fort10@hotmail.com',
  'jodivers@outlook.com',
]

function parseEmailList(raw: string | undefined): string[] {
  if (!raw?.trim()) return []
  return raw
    .split(/[\s,;]+/)
    .map((e) => e.toLowerCase().trim())
    .filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
}

/** Ensemble normalisé (minuscules) des courriels autorisés gratuitement. */
export function getJournalFreeAccessEmails(): Set<string> {
  const fromEnv = parseEmailList(process.env.JOURNAL_FREE_ACCESS_EMAILS)
  return new Set([...BUILTIN_FREE_ACCESS_EMAILS.map((e) => e.toLowerCase().trim()), ...fromEnv])
}

export function isJournalFreeAccessEmail(email: string | null | undefined): boolean {
  const normalized = String(email ?? '')
    .toLowerCase()
    .trim()
  if (!normalized) return false
  return getJournalFreeAccessEmails().has(normalized)
}
