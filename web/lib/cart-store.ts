'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  createCartLineId,
  type CartLine,
  type CartRecipientProfile,
} from '@/lib/cart-types'
import { validateAddCartLine } from '@/lib/cart-rules'

type CartState = {
  lines: CartLine[]
  addConfiguredLine: (productId: string, recipient: CartRecipientProfile) => string | null
  removeLine: (lineId: string) => void
  clear: () => void
  itemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      addConfiguredLine: (productId, recipient) => {
        const err = validateAddCartLine(get().lines, productId)
        if (err) return err
        const line: CartLine = {
          id: createCartLineId(),
          productId,
          recipient,
        }
        set({ lines: [...get().lines, line] })
        return null
      },
      removeLine: (lineId) => {
        set({ lines: get().lines.filter((l) => l.id !== lineId) })
      },
      clear: () => set({ lines: [] }),
      itemCount: () => get().lines.length,
    }),
    { name: 'orbitalastro_cart_v2' },
  ),
)
