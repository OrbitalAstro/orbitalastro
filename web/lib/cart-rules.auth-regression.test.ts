import { describe, expect, it } from 'vitest'
import { cartIsMixed, validateAddCartLine } from '@/lib/cart-rules'

const sampleRecipient = {
  label: 'Marie',
  display_name: 'Marie',
  birth_date: '1990-01-01',
  birth_time: '12:00',
  birth_place: 'Montréal',
  latitude: 45.5,
  longitude: -73.5,
  timezone: 'America/Toronto',
}

describe('validateAddCartLine', () => {
  it('refuse le mélange abonnement + achat à la pièce', () => {
    const err = validateAddCartLine(
      [{ id: '1', productId: 'dialogue', recipient: sampleRecipient }],
      'journal-monthly',
    )
    expect(err).toMatch(/panier/i)
  })

  it('accepte deux lignes du même produit', () => {
    const err = validateAddCartLine(
      [{ id: '1', productId: 'dialogue', recipient: sampleRecipient }],
      'dialogue',
    )
    expect(err).toBeNull()
  })
})

describe('cartIsMixed', () => {
  it('détecte un panier mixte', () => {
    expect(
      cartIsMixed([
        { id: '1', productId: 'dialogue', recipient: sampleRecipient },
        { id: '2', productId: 'journal-monthly', recipient: sampleRecipient },
      ]),
    ).toBe(true)
  })
})
