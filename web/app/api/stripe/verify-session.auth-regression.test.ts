import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

const sessionsRetrieve = vi.fn()

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => ({
    checkout: { sessions: { retrieve: sessionsRetrieve } },
  })),
}))

import { GET } from '@/app/api/stripe/verify-session/route'

function getVerify(sessionId: string | null) {
  const q = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ''
  return new NextRequest(`http://localhost/api/stripe/verify-session${q}`)
}

describe('GET /api/stripe/verify-session', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake'
    sessionsRetrieve.mockReset()
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy?.mockRestore()
  })

  it('400 si session_id absent', async () => {
    const res = await GET(getVerify(null))
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: expect.stringMatching(/required/i) })
    expect(sessionsRetrieve).not.toHaveBeenCalled()
  })

  it('retourne paid:false si paiement non complété', async () => {
    sessionsRetrieve.mockResolvedValue({
      id: 'cs_pending',
      payment_status: 'unpaid',
      metadata: { productId: 'dialogue' },
    })
    const res = await GET(getVerify('cs_pending'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ paid: false })
  })

  it('retourne les détails pour session payée (produit unique)', async () => {
    sessionsRetrieve.mockResolvedValue({
      id: 'cs_paid_1',
      payment_status: 'paid',
      customer_email: 'client@example.com',
      metadata: {
        productId: 'dialogue',
        productIds: 'dialogue',
        generationsUsed: '0',
      },
      line_items: { data: [{ quantity: 1 }] },
    })
    const res = await GET(getVerify('cs_paid_1'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toMatchObject({
      paid: true,
      productId: 'dialogue',
      productIds: ['dialogue'],
      customerEmail: 'client@example.com',
      quantity: 1,
      generationsUsed: 0,
      sessionId: 'cs_paid_1',
    })
  })

  it('retourne productIds multiples pour panier mixte', async () => {
    sessionsRetrieve.mockResolvedValue({
      id: 'cs_mixed',
      payment_status: 'paid',
      customer_email: 'membre@example.com',
      metadata: {
        productId: 'journal-monthly',
        productIds: 'dialogue,journal-monthly',
      },
      line_items: { data: [{ quantity: 1 }, { quantity: 1 }] },
    })
    const res = await GET(getVerify('cs_mixed'))
    const json = await res.json()
    expect(json.paid).toBe(true)
    expect(json.productIds).toEqual(['dialogue', 'journal-monthly'])
    expect(json.quantity).toBe(2)
  })
})
