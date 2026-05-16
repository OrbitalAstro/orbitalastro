import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: vi.fn(),
}))

vi.mock('@/lib/send-password-reset-email', () => ({
  sendPasswordResetEmail: vi.fn(),
}))

import { getSupabaseAdmin } from '@/lib/supabase'
import { sendPasswordResetEmail } from '@/lib/send-password-reset-email'
import { POST } from '@/app/api/auth/forgot-password/route'

function clearForgotRateLimit() {
  const g = globalThis as unknown as { __orbitalForgotPwRate?: Map<string, unknown> }
  delete g.__orbitalForgotPwRate
}

function postForgot(body: unknown, ip = '10.0.0.1') {
  return new NextRequest('http://localhost/api/auth/forgot-password', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': ip,
    },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/forgot-password', () => {
  const admin = vi.mocked(getSupabaseAdmin)
  const sendMail = vi.mocked(sendPasswordResetEmail)
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    clearForgotRateLimit()
    admin.mockReset()
    sendMail.mockReset()
    sendMail.mockResolvedValue(undefined)
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy?.mockRestore()
  })

  it('répond ok:true si le corps JSON est invalide (pas de fuite)', async () => {
    const res = await POST(
      new NextRequest('http://localhost/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-forwarded-for': '10.0.0.2' },
        body: 'not-json{',
      }),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })

  it('répond ok:true si courriel invalide', async () => {
    const res = await POST(postForgot({ email: 'nope' }, '10.0.0.3'))
    expect(await res.json()).toEqual({ ok: true })
  })

  it('répond ok:true si utilisateur inconnu', async () => {
    admin.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    } as never)

    const res = await POST(postForgot({ email: 'ghost@example.com' }, '10.0.0.4'))
    expect(await res.json()).toEqual({ ok: true })
    expect(sendMail).not.toHaveBeenCalled()
  })

  it('insère le jeton et envoie le courriel avec la bonne origine', async () => {
    const deletes: string[] = []
    const inserts: Record<string, unknown>[] = []

    admin.mockReturnValue({
      from: (table: string) => {
        if (table === 'auth_users') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: 'user-1', email: 'u@example.com' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'auth_password_reset_tokens') {
          return {
            delete: () => ({
              eq: (col: string, val: unknown) => {
                deletes.push(`${col}=${val}`)
                return Promise.resolve({ error: null })
              },
            }),
            insert: (row: Record<string, unknown>) => {
              inserts.push(row)
              return Promise.resolve({ error: null })
            },
          }
        }
        throw new Error(`table inattendue: ${table}`)
      },
    } as never)

    const res = await POST(
      new NextRequest('http://internal/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-forwarded-for': '10.0.0.5',
          'x-forwarded-host': 'www.orbitalastro.ca',
          'x-forwarded-proto': 'https',
        },
        body: JSON.stringify({ email: 'u@example.com' }),
      }),
    )

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(deletes.some((d) => d.startsWith('user_id='))).toBe(true)
    expect(inserts).toHaveLength(1)
    expect(inserts[0]).toMatchObject({ user_id: 'user-1' })
    expect(inserts[0]).toHaveProperty('token_hash')
    expect(inserts[0]).toHaveProperty('expires_at')

    expect(sendMail).toHaveBeenCalledTimes(1)
    const arg = sendMail.mock.calls[0][0]
    expect(arg.to).toBe('u@example.com')
    expect(arg.resetUrl).toMatch(/^https:\/\/www\.orbitalastro\.ca\/auth\/reset-password\?token=/)
  })

  it('503 RESET_DB si insertion échoue', async () => {
    admin.mockReturnValue({
      from: (table: string) => {
        if (table === 'auth_users') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: 'user-1', email: 'u@example.com' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'auth_password_reset_tokens') {
          return {
            delete: () => ({ eq: async () => ({ error: null }) }),
            insert: async () => ({ error: { message: 'fail' } }),
          }
        }
        throw new Error(table)
      },
    } as never)

    const res = await POST(postForgot({ email: 'u@example.com' }, '10.0.0.6'))
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ ok: false, code: 'RESET_DB' })
  })

  it('503 EMAIL_SEND si Resend échoue et supprime le jeton', async () => {
    const tokenDeleteEq = vi.fn().mockResolvedValue({ error: null })
    admin.mockReturnValue({
      from: (table: string) => {
        if (table === 'auth_users') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: 'user-1', email: 'u@example.com' },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'auth_password_reset_tokens') {
          return {
            delete: () => ({ eq: tokenDeleteEq }),
            insert: async () => ({ error: null }),
          }
        }
        throw new Error(table)
      },
    } as never)

    sendMail.mockRejectedValue(new Error('smtp down'))

    const res = await POST(postForgot({ email: 'u@example.com' }, '10.0.0.7'))
    expect(res.status).toBe(503)
    expect(await res.json()).toEqual({ ok: false, code: 'EMAIL_SEND' })
    expect(tokenDeleteEq).toHaveBeenCalledWith('token_hash', expect.any(String))
  })
})
