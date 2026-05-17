import type { CartLine, CartRecipientProfile } from '@/lib/cart-types'

export const sampleRecipient: CartRecipientProfile = {
  label: 'Marie',
  display_name: 'Marie',
  birth_date: '1990-01-01',
  birth_time: '12:00',
  birth_place: 'Montréal, QC',
  latitude: 45.5,
  longitude: -73.5,
  timezone: 'America/Toronto',
}

export function cartLine(
  id: string,
  productId: string,
  recipient: CartRecipientProfile = sampleRecipient,
): CartLine {
  return { id, productId, recipient }
}

export const dialogueLine = cartLine('line-dialogue', 'dialogue')
export const readingLine = cartLine('line-reading', 'reading-2026')
export const journalLine = cartLine('line-journal', 'journal-monthly')
export const mixedCartLines: CartLine[] = [dialogueLine, journalLine]
