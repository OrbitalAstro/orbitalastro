import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getProductDestination } from '@/lib/stripe-catalog'
import {
  getNoAccessPurchasePath,
  PRODUCT_CATALOG_PATH,
  REMOVED_MARKETING_COMMANDER_PATHS,
} from '@/lib/product-navigation'

const webRoot = join(__dirname, '..')

function readSource(...segments: string[]): string {
  return readFileSync(join(webRoot, ...segments), 'utf-8')
}

describe('product-navigation', () => {
  it('expose une seule entrée catalogue pour les achats sans accès', () => {
    expect(PRODUCT_CATALOG_PATH).toBe('/pricing')
    expect(getNoAccessPurchasePath()).toBe('/pricing')
  })

  it('conserve les destinations post-achat pour la génération', () => {
    expect(getProductDestination('dialogue')).toBe('/dialogues?purchased=true')
    expect(getProductDestination('reading-2026')).toBe('/reading-2026?purchased=true')
    expect(getProductDestination('journal-monthly')).toBe('/journal-pilot?subscribed=true')
    expect(getProductDestination('unknown')).toBe('/pricing')
  })
})

describe('marketing surfaces — pas de commander direct dialogue / révolution', () => {
  it('page d’accueil : hero et footer sans liens commander retirés', () => {
    const source = readSource('app', 'page.tsx')
    for (const path of REMOVED_MARKETING_COMMANDER_PATHS) {
      expect(source).not.toContain(path)
    }
    expect(source).toContain(`href="${PRODUCT_CATALOG_PATH}"`)
  })

  it('dialogues : redirection achat vers le catalogue', () => {
    const source = readSource('app', 'dialogues', 'page.tsx')
    expect(source).not.toContain('/commander/dialogue')
    expect(source).toContain('getNoAccessPurchasePath')
  })

  it('reading-2026 : redirection achat vers le catalogue', () => {
    const source = readSource('app', 'reading-2026', 'page.tsx')
    expect(source).not.toContain('/commander/reading-2026')
    expect(source).toContain('getNoAccessPurchasePath')
  })
})
