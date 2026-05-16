import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase', () => ({
  getSupabaseAdmin: vi.fn(),
}))

import { getSupabaseAdmin } from '@/lib/supabase'
import { hashPassword } from '@/lib/password'
import { authOptions } from '@/lib/auth-options'

function getCredentialsAuthorize() {
  const p = authOptions.providers!.find((x) => (x as { id?: string }).id === 'credentials') as {
    options?: { authorize?: (creds: Record<string, string> | undefined) => Promise<unknown> }
  }
  const fn = p?.options?.authorize
  if (!fn) throw new Error('options.authorize introuvable (Credentials)')
  return fn
}

describe('authOptions CredentialsProvider.authorize', () => {
  const admin = vi.mocked(getSupabaseAdmin)

  beforeEach(() => {
    admin.mockReset()
  })

  it('retourne null sans email ou mot de passe', async () => {
    const authorize = getCredentialsAuthorize()
    expect(await authorize(undefined)).toBeNull()
    expect(await authorize({ email: '', password: 'x' })).toBeNull()
    expect(await authorize({ email: 'a@b.c', password: '' })).toBeNull()
  })

  it('retourne null si utilisateur absent ou erreur Supabase', async () => {
    admin.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({ data: null, error: null }),
          }),
        }),
      }),
    } as never)

    const authorize = getCredentialsAuthorize()
    expect(await authorize({ email: 'x@y.z', password: '12345678' })).toBeNull()
  })

  it('retourne null si mot de passe incorrect', async () => {
    const hash = hashPassword('bonMotdepasse8')
    admin.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                id: 'id-1',
                email: 'user@example.com',
                display_name: 'User',
                password_hash: hash,
              },
              error: null,
            }),
          }),
        }),
      }),
    } as never)

    const authorize = getCredentialsAuthorize()
    expect(await authorize({ email: 'user@example.com', password: 'mauvais' })).toBeNull()
  })

  it('retourne le profil si le mot de passe est correct', async () => {
    const hash = hashPassword('Secret1234')
    admin.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                id: 'id-1',
                email: 'user@example.com',
                display_name: 'Display',
                password_hash: hash,
              },
              error: null,
            }),
          }),
        }),
      }),
    } as never)

    const authorize = getCredentialsAuthorize()
    const out = await authorize({ email: 'user@example.com', password: 'Secret1234' })
    expect(out).toEqual({
      id: 'id-1',
      email: 'user@example.com',
      name: 'Display',
    })
  })

  it('utilise la partie locale du courriel comme nom si display_name absent', async () => {
    const hash = hashPassword('Secret1234')
    admin.mockReturnValue({
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                id: 'id-1',
                email: 'user@example.com',
                display_name: null,
                password_hash: hash,
              },
              error: null,
            }),
          }),
        }),
      }),
    } as never)

    const authorize = getCredentialsAuthorize()
    const out = await authorize({ email: 'user@example.com', password: 'Secret1234' })
    expect(out).toMatchObject({ name: 'user' })
  })
})
