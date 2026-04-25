'use client'

import { Suspense, useState } from 'react'
import { signIn } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Mail, Lock, User, Loader2, ArrowRight } from 'lucide-react'
import Logo from '@/components/Logo'
import Starfield from '@/components/Starfield'

/** Évite les redirections ouvertes (callbackUrl externe). */
function safeCallbackPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/dashboard'
  return raw
}

function SignUpContent() {
  const searchParams = useSearchParams()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const nextPath = safeCallbackPath(searchParams.get('callbackUrl'))
  const signInHref =
    nextPath === '/dashboard'
      ? '/auth/signin'
      : `/auth/signin?callbackUrl=${encodeURIComponent(nextPath)}`

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setLoading(true)

    try {
      const registerResponse = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          name,
        }),
      })

      const registerData = await registerResponse.json()
      if (!registerResponse.ok) {
        setError(registerData?.error || 'Erreur lors de la création du compte')
        return
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Erreur lors de la création du compte')
      } else {
        const onboardingNext = encodeURIComponent(nextPath === '/dashboard' ? '/journal-pilot' : nextPath)
        window.location.assign(`/auth/onboarding?next=${onboardingNext}`)
        return
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-dark via-deep-space to-cosmic-dark flex items-center justify-center px-4 py-12 relative">
      <Starfield />
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <Logo variant="horizontal" size="md" asLink={true} />
        </div>

        <div className="bg-deep-space/50 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
          <h1 className="text-3xl font-bold text-white mb-2 text-center">
            Créer un compte
          </h1>
          <p className="text-cosmic-silver text-center mb-8">
            Commencez votre voyage astrologique
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-cosmic-silver mb-2">
                Nom
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cosmic-silver" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-cosmic-silver focus:outline-none focus:border-cosmic-gold focus:ring-1 focus:ring-cosmic-gold"
                  placeholder="Votre nom"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-cosmic-silver mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cosmic-silver" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-cosmic-silver focus:outline-none focus:border-cosmic-gold focus:ring-1 focus:ring-cosmic-gold"
                  placeholder="votre@email.com"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-cosmic-silver mb-2">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cosmic-silver" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-cosmic-silver focus:outline-none focus:border-cosmic-gold focus:ring-1 focus:ring-cosmic-gold"
                  placeholder="Au moins 8 caractères"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-cosmic-silver mb-2">
                Confirmer le mot de passe
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-cosmic-silver" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-cosmic-silver focus:outline-none focus:border-cosmic-gold focus:ring-1 focus:ring-cosmic-gold"
                  placeholder="Répétez le mot de passe"
                  disabled={loading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-gradient-to-r from-cosmic-gold to-cosmic-purple hover:from-cosmic-gold/90 hover:to-cosmic-purple/90 text-black font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Création du compte...
                </>
              ) : (
                <>
                  Créer mon compte
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-cosmic-silver text-sm">
              Déjà un compte ?{' '}
              <a
                href={signInHref}
                className="text-cosmic-gold hover:underline font-medium"
              >
                Se connecter
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-cosmic-dark via-deep-space to-cosmic-dark flex items-center justify-center text-cosmic-gold">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <SignUpContent />
    </Suspense>
  )
}
