'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { mergeCartLine, validateAddToCart, type CartLine } from '@/lib/cart-rules'

type CartState = {
  lines: CartLine[]
  addProduct: (productId: string) => string | null
  setQuantity: (productId: string, quantity: number) => void
  removeProduct: (productId: string) => void
  clear: () => void
  itemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      addProduct: (productId) => {
        const err = validateAddToCart(get().lines, productId)
        if (err) return err
        set({ lines: mergeCartLine(get().lines, productId) })
        return null
      },
      setQuantity: (productId, quantity) => {
        if (quantity < 1) {
          set({ lines: get().lines.filter((l) => l.productId !== productId) })
          return
        }
        set({
          lines: get().lines.map((l) =>
            l.productId === productId ? { ...l, quantity } : l,
          ),
        })
      },
      removeProduct: (productId) => {
        set({ lines: get().lines.filter((l) => l.productId !== productId) })
      },
      clear: () => set({ lines: [] }),
      itemCount: () => get().lines.reduce((n, l) => n + l.quantity, 0),
    }),
    { name: 'orbitalastro_cart_v1' },
  ),
)
