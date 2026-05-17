/** Unique public catalog for browsing and purchasing services. */
export const PRODUCT_CATALOG_PATH = '/pricing'

/**
 * Direct commander URLs removed from marketing surfaces (home hero, footer)
 * to avoid duplicate purchase funnels alongside the product catalog.
 */
export const REMOVED_MARKETING_COMMANDER_PATHS = [
  '/commander/dialogue',
  '/commander/reading-2026',
] as const

/** Where to send users who must purchase before generating content. */
export function getNoAccessPurchasePath(): string {
  return PRODUCT_CATALOG_PATH
}
