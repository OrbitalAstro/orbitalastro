import type { NextAuthOptions } from 'next-auth'

type SessionTokenOverride = Pick<NonNullable<NextAuthOptions['cookies']>, 'sessionToken'>

/**
 * Domaine du cookie de session (ex. `.orbitalastro.ca`) pour www + apex.
 * `env` injectable pour les tests de régression.
 */
export function deriveSessionCookieDomain(env: typeof process.env): string | undefined {
  const raw = env.NEXTAUTH_COOKIE_DOMAIN?.trim()
  if (raw) return raw
  if (env.NODE_ENV !== 'production') return undefined
  const appUrl = env.NEXT_PUBLIC_APP_URL?.trim()
  if (!appUrl) return undefined
  try {
    const host = new URL(appUrl).hostname.toLowerCase()
    if (host === 'localhost' || host.endsWith('.fly.dev') || host.endsWith('.local')) return undefined
    const parts = host.split('.')
    if (parts.length < 2) return undefined
    const root = parts.slice(-2).join('.')
    if (!/^[a-z0-9.-]+$/i.test(root)) return undefined
    return `.${root}`
  } catch {
    return undefined
  }
}

export function buildSessionCookieOverride(env: typeof process.env): SessionTokenOverride | undefined {
  const domain = deriveSessionCookieDomain(env)
  if (!domain) return undefined
  const secure = env.NODE_ENV === 'production'
  const name = secure ? '__Secure-next-auth.session-token' : 'next-auth.session-token'
  return {
    sessionToken: {
      name,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure,
        domain,
      },
    },
  }
}
