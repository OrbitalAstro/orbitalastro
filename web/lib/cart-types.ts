/** Profil natal associé à une ligne du panier. */
export type CartRecipientProfile = {
  label: string
  display_name: string
  birth_date: string
  birth_time: string
  birth_place: string
  latitude: number
  longitude: number
  timezone: string
  email?: string
}

export type CartLine = {
  id: string
  productId: string
  recipient: CartRecipientProfile
}

export function createCartLineId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `line_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function recipientLabelFromName(displayName: string): string {
  const name = displayName.trim()
  return name || 'Destinataire'
}

export function formatRecipientSummary(r: CartRecipientProfile): string {
  const time = r.birth_time?.slice(0, 5) || r.birth_time
  return `${r.label} · ${r.birth_date} ${time} · ${r.birth_place}`
}
