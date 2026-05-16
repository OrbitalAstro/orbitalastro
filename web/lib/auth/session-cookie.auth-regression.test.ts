import { describe, expect, it } from 'vitest'
import { buildSessionCookieOverride, deriveSessionCookieDomain } from '@/lib/auth/session-cookie'

function env(partial: Record<string, string | undefined>): typeof process.env {
  return { ...process.env, ...partial } as typeof process.env
}

describe('deriveSessionCookieDomain', () => {
  it('utilise NEXTAUTH_COOKIE_DOMAIN si défini', () => {
    expect(deriveSessionCookieDomain(env({ NEXTAUTH_COOKIE_DOMAIN: ' .example.org ' }))).toBe('.example.org')
  })

  it('ne définit pas de domaine hors production sans override', () => {
    expect(
      deriveSessionCookieDomain(
        env({ NODE_ENV: 'development', NEXT_PUBLIC_APP_URL: 'https://www.example.com', NEXTAUTH_COOKIE_DOMAIN: '' }),
      ),
    ).toBeUndefined()
  })

  it('dérive le domaine parent en production depuis NEXT_PUBLIC_APP_URL', () => {
    expect(
      deriveSessionCookieDomain(
        env({ NODE_ENV: 'production', NEXT_PUBLIC_APP_URL: 'https://www.orbitalastro.ca/path' }),
      ),
    ).toBe('.orbitalastro.ca')
  })

  it('ignore localhost, .fly.dev et .local', () => {
    expect(
      deriveSessionCookieDomain(env({ NODE_ENV: 'production', NEXT_PUBLIC_APP_URL: 'https://localhost:3000' })),
    ).toBeUndefined()
    expect(
      deriveSessionCookieDomain(env({ NODE_ENV: 'production', NEXT_PUBLIC_APP_URL: 'https://app.fly.dev' })),
    ).toBeUndefined()
    expect(
      deriveSessionCookieDomain(env({ NODE_ENV: 'production', NEXT_PUBLIC_APP_URL: 'https://x.local' })),
    ).toBeUndefined()
  })

  it('ignore une URL publique absente ou invalide', () => {
    expect(deriveSessionCookieDomain(env({ NODE_ENV: 'production', NEXT_PUBLIC_APP_URL: '' }))).toBeUndefined()
    expect(deriveSessionCookieDomain(env({ NODE_ENV: 'production', NEXT_PUBLIC_APP_URL: 'not-a-url' }))).toBeUndefined()
  })
})

describe('buildSessionCookieOverride', () => {
  it('retourne undefined si aucun domaine', () => {
    expect(buildSessionCookieOverride(env({ NODE_ENV: 'development' }))).toBeUndefined()
  })

  it('fixe secure et le nom __Secure- en production', () => {
    const o = buildSessionCookieOverride(
      env({
        NODE_ENV: 'production',
        NEXTAUTH_COOKIE_DOMAIN: '.example.com',
      }),
    )
    expect(o?.sessionToken.name).toBe('__Secure-next-auth.session-token')
    expect(o?.sessionToken.options.secure).toBe(true)
    expect(o?.sessionToken.options.domain).toBe('.example.com')
    expect(o?.sessionToken.options.httpOnly).toBe(true)
    expect(o?.sessionToken.options.sameSite).toBe('lax')
  })

  it('sans secure hors production quand domaine forcé', () => {
    const o = buildSessionCookieOverride(
      env({
        NODE_ENV: 'development',
        NEXTAUTH_COOKIE_DOMAIN: '.dev.test',
      }),
    )
    expect(o?.sessionToken.name).toBe('next-auth.session-token')
    expect(o?.sessionToken.options.secure).toBe(false)
  })
})
