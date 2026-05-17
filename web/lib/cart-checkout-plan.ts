import { cartHasSubscription } from '@/lib/cart-rules'
import { getPriceIdForProduct, isSubscriptionProductId } from '@/lib/stripe-price-ids'
import type { CartLine } from '@/lib/cart-types'

export type StripeCheckoutMode = 'subscription' | 'payment'

/** Mode Stripe : subscription si le panier contient un abo (panier mixte inclus). */
export function getStripeCheckoutMode(lines: CartLine[]): StripeCheckoutMode {
  return cartHasSubscription(lines) ? 'subscription' : 'payment'
}

export function subscriptionProductIdForCheckout(lines: CartLine[]): string | null {
  return lines.find((l) => isSubscriptionProductId(l.productId))?.productId ?? null
}

export function validateCheckoutAuth(
  lines: CartLine[],
  sessionEmail: string | null | undefined,
): string | null {
  if (cartHasSubscription(lines) && !sessionEmail) {
    return 'Connectez-vous pour souscrire au Journal pilote.'
  }
  return null
}

export function resolveCheckoutPriceIds(
  lines: CartLine[],
  priceIdFromClient?: string,
): { priceIds: string[] } | { error: string } {
  const priceIds: string[] = []
  for (const line of lines) {
    const actualPriceId = getPriceIdForProduct(line.productId) || priceIdFromClient
    if (!actualPriceId) {
      return { error: `Le produit « ${line.productId} » n'est pas configuré dans Stripe.` }
    }
    priceIds.push(actualPriceId)
  }
  return { priceIds }
}

export function buildSubscriptionCheckoutMetadata(lines: CartLine[]): {
  productId: string
  productIds: string
} {
  const subId = subscriptionProductIdForCheckout(lines)
  return {
    productId: subId || lines[0]?.productId || 'unknown',
    productIds: lines.map((l) => l.productId).join(','),
  }
}
