import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'

vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: vi.fn(),
}))

import { getSupabaseAdmin } from '@/lib/supabase'
import { POST } from '@/app/api/auth/reset-password/route'

function postReset(body: unknown) {
  return new NextRequest('http://localhost/api/auth/reset-password', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/reset-password', () => {
  const admin = vi.mocked(getSupabaseAdmin)

  beforeEach(() => {
    admin.mockReset()
  })

  it('400 INVALID si jeton absent ou trop court', async () => {
    let res = await POST(postReset({ token: '', password: '12345678' }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'INVALID' })

    res = await POST(postReset({ token: 'short', password: '12345678' }))
    expect(res.status).toBe(400)
  })

  it('400 SHORT si mot de passe trop court', async () => {
    const raw = randomBytes(32).toString('base64url')
    const res = await POST(postReset({ token: raw, password: '1234567' }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'SHORT' })
  })

  it('400 INVALID si aucune ligne jeton', async () => {
    const raw = randomBytes(32).toString('base64url')
    admin.mockReturnValue({
      from: (table: string) => {
        if (table === 'auth_password_reset_tokens') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({ data: null, error: null }),
              }),
            }),
          }
        }
        throw new Error(table)
      },
    } as never)

    const res = await POST(postReset({ token: raw, password: '12345678' }))
    expect(res.status).toBe(400)
  })

  it('400 INVALID si jeton expiré', async () => {
    const raw = randomBytes(32).toString('base64url')
    const deleteEq = vi.fn().mockResolvedValue({ error: null })

    admin.mockReturnValue({
      from: (table: string) => {
        if (table === 'auth_password_reset_tokens') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: 'tok-1',
                    user_id: 'u1',
                    expires_at: new Date(Date.now() - 1000).toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
            delete: () => ({ eq: deleteEq }),
          }
        }
        throw new Error(table)
      },
    } as never)

    const res = await POST(postReset({ token: raw, password: '12345678' }))
    expect(res.status).toBe(400)
    expect(deleteEq).toHaveBeenCalledWith('id', 'tok-1')
  })

  it('200 ok si mise à jour réussit et supprime les jetons utilisateur', async () => {
    const raw = randomBytes(32).toString('base64url')
    const tokenDeletes: string[][] = []
    const userUpdates: unknown[] = []

    admin.mockReturnValue({
      from: (table: string) => {
        if (table === 'auth_password_reset_tokens') {
          return {
            select: () => ({
              eq: () => ({
                maybeSingle: async () => ({
                  data: {
                    id: 'tok-1',
                    user_id: 'u1',
                    expires_at: new Date(Date.now() + 3600000).toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
            delete: () => ({
              eq: (col: string, val: unknown) => {
                tokenDeletes.push([col, String(val)])
                return Promise.resolve({ error: null })
              },
            }),
          }
        }
        if (table === 'auth_users') {
          return {
            update: (payload: unknown) => {
              userUpdates.push(payload)
              return {
                eq: async () => ({ error: null }),
              }
            },
          }
        }
        throw new Error(table)
      },
    } as never)

    const res = await POST(postReset({ token: raw, password: 'abcdefgh' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ ok: true })
    expect(userUpdates[0]).toMatchObject({ password_hash: expect.any(String) })
    expect(tokenDeletes.some((args) => args[0] === 'user_id' && args[1] === 'u1')).toBe(true)
  })
})
