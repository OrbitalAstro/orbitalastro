import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'

export const runtime = 'nodejs'

/**
 * Outil de diagnostic local uniquement.
 * Les cookies NextAuth sont httpOnly : le navigateur ne peut pas les lire en JS ;
 * cette route indique si le serveur reçoit bien les en-têtes Cookie et décode la session.
 *
 * GET http://localhost:3000/api/dev/auth-session-check
 */
export async function GET() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const jar = await cookies()
  const all = jar.getAll()
  const nextAuthNames = all
    .map((c) => c.name)
    .filter(
      (n) =>
        n.includes('next-auth') ||
        n.includes('authjs') ||
        n.includes('__Secure-next-auth') ||
        n.includes('__Host-next-auth'),
    )

  const session = await getServerSession(authOptions)

  return NextResponse.json({
    serverSeesSession: Boolean(session?.user?.id),
    userId: session?.user?.id ?? null,
    email: session?.user?.email ?? null,
    nextAuthCookieNames: nextAuthNames,
    hasSessionTokenCookie: nextAuthNames.some(
      (n) => n.includes('session-token') || n.includes('session_token'),
    ),
    totalCookieCount: all.length,
    hint:
      !nextAuthNames.length && !session
        ? 'Aucun cookie NextAuth : connexion non faite, ou mauvais hôte (localhost vs 127.0.0.1), ou cookies bloqués.'
        : nextAuthNames.length && !session
          ? 'Cookie présent mais session illisible : vérifier NEXTAUTH_SECRET identique au moment du login.'
          : null,
  })
}
