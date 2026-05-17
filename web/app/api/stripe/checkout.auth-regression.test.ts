import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

const createSession = vi.fn()
const pricesRetrieve = vi.fn()
const promotionCodesList = vi.fn()

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('stripe', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      prices: { retrieve: pricesRetrieve },
      promotionCodes: { list: promotionCodesList },
      checkout: { sessions: { create: createSession } },
    })),
  }
})

import { getServerSession } from 'next-auth'
import { POST } from '@/app/api/stripe/checkout/route'
import { mixedCartLines, sampleRecipient } from '@/lib/cart-regression-fixtures'

function postCheckout(body: unknown) {
  return new NextRequest('http://localhost/api/stripe/checkout', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function cartBody(lines: typeof mixedCartLines, extra: Record<string, unknown> = {}) {
  return {
    cartLines: lines,
    email: 'client@example.com',
    ...extra,
  }
}

describe('POST /api/stripe/checkout', () => {
  const getSession = vi.mocked(getServerSession)
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake'
    getSession.mockReset()
    createSession.mockReset()
    pricesRetrieve.mockReset()
    promotionCodesList.mockReset()
    pricesRetrieve.mockResolvedValue({ id: 'price_ok' })
    createSession.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.test/cs_test_123',
    })
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy?.mockRestore()
  })

  it('refuse panier vide', async () => {
    const res = await POST(postCheckout({ cartLines: [] }))
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: expect.stringMatching(/panier vide/i) })
    expect(createSession).not.toHaveBeenCalled()
  })

  it('refuse abonnement sans session connectée', async () => {
    getSession.mockResolvedValue(null)
    const res = await POST(
      postCheckout({
        cartLines: [{ id: 'j1', productId: 'journal-monthly', recipient: sampleRecipient }],
        email: 'guest@example.com',
      }),
    )
    expect(res.status).toBe(401)
    expect(await res.json()).toMatchObject({ error: expect.stringMatching(/connectez-vous/i) })
  })

  it('crée une session payment pour dialogue seul', async () => {
    getSession.mockResolvedValue(null)
    const res = await POST(
      postCheckout({
        cartLines: [{ id: 'd1', productId: 'dialogue', recipient: sampleRecipient }],
        email: 'guest@example.com',
      }),
    )
    expect(res.status).toBe(200)
    expect(createSession).toHaveBeenCalledOnce()
    const config = createSession.mock.calls[0][0]
    expect(config.mode).toBe('payment')
    expect(config.line_items).toHaveLength(1)
    expect(config.payment_intent_data?.receipt_email).toBe('guest@example.com')
    expect(config.subscription_data).toBeUndefined()
  })

  it('crée une session subscription pour panier mixte', async () => {
    getSession.mockResolvedValue({ user: { email: 'membre@example.com' } } as never)
    const res = await POST(postCheckout(cartBody(mixedCartLines)))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.url).toContain('checkout.stripe.test')

    expect(createSession).toHaveBeenCalledOnce()
    const config = createSession.mock.calls[0][0]
    expect(config.mode).toBe('subscription')
    expect(config.line_items).toHaveLength(2)
    expect(config.allow_promotion_codes).toBe(true)
    expect(config.subscription_data?.metadata?.productIds).toBe('dialogue,journal-monthly')
    expect(config.subscription_data?.metadata?.productId).toBe('journal-monthly')
    expect(config.metadata?.productIds).toBe('dialogue,journal-monthly')
    expect(config.payment_intent_data).toBeUndefined()
  })

  it('crée une session subscription pour journal seul', async () => {
    getSession.mockResolvedValue({ user: { email: 'membre@example.com' } } as never)
    const res = await POST(
      postCheckout({
        cartLines: [{ id: 'j1', productId: 'journal-monthly', recipient: sampleRecipient }],
      }),
    )
    expect(res.status).toBe(200)
    const config = createSession.mock.calls[0][0]
    expect(config.mode).toBe('subscription')
    expect(config.line_items).toHaveLength(1)
  })
})
