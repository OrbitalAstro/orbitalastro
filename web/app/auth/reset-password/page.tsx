'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Lock, Loader2, ArrowLeft } from 'lucide-react'
import Logo from '@/components/Logo'
import Starfield from '@/components/Starfield'
import { useTranslation } from '@/lib/useTranslation'

type PwReset = ReturnType<typeof useTranslation>['authPasswordReset']

function mapResetError(code: string | undefined, p: PwReset) {
  switch (code) {
    case 'SHORT':
      return p.errorShort
    case 'INVALID':
      return p.errorInvalid
    case 'SERVER':
      return p.errorServer
    default:
      return p.errorServer
  }
}

function ResetPasswordContent() {
  const t = useTranslation()
  const p = t.authPasswordReset
  const searchParams = useSearchParams()
  const token = searchParams.get('token')?.trim() || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError(p.errorMismatch)
      return
    }
    if (password.length < 8) {
      setError(p.errorShort)
      return
    }
    if (!token) {
      setError(p.errorMissingToken)
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(mapResetError(typeof data.error === 'string' ? data.error : undefined, p))
        return
      }
      setDone(true)
    } catch {
      setError(p.errorServer)
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="bg-deep-space/50 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
        <p className="text-cosmic-silver text-sm text-center mb-4">{p.errorMissingToken}</p>
        <Link
          href="/auth/forgot-password"
          className="block text-center text-cosmic-gold hover:underline text-sm font-medium"
        >
          {p.settingsCta}
        </Link>
        <Link href="/auth/signin" className="block text-center mt-4 text-sm text-cosmic-silver hover:text-white">
          {p.backSignIn}
        </Link>
      </div>
    )
  }

  if (done) {
    return (
      <div className="bg-deep-space/50 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl text-center space-y-4">
        <p className="text-cosmic-gold/90 text-sm">{p.successMessage}</p>
        <Link
          href="/auth/signin"
          className="inline-flex items-center justify-center gap-2 py-3 px-6 bg-gradient-to-r from-cosmic-gold to-cosmic-purple text-black font-semibold rounded-lg"
        >
          {p.goSignIn}
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-deep-space/50 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">{p.resetTitle}</h1>
      <p className="text-cosmic-silver text-center mb-6 text-sm">{p.resetSubtitle}</p>
      {error && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="pw" className="block text-sm font-medium text-cosmic-silver mb-2">
            {p.newPasswordLabel}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-cosmic-silver" />
            <input
              id="pw"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cosmic-gold focus:ring-1 focus:ring-cosmic-gold"
              disabled={loading}
            />
          </div>
        </div>
        <div>
          <label htmlFor="pw2" className="block text-sm font-medium text-cosmic-silver mb-2">
            {p.confirmPasswordLabel}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-cosmic-silver" />
            <input
              id="pw2"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:border-cosmic-gold focus:ring-1 focus:ring-cosmic-gold"
              disabled={loading}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-6 bg-gradient-to-r from-cosmic-gold to-cosmic-purple hover:from-cosmic-gold/90 hover:to-cosmic-purple/90 text-black font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {p.updating}
            </>
          ) : (
            p.submitReset
          )}
        </button>
        <Link href="/auth/signin" className="flex items-center justify-center gap-2 text-sm text-cosmic-silver hover:text-cosmic-gold">
          <ArrowLeft className="h-4 w-4" />
          {p.backSignIn}
        </Link>
      </form>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-dark via-deep-space to-cosmic-dark flex items-center justify-center px-4 py-12 relative">
      <Starfield />
      <div className="max-w-md w-full relative z-10">
        <div className="text-center mb-8">
          <Logo variant="horizontal" size="md" asLink={true} />
        </div>
        <Suspense
          fallback={
            <div className="bg-deep-space/50 backdrop-blur-md border border-white/10 rounded-2xl p-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-cosmic-gold" />
            </div>
          }
        >
          <ResetPasswordContent />
        </Suspense>
      </div>
    </div>
  )
}
