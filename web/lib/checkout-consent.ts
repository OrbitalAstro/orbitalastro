export type CheckoutConsentInput = {
  acceptTerms?: unknown
}

export function validateCheckoutConsent(input: CheckoutConsentInput): string | null {
  if (input.acceptTerms !== true) {
    return 'Vous devez accepter les termes et conditions pour continuer.'
  }
  return null
}
