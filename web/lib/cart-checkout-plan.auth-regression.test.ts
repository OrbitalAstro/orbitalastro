import { describe, expect, it } from 'vitest'
import {
  buildSubscriptionCheckoutMetadata,
  getStripeCheckoutMode,
  resolveCheckoutPriceIds,
  subscriptionProductIdForCheckout,
  validateCheckoutAuth,
} from '@/lib/cart-checkout-plan'
import { dialogueLine, journalLine, mixedCartLines, readingLine } from '@/lib/cart-regression-fixtures'

describe('getStripeCheckoutMode', () => {
  it('payment pour achats à la pièce seulement', () => {
    expect(getStripeCheckoutMode([dialogueLine])).toBe('payment')
    expect(getStripeCheckoutMode([dialogueLine, readingLine])).toBe('payment')
  })

  it('subscription pour abonnement seul', () => {
    expect(getStripeCheckoutMode([journalLine])).toBe('subscription')
  })

  it('subscription pour panier mixte (facturation groupée)', () => {
    expect(getStripeCheckoutMode(mixedCartLines)).toBe('subscription')
  })
})

describe('validateCheckoutAuth', () => {
  it('exige une session si le panier contient un abonnement', () => {
    expect(validateCheckoutAuth([journalLine], null)).toMatch(/connectez-vous/i)
    expect(validateCheckoutAuth(mixedCartLines, undefined)).toMatch(/connectez-vous/i)
  })

  it('autorise achat à la pièce sans session', () => {
    expect(validateCheckoutAuth([dialogueLine], null)).toBeNull()
  })

  it('autorise abonnement si session présente', () => {
    expect(validateCheckoutAuth([journalLine], 'user@example.com')).toBeNull()
    expect(validateCheckoutAuth(mixedCartLines, 'user@example.com')).toBeNull()
  })
})

describe('resolveCheckoutPriceIds', () => {
  it('résout un price id par produit vendable', () => {
    const result = resolveCheckoutPriceIds([dialogueLine])
    expect('priceIds' in result).toBe(true)
    if ('priceIds' in result) {
      expect(result.priceIds).toHaveLength(1)
      expect(result.priceIds[0]).toMatch(/^price_/)
    }
  })

  it('résout deux price ids pour panier mixte', () => {
    const result = resolveCheckoutPriceIds(mixedCartLines)
    expect('priceIds' in result).toBe(true)
    if ('priceIds' in result) {
      expect(result.priceIds).toHaveLength(2)
    }
  })

  it('refuse un produit inconnu', () => {
    const result = resolveCheckoutPriceIds([
      { ...dialogueLine, productId: 'produit-inexistant' },
    ])
    expect(result).toEqual({
      error: "Le produit « produit-inexistant » n'est pas configuré dans Stripe.",
    })
  })
})

describe('buildSubscriptionCheckoutMetadata', () => {
  it('liste tous les productIds pour panier mixte', () => {
    expect(buildSubscriptionCheckoutMetadata(mixedCartLines)).toEqual({
      productId: 'journal-monthly',
      productIds: 'dialogue,journal-monthly',
    })
  })

  it('utilise le produit abonnement comme productId principal', () => {
    expect(subscriptionProductIdForCheckout(mixedCartLines)).toBe('journal-monthly')
  })
})
