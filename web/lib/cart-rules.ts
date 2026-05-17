import { getProductById, type Product } from '@/lib/stripe-catalog'
import type { CartLine, CartRecipientProfile } from '@/lib/cart-types'

export type { CartLine, CartRecipientProfile }

export function cartLineTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => {
    const p = getProductById(line.productId)
    if (!p) return sum
    return sum + p.price
  }, 0)
}

export function cartHasSubscription(lines: CartLine[]): boolean {
  return lines.some((l) => getProductById(l.productId)?.type === 'subscription')
}

export function cartHasOneTime(lines: CartLine[]): boolean {
  return lines.some((l) => getProductById(l.productId)?.type === 'one-time')
}

export function cartIsMixed(lines: CartLine[]): boolean {
  return cartHasSubscription(lines) && cartHasOneTime(lines)
}

export function isRecipientComplete(r: CartRecipientProfile): boolean {
  return Boolean(
    r.birth_date &&
      r.birth_time &&
      r.birth_place &&
      typeof r.latitude === 'number' &&
      typeof r.longitude === 'number' &&
      (r.latitude !== 0 || r.longitude !== 0),
  )
}

/** Valide l'ajout d'une ligne avec profil déjà rempli. */
export function validateAddCartLine(lines: CartLine[], productId: string): string | null {
  const product = getProductById(productId)
  if (!product) return 'Produit introuvable.'
  if (product.id === 'valentine-2026') return 'Ce produit n’est pas encore disponible à l’achat.'

  if (product.type === 'subscription') {
    const existingSub = lines.some((l) => getProductById(l.productId)?.type === 'subscription')
    if (existingSub) return 'L’abonnement Journal est déjà dans votre panier.'
  }

  return null
}

export function linesWithProducts(lines: CartLine[]): Array<CartLine & { product: Product }> {
  return lines
    .map((line) => {
      const product = getProductById(line.productId)
      return product ? { ...line, product } : null
    })
    .filter((x): x is CartLine & { product: Product } => x !== null)
}

export function productIdsFromLines(lines: CartLine[]): string[] {
  return [...new Set(lines.map((l) => l.productId))]
}
