import { describe, expect, it } from 'vitest'
import { cartLinesToStripeMetadata } from '@/lib/cart-stripe-metadata'
import { mixedCartLines } from '@/lib/cart-regression-fixtures'

describe('cartLinesToStripeMetadata', () => {
  it('encode productIds et lineCount pour panier mixte', () => {
    const meta = cartLinesToStripeMetadata(mixedCartLines)
    expect(meta.productIds).toBe('dialogue,journal-monthly')
    expect(meta.lineCount).toBe('2')
    expect(meta.productId).toBe('dialogue')
  })

  it('encode chaque ligne sous line_N si compact <= 500 car.', () => {
    const meta = cartLinesToStripeMetadata(mixedCartLines)
    expect(meta.line_0).toBeDefined()
    expect(meta.line_1).toBeDefined()
    const parsed = JSON.parse(meta.line_0!)
    expect(parsed.p).toBe('dialogue')
    expect(parsed.l).toBe('Marie')
  })
})
