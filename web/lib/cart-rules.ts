import { getProductById, type Product } from '@/lib/stripe-catalog'

export type CartLine = {
  productId: string
  quantity: number
}

export function cartLineTotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => {
    const p = getProductById(line.productId)
    if (!p) return sum
    return sum + p.price * line.quantity
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

/** Retourne un message d'erreur ou null si l'ajout est permis. */
export function validateAddToCart(lines: CartLine[], productId: string): string | null {
  const product = getProductById(productId)
  if (!product) return 'Produit introuvable.'
  if (product.id === 'valentine-2026') return 'Ce produit n’est pas encore disponible à l’achat.'

  const next: CartLine[] = [...lines]
  const existing = next.find((l) => l.productId === productId)
  if (existing) {
    if (product.type === 'subscription') return 'Cet abonnement est déjà dans votre panier.'
    existing.quantity += 1
  } else {
    next.push({ productId, quantity: 1 })
  }

  if (cartIsMixed(next)) {
    return 'Les abonnements et les achats à la pièce ne peuvent pas être payés ensemble. Finalisez d’abord un type d’achat.'
  }

  const subs = next.filter((l) => getProductById(l.productId)?.type === 'subscription')
  if (subs.length > 1) {
    return 'Un seul abonnement à la fois dans le panier.'
  }

  return null
}

export function mergeCartLine(lines: CartLine[], productId: string): CartLine[] {
  const product = getProductById(productId)
  if (!product) return lines
  const existing = lines.find((l) => l.productId === productId)
  if (existing) {
    if (product.type === 'subscription') return lines
    return lines.map((l) =>
      l.productId === productId ? { ...l, quantity: l.quantity + 1 } : l,
    )
  }
  return [...lines, { productId, quantity: 1 }]
}

export function productIdsFromLines(lines: CartLine[]): string[] {
  return lines.map((l) => l.productId)
}

export function linesWithProducts(lines: CartLine[]): Array<CartLine & { product: Product }> {
  return lines
    .map((line) => {
      const product = getProductById(line.productId)
      return product ? { ...line, product } : null
    })
    .filter((x): x is CartLine & { product: Product } => x !== null)
}
