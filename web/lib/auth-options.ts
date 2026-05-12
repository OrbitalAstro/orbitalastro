import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyPassword } from '@/lib/password'

/**
 * Cookie de session sur le domaine parent (ex. `.orbitalastro.ca`) pour que la session
 * soit envoyée sur `www` et sans `www`.
 *
 * - Surcharge explicite : secret Fly `NEXTAUTH_COOKIE_DOMAIN=.orbitalastro.ca`
 * - Sinon : dérivé de `NEXT_PUBLIC_APP_URL` (doit être une build-arg Docker / fly.toml,
 *   pas seulement un secret runtime, pour être présent dans le bundle prod).
 */
function sessionCookieDomain(): string | undefined {
  const raw = process.env.NEXTAUTH_COOKIE_DOMAIN?.trim()
  if (raw) return raw
  if (process.env.NODE_ENV !== 'production') return undefined
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim()
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

function sessionCookieOverride():
  | Pick<NonNullable<NextAuthOptions['cookies']>, 'sessionToken'>
  | undefined {
  const domain = sessionCookieDomain()
  if (!domain) return undefined
  const secure = process.env.NODE_ENV === 'production'
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

const sessionCookies = sessionCookieOverride()

/**
 * Config NextAuth centralisée (ne pas importer depuis la route API pour éviter
 * doubles instances / session JWT illisible côté getServerSession).
 */
export const authOptions: NextAuthOptions = {
  trustHost: true,
  providers: [
    CredentialsProvider({
      name: 'Email',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const email = credentials.email.toLowerCase().trim()
        const supabase = getSupabaseAdmin()
        const { data: user, error } = await supabase
          .from('auth_users')
          .select('id, email, display_name, password_hash')
          .eq('email', email)
          .maybeSingle()

        if (error || !user) return null
        if (!verifyPassword(credentials.password, user.password_hash || '')) return null

        return {
          id: user.id,
          email: user.email,
          name: user.display_name || user.email.split('@')[0],
        }
      },
    }),
  ],

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  pages: {
    signIn: '/auth/signin',
    signOut: '/auth/signout',
    error: '/auth/error',
  },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',

  ...(sessionCookies ? { cookies: sessionCookies } : {}),
}
