import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { hashPassword } from '@/lib/password'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: vi.fn(),
}))

vi.mock('@/lib/send-password-changed-email', () => ({
  sendPasswordChangedEmail: vi.fn(),
}))

import { getServerSession } from 'next-auth'
import { getSupabaseAdmin } from '@/lib/supabase'
import { sendPasswordChangedEmail } from '@/lib/send-password-changed-email'
import { POST } from '@/app/api/auth/change-password/route'

function postChange(body: unknown) {
  return new NextRequest('http://localhost/api/auth/change-password', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/change-password', () => {
  const getSession = vi.mocked(getServerSession)
  const admin = vi.mocked(getSupabaseAdmin)
  const sendChangedEmail = vi.mocked(sendPasswordChangedEmail)

  beforeEach(() => {
    getSession.mockReset()
    admin.mockReset()
    sendChangedEmail.mockReset()
    sendChangedEmail.mockResolvedValue(undefined)
  })

  it('401 UNAUTHORIZED sans session', async () => {
    getSession.mockResolvedValue(null)
    const res = await POST(
      postChange({
        currentPassword: 'oldpass12',
        newPassword: 'newpass12',
        confirmPassword: 'newpass12',
      }),
    )
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'UNAUTHORIZED' })
  })

  it('401 WRONG_CURRENT si mot de passe actuel invalide', async () => {
    getSession.mockResolvedValue({ user: { email: 'user@example.com' } } as never)
    const stored = hashPassword('correct12')

    admin.mockReturnValue({
      from: (table: string) => {
        if (table === 'auth_users') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: 'u1', password_hash: stored },
                  error: null,
                }),
              }),
            }),
          }
        }
        throw new Error(table)
      },
    } as never)

    const res = await POST(
      postChange({
        currentPassword: 'wrongpass',
        newPassword: 'newpass12',
        confirmPassword: 'newpass12',
      }),
    )
    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'WRONG_CURRENT' })
  })

  it('400 SAME_PASSWORD si identique à l’actuel', async () => {
    const plain = 'samepass12'
    const stored = hashPassword(plain)
    getSession.mockResolvedValue({ user: { email: 'user@example.com' } } as never)

    admin.mockReturnValue({
      from: (table: string) => {
        if (table === 'auth_users') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: 'u1', password_hash: stored },
                  error: null,
                }),
              }),
            }),
          }
        }
        throw new Error(table)
      },
    } as never)

    const res = await POST(
      postChange({
        currentPassword: plain,
        newPassword: plain,
        confirmPassword: plain,
      }),
    )
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'SAME_PASSWORD' })
  })

  it('200 ok met à jour le hash et supprime les jetons reset', async () => {
    const oldPlain = 'oldpass12'
    const newPlain = 'newpass99'
    const stored = hashPassword(oldPlain)
    getSession.mockResolvedValue({ user: { email: 'User@Example.com' } } as never)

    const userUpdates: unknown[] = []
    const tokenDeletes: string[][] = []

    admin.mockReturnValue({
      from: (table: string) => {
        if (table === 'auth_users') {
          return {
            select: () => ({
              eq: (_col: string, val: unknown) => {
                expect(val).toBe('user@example.com')
                return {
                  maybeSingle: async () => ({
                    data: { id: 'u1', password_hash: stored },
                    error: null,
                  }),
                }
              },
            }),
            update: (payload: unknown) => {
              userUpdates.push(payload)
              return { eq: async () => ({ error: null }) }
            },
          }
        }
        if (table === 'auth_password_reset_tokens') {
          return {
            delete: () => ({
              eq: (col: string, val: unknown) => {
                tokenDeletes.push([col, String(val)])
                return Promise.resolve({ error: null })
              },
            }),
          }
        }
        throw new Error(table)
      },
    } as never)

    const res = await POST(
      postChange({
        currentPassword: oldPlain,
        newPassword: newPlain,
        confirmPassword: newPlain,
      }),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(userUpdates[0]).toMatchObject({ password_hash: expect.any(String) })
    expect(tokenDeletes).toContainEqual(['user_id', 'u1'])
    expect(sendChangedEmail).toHaveBeenCalledWith({ to: 'user@example.com' })
  })

  it('200 ok même si le courriel de notification échoue', async () => {
    const oldPlain = 'oldpass12'
    const newPlain = 'newpass99'
    const stored = hashPassword(oldPlain)
    getSession.mockResolvedValue({ user: { email: 'user@example.com' } } as never)
    sendChangedEmail.mockRejectedValue(new Error('Resend down'))

    admin.mockReturnValue({
      from: (table: string) => {
        if (table === 'auth_users') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: { id: 'u1', password_hash: stored },
                  error: null,
                }),
              }),
            }),
            update: () => ({ eq: async () => ({ error: null }) }),
          }
        }
        if (table === 'auth_password_reset_tokens') {
          return { delete: () => ({ eq: async () => ({ error: null }) }) }
        }
        throw new Error(table)
      },
    } as never)

    const res = await POST(
      postChange({
        currentPassword: oldPlain,
        newPassword: newPlain,
        confirmPassword: newPlain,
      }),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
  })
})
