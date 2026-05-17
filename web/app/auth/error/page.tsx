'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import Logo from '@/components/Logo'
import Starfield from '@/components/Starfield'
import { useTranslation } from '@/lib/useTranslation'

const ERROR_MESSAGES_FR: Record<string, string> = {
  Configuration:
    'Problème de configuration du serveur (vérifie NEXTAUTH_SECRET et NEXTAUTH_URL).',
  AccessDenied: 'Accès refusé.',
  Verification: 'Le lien de vérification a expiré ou a déjà été utilisé.',
  CredentialsSignin: 'Email ou mot de passe incorrect.',
  Default: 'Une erreur est survenue lors de la connexion.',
}

function errorMessage(code: string | null, locale: string): string {
  const key = code && ERROR_MESSAGES_FR[code] ? code : 'Default'
  if (locale === 'fr') return ERROR_MESSAGES_FR[key] ?? ERROR_MESSAGES_FR.Default
  if (key === 'CredentialsSignin') return 'Invalid email or password.'
  if (key === 'Configuration')
    return 'Server configuration issue (check NEXTAUTH_SECRET and NEXTAUTH_URL).'
  return 'Something went wrong while signing in.'
}

function AuthErrorContent() {
  const t = useTranslation()
  const searchParams = useSearchParams()
  const code = searchParams.get('error')
  const message = errorMessage(code, t.locale)

  return (
    <div className="max-w-md w-full relative z-10 text-center">
      <div className="mb-8">
        <Logo variant="horizontal" size="md" asLink={true} />
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md p-8">
        <AlertCircle className="h-12 w-12 text-rose-gold mx-auto mb-4" aria-hidden />
        <h1 className="text-xl font-semibold text-white mb-2">Connexion</h1>
        <p className="text-white/80 mb-6">{message}</p>
        {code && code !== 'CredentialsSignin' && (
          <p className="text-xs text-white/40 mb-4 font-mono">({code})</p>
        )}
        <Link
          href="/auth/signin?callbackUrl=%2Fjournal-pilot"
          className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 text-sm font-medium text-white hover:opacity-90 transition"
        >
          Retour à la connexion
        </Link>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-dark via-deep-space to-cosmic-dark flex items-center justify-center px-4 py-12 relative">
      <Starfield />
      <Suspense
        fallback={
          <div className="relative z-10 text-white/60 text-sm">Chargement…</div>
        }
      >
        <AuthErrorContent />
      </Suspense>
    </div>
  )
}
