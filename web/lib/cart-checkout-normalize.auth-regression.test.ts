import { describe, expect, it } from 'vitest'
import { normalizeCartLines, parseCartRecipient } from '@/lib/cart-checkout-normalize'
import { sampleRecipient } from '@/lib/cart-regression-fixtures'

describe('parseCartRecipient', () => {
  it('accepte un profil complet', () => {
    expect(parseCartRecipient(sampleRecipient)).toEqual(sampleRecipient)
  })

  it('refuse sans lieu valide (0,0)', () => {
    expect(
      parseCartRecipient({
        ...sampleRecipient,
        latitude: 0,
        longitude: 0,
      }),
    ).toBeNull()
  })

  it('refuse entrée non objet', () => {
    expect(parseCartRecipient(null)).toBeNull()
    expect(parseCartRecipient('texte')).toBeNull()
  })
})

describe('normalizeCartLines', () => {
  it('refuse panier vide', () => {
    expect(normalizeCartLines({})).toEqual({
      error:
        'Panier vide. Configurez un produit depuis sa page (informations de naissance), puis ajoutez au panier.',
    })
    expect(normalizeCartLines({ cartLines: [] })).toMatchObject({
      error: expect.stringMatching(/panier vide/i),
    })
  })

  it('normalise une ligne dialogue valide', () => {
    const result = normalizeCartLines({
      cartLines: [
        {
          id: 'a1',
          productId: 'dialogue',
          recipient: sampleRecipient,
        },
      ],
    })
    expect(Array.isArray(result)).toBe(true)
    if (Array.isArray(result)) {
      expect(result).toHaveLength(1)
      expect(result[0].productId).toBe('dialogue')
    }
  })

  it('normalise panier mixte dialogue + journal', () => {
    const result = normalizeCartLines({
      cartLines: [
        { id: '1', productId: 'dialogue', recipient: sampleRecipient },
        { id: '2', productId: 'journal-monthly', recipient: sampleRecipient },
      ],
    })
    expect(Array.isArray(result)).toBe(true)
    if (Array.isArray(result)) {
      expect(result.map((l) => l.productId)).toEqual(['dialogue', 'journal-monthly'])
    }
  })

  it('refuse ligne sans destinataire complet', () => {
    const result = normalizeCartLines({
      cartLines: [{ id: '1', productId: 'dialogue', recipient: { display_name: 'X' } }],
    })
    expect(result).toEqual({ error: 'Une ligne du panier est incomplète ou invalide.' })
  })
})
