import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { getSupabaseAdmin } from '@/lib/supabase'
import { verifyPassword } from '@/lib/password'

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
}
