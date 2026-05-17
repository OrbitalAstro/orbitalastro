'use client'

import { FormEvent, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '@/lib/useTranslation'

type PwReset = ReturnType<typeof useTranslation>['authPasswordReset']

function mapChangeError(code: string | undefined, p: PwReset): string {
  switch (code) {
    case 'WRONG_CURRENT':
      return p.errorWrongCurrent
    case 'SAME_PASSWORD':
      return p.errorSamePassword
    case 'SHORT':
      return p.errorShort
    case 'MISMATCH':
      return p.errorMismatch
    case 'MISSING_CURRENT':
    case 'MISSING_NEW':
      return p.errorServer
    case 'UNAUTHORIZED':
      return p.errorChangeUnauthorized
    default:
      return p.errorServer
  }
}

export default function ChangePasswordForm() {
  const t = useTranslation()
  const p = t.authPasswordReset
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setDone(false)

    if (newPassword !== confirmPassword) {
      setError(p.errorMismatch)
      return
    }
    if (newPassword.length < 8) {
      setError(p.errorShort)
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(mapChangeError(typeof data.error === 'string' ? data.error : undefined, p))
        return
      }
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setDone(true)
    } catch {
      setError(p.errorServer)
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <p className="rounded-lg border border-emerald-400/35 bg-emerald-900/25 px-4 py-3 text-sm text-emerald-100">
        {p.successChangeMessage}
      </p>
    )
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4 max-w-md">
      <p className="text-white/70 text-sm">{p.settingsChangeIntro}</p>
      <div>
        <label htmlFor="current-password" className="mb-1 block text-sm text-white/80">
          {p.currentPasswordLabel}
        </label>
        <input
          id="current-password"
          type="password"
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      <div>
        <label htmlFor="new-password" className="mb-1 block text-sm text-white/80">
          {p.newPasswordLabel}
        </label>
        <input
          id="new-password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={8}
          className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      <div>
        <label htmlFor="confirm-new-password" className="mb-1 block text-sm text-white/80">
          {p.confirmPasswordLabel}
        </label>
        <input
          id="confirm-new-password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={8}
          className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>
      {error ? <p className="text-sm text-red-300">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-cosmic-gold px-4 py-2 text-sm font-semibold text-cosmic-purple hover:bg-cosmic-gold/90 disabled:opacity-60 transition"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? p.updating : p.submitChange}
      </button>
    </form>
  )
}
