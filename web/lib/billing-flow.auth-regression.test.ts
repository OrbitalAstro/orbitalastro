import { describe, expect, it } from 'vitest'
import { normalizeCartLines } from '@/lib/cart-checkout-normalize'
import {
  buildSubscriptionCheckoutMetadata,
  getStripeCheckoutMode,
  resolveCheckoutPriceIds,
  validateCheckoutAuth,
} from '@/lib/cart-checkout-plan'
import { cartLinesToStripeMetadata } from '@/lib/cart-stripe-metadata'
import { cartLineTotal, validateAddCartLine } from '@/lib/cart-rules'
import { validateCheckoutConsent } from '@/lib/checkout-consent'
import { isJournalMonthlyCheckoutConfigured } from '@/lib/stripe-journal-price'
import { cartLine, mixedCartLines, dialogueLine, journalLine } from '@/lib/cart-regression-fixtures'

/** Parcours panier → métadonnées Stripe → validation auth (sans appel réseau). */
describe('flux facturation bout-en-bout (logique)', () => {
  it('panier mixte : mode subscription, prix, métadonnées et auth cohérents', () => {
    const body = { cartLines: mixedCartLines }
    const normalized = normalizeCartLines(body)
    expect(Array.isArray(normalized)).toBe(true)
    if (!Array.isArray(normalized)) return

    expect(validateAddCartLine([], 'dialogue')).toBeNull()
    expect(getStripeCheckoutMode(normalized)).toBe('subscription')
    expect(validateCheckoutAuth(normalized, null)).toMatch(/connectez-vous/i)
    expect(validateCheckoutAuth(normalized, 'membre@example.com')).toBeNull()

    const prices = resolveCheckoutPriceIds(normalized)
    expect('priceIds' in prices).toBe(true)
    if ('priceIds' in prices) {
      expect(prices.priceIds).toHaveLength(2)
      prices.priceIds.forEach((id) => expect(id).toMatch(/^price_/))
    }

    const meta = cartLinesToStripeMetadata(normalized)
    expect(meta.productIds).toBe('dialogue,journal-monthly')
    expect(buildSubscriptionCheckoutMetadata(normalized)).toEqual({
      productId: 'journal-monthly',
      productIds: 'dialogue,journal-monthly',
    })
    expect(cartLineTotal(normalized)).toBeGreaterThan(0)
  })

  it('achat dialogue seul : mode payment, invité autorisé', () => {
    const normalized = normalizeCartLines({ cartLines: [dialogueLine] })
    expect(Array.isArray(normalized)).toBe(true)
    if (!Array.isArray(normalized)) return

    expect(getStripeCheckoutMode(normalized)).toBe('payment')
    expect(validateCheckoutAuth(normalized, null)).toBeNull()
    const prices = resolveCheckoutPriceIds(normalized)
    expect('priceIds' in prices).toBe(true)
  })

  it('refuse ligne panier incomplète avant checkout', () => {
    const incomplete = {
      cartLines: [{ id: 'x', productId: 'dialogue', recipient: { label: 'X' } }],
    }
    const result = normalizeCartLines(incomplete)
    expect(result).toMatchObject({ error: expect.stringMatching(/incomplète|invalide/i) })
  })

  it('refuse produit inconnu dans le panier', () => {
    const result = normalizeCartLines({
      cartLines: [cartLine('bad', 'produit-inexistant')],
    })
    expect(result).toMatchObject({ error: expect.stringMatching(/incomplète|invalide/i) })
  })

  it('abonnement journal configuré en test (price id présent)', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake'
    expect(isJournalMonthlyCheckoutConfigured()).toBe(true)
    const prices = resolveCheckoutPriceIds([journalLine])
    expect('priceIds' in prices).toBe(true)
  })

  it('consentement CGU requis côté client si utilisé', () => {
    expect(validateCheckoutConsent({})).toMatch(/termes/i)
    expect(validateCheckoutConsent({ acceptTerms: true })).toBeNull()
  })
})
