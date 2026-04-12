/**
 * URLs publiques (site, dépôt, docs API).
 * La base de l’API pour /docs doit rester alignée avec `next.config.js` → getApiDocsDestination.
 */

function trimTrailingSlashes(value: string): string {
  return value.trim().replace(/\/+$/, '')
}

export const PUBLIC_SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://www.orbitalastro.ca'
).trim()

export const SOURCE_CODE_REPOSITORY_URL = (
  process.env.NEXT_PUBLIC_SOURCE_CODE_URL || 'https://github.com/OrbitalAstro/orbitalastro'
).trim()

export function getApiDocsUrl(): string {
  const base = trimTrailingSlashes(
    process.env.NEXT_PUBLIC_API_URL || 'https://api.orbitalastro.ca'
  )
  return `${base}/docs`
}
