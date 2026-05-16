export type CheckoutConsentInput = {
  acceptTerms?: unknown
  confirmBirthData?: unknown
}

export function validateCheckoutConsent(input: CheckoutConsentInput): string | null {
  if (input.acceptTerms !== true) {
    return 'Vous devez accepter les termes et conditions pour continuer.'
  }
  if (input.confirmBirthData !== true) {
    return 'Vous devez confirmer disposer de votre date et heure de naissance exactes.'
  }
  return null
}
