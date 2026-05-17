import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth-options'

/** Évite le bundling edge ; authorize utilise crypto + Supabase admin. */
export const runtime = 'nodejs'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
