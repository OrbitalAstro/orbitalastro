import { getProductById } from '@/lib/stripe-catalog'
import { isRecipientComplete, type CartLine } from '@/lib/cart-rules'
import type { CartRecipientProfile } from '@/lib/cart-types'

export function parseCartRecipient(raw: unknown): CartRecipientProfile | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const recipient: CartRecipientProfile = {
    label: String(r.label || r.display_name || 'Destinataire'),
    display_name: String(r.display_name || ''),
    birth_date: String(r.birth_date || ''),
    birth_time: String(r.birth_time || ''),
    birth_place: String(r.birth_place || ''),
    latitude: Number(r.latitude) || 0,
    longitude: Number(r.longitude) || 0,
    timezone: String(r.timezone || 'UTC'),
    email: typeof r.email === 'string' ? r.email : undefined,
  }
  if (!recipient.label) return null
  return isRecipientComplete(recipient) ? recipient : null
}

export function normalizeCartLines(body: { cartLines?: unknown }): CartLine[] | { error: string } {
  if (!Array.isArray(body.cartLines) || body.cartLines.length === 0) {
    return {
      error:
        'Panier vide. Configurez un produit depuis sa page (informations de naissance), puis ajoutez au panier.',
    }
  }

  const lines: CartLine[] = []
  for (const raw of body.cartLines) {
    if (!raw || typeof raw !== 'object') continue
    const o = raw as Record<string, unknown>
    const id = typeof o.id === 'string' ? o.id : ''
    const productId = typeof o.productId === 'string' ? o.productId : ''
    const recipient = parseCartRecipient(o.recipient)
    if (!id || !productId || !getProductById(productId) || !recipient) {
      return { error: 'Une ligne du panier est incomplète ou invalide.' }
    }
    lines.push({ id, productId, recipient })
  }

  if (lines.length === 0) return { error: 'Panier vide.' }
  return lines
}
