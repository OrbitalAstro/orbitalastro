import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

const constructEvent = vi.fn()
const subscriptionsRetrieve = vi.fn()
const customersRetrieve = vi.fn()
const paymentsUpsert = vi.fn()
const subscribersUpsert = vi.fn()

vi.mock('next/headers', () => ({
  headers: vi.fn(() => ({
    get: (name: string) => (name === 'stripe-signature' ? 'sig_test' : null),
  })),
}))

vi.mock('stripe', () => ({
  default: vi.fn().mockImplementation(() => ({
    webhooks: { constructEvent },
    subscriptions: { retrieve: subscriptionsRetrieve },
    customers: { retrieve: customersRetrieve },
  })),
}))

vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: vi.fn(),
}))

vi.mock('@/lib/journal-subscription', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/journal-subscription')>()
  return {
    ...actual,
    extendJournalAccess: vi.fn().mockResolvedValue(undefined),
    revokeJournalAccess: vi.fn().mockResolvedValue(undefined),
  }
})

import { getSupabaseAdmin } from '@/lib/supabase'
import { extendJournalAccess, revokeJournalAccess } from '@/lib/journal-subscription'
import { GET, POST } from '@/app/api/webhooks/stripe/route'

function postWebhook(body = '{}') {
  return new NextRequest('http://localhost/api/webhooks/stripe', {
    method: 'POST',
    headers: { 'stripe-signature': 'sig_test' },
    body,
  })
}

describe('POST /api/webhooks/stripe', () => {
  const admin = vi.mocked(getSupabaseAdmin)
  const extendAccess = vi.mocked(extendJournalAccess)
  const revokeAccess = vi.mocked(revokeJournalAccess)
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>
  let consoleLogSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake'
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test'
    constructEvent.mockReset()
    subscriptionsRetrieve.mockReset()
    customersRetrieve.mockReset()
    paymentsUpsert.mockReset()
    subscribersUpsert.mockReset()
    extendAccess.mockClear()
    revokeAccess.mockClear()

    paymentsUpsert.mockResolvedValue({ error: null })
    subscribersUpsert.mockResolvedValue({ error: null })

    admin.mockReturnValue({
      from: (table: string) => ({
        upsert: (payload: unknown, opts: unknown) => {
          if (table === 'payments') paymentsUpsert(payload, opts)
          if (table === 'subscribers') subscribersUpsert(payload, opts)
          return Promise.resolve({ error: null })
        },
      }),
    } as never)

    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy?.mockRestore()
    consoleLogSpy?.mockRestore()
  })

  it('400 si signature invalide', async () => {
    constructEvent.mockImplementation(() => {
      throw new Error('bad sig')
    })
    const res = await POST(postWebhook())
    expect(res.status).toBe(400)
    expect(await res.json()).toMatchObject({ error: 'Invalid signature' })
  })

  it('enregistre checkout.session.completed (paiement + abonné)', async () => {
    constructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_done',
          payment_status: 'paid',
          amount_total: 5000,
          currency: 'cad',
          customer_email: 'Buyer@Example.com',
          customer: 'cus_123',
          metadata: { productIds: 'dialogue,journal-monthly', acceptPromotions: 'true' },
        },
      },
    })

    const res = await POST(postWebhook('{}'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ received: true })
    expect(paymentsUpsert).toHaveBeenCalled()
    expect(subscribersUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'buyer@example.com',
        subscribed_to_promotions: true,
      }),
      expect.anything(),
    )
  })

  it('prolonge accès journal sur invoice.paid', async () => {
    constructEvent.mockReturnValue({
      type: 'invoice.paid',
      data: {
        object: {
          subscription: 'sub_journal',
          customer_email: 'journal@example.com',
          lines: { data: [{ metadata: { productId: 'journal-monthly' } }] },
        },
      },
    })
    subscriptionsRetrieve.mockResolvedValue({
      metadata: { productId: 'journal-monthly' },
    })

    const res = await POST(postWebhook())
    expect(res.status).toBe(200)
    expect(extendAccess).toHaveBeenCalledWith('journal@example.com', { months: 1 })
  })

  it('ignore invoice.paid pour produit non journal', async () => {
    constructEvent.mockReturnValue({
      type: 'invoice.paid',
      data: {
        object: {
          subscription: 'sub_dialogue',
          customer_email: 'client@example.com',
          lines: { data: [{ metadata: { productId: 'dialogue' } }] },
        },
      },
    })
    subscriptionsRetrieve.mockResolvedValue({
      metadata: { productId: 'dialogue' },
    })

    await POST(postWebhook())
    expect(extendAccess).not.toHaveBeenCalled()
  })

  it('révoque accès journal sur customer.subscription.deleted', async () => {
    constructEvent.mockReturnValue({
      type: 'customer.subscription.deleted',
      data: {
        object: {
          metadata: { productId: 'journal-monthly' },
          customer: 'cus_journal',
        },
      },
    })
    customersRetrieve.mockResolvedValue({ deleted: false, email: 'journal@example.com' })

    const res = await POST(postWebhook())
    expect(res.status).toBe(200)
    expect(revokeAccess).toHaveBeenCalledWith('journal@example.com')
  })
})

describe('GET /api/webhooks/stripe', () => {
  it('confirme que le endpoint est actif', async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toMatch(/active/i)
  })
})
