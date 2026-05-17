import { describe, expect, it } from 'vitest'
import {
  cartHasOneTime,
  cartHasSubscription,
  cartIsMixed,
  cartLineTotal,
  isRecipientComplete,
  linesWithProducts,
  productIdsFromLines,
  validateAddCartLine,
} from '@/lib/cart-rules'
import {
  cartLine,
  dialogueLine,
  journalLine,
  mixedCartLines,
  readingLine,
  sampleRecipient,
} from '@/lib/cart-regression-fixtures'

describe('validateAddCartLine', () => {
  it('accepte le mélange abonnement + achat à la pièce', () => {
    expect(validateAddCartLine([dialogueLine], 'journal-monthly')).toBeNull()
  })

  it('accepte deux lignes du même produit one-time', () => {
    expect(validateAddCartLine([dialogueLine], 'dialogue')).toBeNull()
  })

  it('refuse un second abonnement journal', () => {
    expect(validateAddCartLine([journalLine], 'journal-monthly')).toMatch(/déjà dans votre panier/i)
  })

  it('refuse valentine non disponible', () => {
    expect(validateAddCartLine([], 'valentine-2026')).toMatch(/pas encore disponible/i)
  })

  it('refuse produit inconnu', () => {
    expect(validateAddCartLine([], 'xyz')).toMatch(/introuvable/i)
  })
})

describe('cart composition helpers', () => {
  it('détecte un panier mixte', () => {
    expect(cartIsMixed(mixedCartLines)).toBe(true)
    expect(cartHasSubscription(mixedCartLines)).toBe(true)
    expect(cartHasOneTime(mixedCartLines)).toBe(true)
  })

  it('panier dialogue seul : one-time uniquement', () => {
    expect(cartIsMixed([dialogueLine])).toBe(false)
    expect(cartHasSubscription([dialogueLine])).toBe(false)
    expect(cartHasOneTime([dialogueLine])).toBe(true)
  })

  it('calcule le total panier mixte', () => {
    const total = cartLineTotal(mixedCartLines)
    expect(total).toBeGreaterThan(0)
  })

  it('extrait les productIds uniques', () => {
    expect(productIdsFromLines([dialogueLine, readingLine, dialogueLine])).toEqual([
      'dialogue',
      'reading-2026',
    ])
  })

  it('enrichit les lignes avec le catalogue', () => {
    const enriched = linesWithProducts(mixedCartLines)
    expect(enriched).toHaveLength(2)
    expect(enriched[0].product.type).toBe('one-time')
    expect(enriched[1].product.type).toBe('subscription')
  })
})

describe('isRecipientComplete', () => {
  it('valide le fixture standard', () => {
    expect(isRecipientComplete(sampleRecipient)).toBe(true)
  })

  it('refuse coordonnées nulles', () => {
    expect(isRecipientComplete(cartLine('x', 'dialogue', { ...sampleRecipient, latitude: 0, longitude: 0 }).recipient)).toBe(
      false,
    )
  })
})
