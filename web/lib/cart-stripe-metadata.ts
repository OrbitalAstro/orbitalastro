import type { CartLine } from '@/lib/cart-types'

/** Encode les lignes du panier pour les métadonnées Stripe (max 500 car. par clé). */
export function cartLinesToStripeMetadata(lines: CartLine[]): Record<string, string> {
  const productIds = lines.map((l) => l.productId).join(',')
  const meta: Record<string, string> = {
    productId: lines[0]?.productId || 'unknown',
    productIds,
    lineCount: String(lines.length),
  }

  lines.forEach((line, index) => {
    const compact = JSON.stringify({
      id: line.id,
      p: line.productId,
      l: line.recipient.label,
      n: line.recipient.display_name,
      d: line.recipient.birth_date,
      t: line.recipient.birth_time,
      pl: line.recipient.birth_place,
      lat: line.recipient.latitude,
      lon: line.recipient.longitude,
      tz: line.recipient.timezone,
    })
    if (compact.length <= 500) {
      meta[`line_${index}`] = compact
    }
  })

  return meta
}
