import { describe, expect, it } from 'vitest'
import { validateCheckoutConsent } from '@/lib/checkout-consent'

describe('validateCheckoutConsent', () => {
  it('refuse si les cases ne sont pas cochées', () => {
    expect(validateCheckoutConsent({})).toMatch(/termes/i)
    expect(validateCheckoutConsent({ acceptTerms: true })).toMatch(/naissance/i)
  })

  it('accepte les deux confirmations', () => {
    expect(
      validateCheckoutConsent({ acceptTerms: true, confirmBirthData: true }),
    ).toBeNull()
  })
})
