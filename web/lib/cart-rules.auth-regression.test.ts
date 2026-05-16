import { describe, expect, it } from 'vitest'
import { cartIsMixed, validateAddToCart } from '@/lib/cart-rules'

describe('validateAddToCart', () => {
  it('refuse le mélange abonnement + achat à la pièce', () => {
    const err = validateAddToCart(
      [{ productId: 'dialogue', quantity: 1 }],
      'journal-monthly',
    )
    expect(err).toMatch(/ensemble/i)
  })

  it('accepte deux produits à la pièce', () => {
    const err = validateAddToCart(
      [{ productId: 'dialogue', quantity: 1 }],
      'reading-2026',
    )
    expect(err).toBeNull()
  })
})

describe('cartIsMixed', () => {
  it('détecte un panier mixte', () => {
    expect(
      cartIsMixed([
        { productId: 'dialogue', quantity: 1 },
        { productId: 'journal-monthly', quantity: 1 },
      ]),
    ).toBe(true)
  })
})
