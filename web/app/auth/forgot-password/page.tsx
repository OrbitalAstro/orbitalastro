'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Loader2, ArrowLeft } from 'lucide-react'
import Logo from '@/components/Logo'
import Starfield from '@/components/Starfield'
import { useTranslation } from '@/lib/useTranslation'

export default function ForgotPasswordPage() {
  const t = useTranslation()
  const p = t.authPasswordReset
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; code?: string }
      if (!res.ok || data.ok === false) {
        if (data.code === 'RESET_DB') setError(p.errorResetUnavailable)
        else if (data.code === 'EMAIL_SEND') setError(p.errorEmailSendFailed)
        else setError(p.errorServer)
        return
      }
      setSent(true)
    } catch {
      setError(p.errorServer)
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
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 text-center">{p.forgotTitle}</h1>
          <p className="text-cosmic-silver text-center mb-6 text-sm">{p.forgotSubtitle}</p>

          {error && (
            <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {sent ? (
            <div className="space-y-4">
              <p className="text-cosmic-gold/90 text-sm text-center">{p.sentMessage}</p>
              <Link
                href="/auth/signin"
                className="flex items-center justify-center gap-2 text-cosmic-gold hover:underline text-sm font-medium"
              >
                <ArrowLeft className="h-4 w-4" />
                {p.backSignIn}
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-cosmic-silver mb-2">
                  {p.emailLabel}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-cosmic-silver" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-cosmic-silver focus:outline-none focus:border-cosmic-gold focus:ring-1 focus:ring-cosmic-gold"
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
                    {p.sending}
                  </>
                ) : (
                  p.submit
                )}
              </button>
              <Link href="/auth/signin" className="block text-center text-sm text-cosmic-silver hover:text-cosmic-gold">
                {p.backSignIn}
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
