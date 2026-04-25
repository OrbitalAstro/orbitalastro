'use client'

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react'
import { getSession } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react'
import Logo from '@/components/Logo'
import LocationInput from '@/components/LocationInput'
import Starfield from '@/components/Starfield'

type Gate = 'loading' | 'authenticated' | 'unauthenticated'

type Profile = {
  display_name?: string | null
  birth_date?: string | null
  birth_time?: string | null
  birth_place?: string | null
  latitude?: number | null
  longitude?: number | null
  timezone?: string | null
}

function safePath(raw: string | null, fallback = '/journal-pilot'): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return fallback
  return raw
}

function OnboardingContent() {
  const searchParams = useSearchParams()
  const nextPath = useMemo(() => safePath(searchParams.get('next')), [searchParams])
  const [authGate, setAuthGate] = useState<Gate>('loading')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    display_name: '',
    birth_date: '',
    birth_time: '12:00',
    birth_place: '',
    latitude: 0,
    longitude: 0,
    timezone: 'UTC',
  })

  useEffect(() => {
    let cancelled = false
    getSession().then((session) => {
      if (cancelled) return
      if (!session?.user?.id) {
        setAuthGate('unauthenticated')
        const onboardingPath = `/auth/onboarding?next=${encodeURIComponent(nextPath)}`
        window.location.assign(`/auth/signin?callbackUrl=${encodeURIComponent(onboardingPath)}`)
        return
      }
      setAuthGate('authenticated')
    })
    return () => {
      cancelled = true
    }
  }, [nextPath])

  useEffect(() => {
    if (authGate !== 'authenticated') return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError('')
      try {
        const res = await fetch('/api/journal/profile', { credentials: 'include' })
        const json = await res.json()
        if (!res.ok) throw new Error(json?.error || 'Impossible de charger le profil')
        const p: Profile | null = json.profile
        if (!p) return
        const profileAlreadyComplete = Boolean(
          p.birth_date &&
            p.birth_time &&
            p.birth_place &&
            typeof p.latitude === 'number' &&
            typeof p.longitude === 'number',
        )
        if (!cancelled) {
          setForm({
            display_name: p.display_name || '',
            birth_date: p.birth_date || '',
            birth_time: p.birth_time || '12:00',
            birth_place: p.birth_place || '',
            latitude: p.latitude || 0,
            longitude: p.longitude || 0,
            timezone: p.timezone || 'UTC',
          })
          if (profileAlreadyComplete) {
            setConfirmed(true)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Erreur inconnue')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [authGate])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/journal/profile', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'Impossible de sauvegarder')
      setConfirmed(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue')
    } finally {
      setSaving(false)
    }
  }

  if (authGate === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cosmic-dark via-deep-space to-cosmic-dark flex items-center justify-center text-cosmic-gold">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (authGate === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-dark via-deep-space to-cosmic-dark flex items-center justify-center px-4 py-12 relative">
      <Starfield />
      <div className="max-w-2xl w-full relative z-10">
        <div className="text-center mb-8">
          <Logo variant="horizontal" size="md" asLink={true} />
        </div>

        <div className="bg-deep-space/50 backdrop-blur-md border border-white/10 rounded-2xl p-8 shadow-2xl space-y-6">
          <h1 className="text-3xl font-bold text-white text-center">Finaliser votre compte</h1>
          <p className="text-cosmic-silver text-center">
            Étape 2/3 : ajoutez vos données de naissance pour activer votre Journal Pilot personnalisé.
          </p>

          {error ? (
            <div className="p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-300 text-sm">{error}</div>
          ) : null}

          {!confirmed ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block mb-1 text-sm text-cosmic-silver">Prénom</label>
                <input
                  value={form.display_name}
                  onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))}
                  className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                  placeholder="Votre prénom"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1 text-sm text-cosmic-silver">Date de naissance</label>
                  <input
                    type="date"
                    value={form.birth_date}
                    onChange={(e) => setForm((p) => ({ ...p, birth_date: e.target.value }))}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm text-cosmic-silver">Heure de naissance</label>
                  <input
                    type="time"
                    value={form.birth_time}
                    onChange={(e) => setForm((p) => ({ ...p, birth_time: e.target.value }))}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
              </div>

              <LocationInput
                value={form.birth_place}
                onChange={(value) => setForm((p) => ({ ...p, birth_place: value }))}
                onLocationSelect={(location) =>
                  setForm((p) => ({
                    ...p,
                    birth_place: location.name,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    timezone: location.timezone || 'UTC',
                  }))
                }
                label="Lieu de naissance"
                required
              />

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3 px-6 bg-gradient-to-r from-cosmic-gold to-cosmic-purple text-black font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Confirmation...
                  </>
                ) : (
                  <>
                    Confirmer mon compte
                    <CheckCircle2 className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="p-4 rounded-lg border border-emerald-400/40 bg-emerald-900/20 text-emerald-200 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 mt-0.5" />
                <div>
                  <p className="font-semibold">Compte confirmé</p>
                  <p className="text-sm">Vos données de naissance sont enregistrées et liées à votre compte.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => window.location.assign(nextPath)}
                className="w-full py-3 px-6 bg-gradient-to-r from-cosmic-gold to-cosmic-purple text-black font-semibold rounded-lg transition flex items-center justify-center gap-2"
              >
                <Sparkles className="h-5 w-5" />
                Ouvrir le Journal Pilot
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-b from-cosmic-dark via-deep-space to-cosmic-dark flex items-center justify-center text-cosmic-gold">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  )
}
