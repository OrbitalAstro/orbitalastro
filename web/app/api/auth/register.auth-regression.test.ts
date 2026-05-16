import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: vi.fn(),
}))

import { getSupabaseAdmin } from '@/lib/supabase'
import { POST } from '@/app/api/auth/register/route'

function postJson(body: unknown) {
  return new NextRequest('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/register', () => {
  const admin = vi.mocked(getSupabaseAdmin)

  beforeEach(() => {
    admin.mockReset()
  })

  it('400 si courriel invalide', async () => {
    const res = await POST(postJson({ email: 'bad', password: '12345678', name: '' }))
    expect(res.status).toBe(400)
    const j = await res.json()
    expect(j.error).toMatch(/invalide/i)
  })

  it('400 si mot de passe trop court', async () => {
    const res = await POST(postJson({ email: 'ok@example.com', password: 'short', name: '' }))
    expect(res.status).toBe(400)
  })

  it('409 si doublon (code 23505)', async () => {
    admin.mockReturnValue({
      from: () => ({
        insert: () => ({
          select: () => ({
            single: async () => ({
              data: null,
              error: { code: '23505', message: 'duplicate key' },
            }),
          }),
        }),
      }),
    } as never)

    const res = await POST(postJson({ email: 'dup@example.com', password: '12345678', name: 'X' }))
    expect(res.status).toBe(409)
  })

  it('200 avec ok et user si insertion réussit', async () => {
    const user = { id: 'uuid-1', email: 'new@example.com', display_name: 'Neo' }
    admin.mockReturnValue({
      from: () => ({
        insert: () => ({
          select: () => ({
            single: async () => ({ data: user, error: null }),
          }),
        }),
      }),
    } as never)

    const res = await POST(postJson({ email: 'New@Example.com', password: '12345678', name: 'Neo' }))
    expect(res.status).toBe(200)
    const j = await res.json()
    expect(j.ok).toBe(true)
    expect(j.user).toEqual(user)
  })
})
