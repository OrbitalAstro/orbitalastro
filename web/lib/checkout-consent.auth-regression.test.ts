import { describe, expect, it } from 'vitest'
import { validateCheckoutConsent } from '@/lib/checkout-consent'

describe('validateCheckoutConsent', () => {
  it('refuse si les termes ne sont pas acceptés', () => {
    expect(validateCheckoutConsent({})).toMatch(/termes/i)
  })

  it('accepte lorsque les termes sont cochés', () => {
    expect(validateCheckoutConsent({ acceptTerms: true })).toBeNull()
  })
})
