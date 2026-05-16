'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getSession } from 'next-auth/react'
import { CreditCard, Loader2, Minus, Plus, Trash2 } from 'lucide-react'
import Starfield from '@/components/Starfield'
import CheckoutConsentCheckboxes from '@/components/CheckoutConsentCheckboxes'
import CheckoutBirthForm, {
  isBirthProfileComplete,
  type BirthProfileForm,
} from '@/components/CheckoutBirthForm'
import { useCartStore } from '@/lib/cart-store'
import { cartHasSubscription, cartLineTotal, linesWithProducts } from '@/lib/cart-rules'
import { useSettingsStore } from '@/lib/store'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const lines = useCartStore((s) => s.lines)
  const setQuantity = useCartStore((s) => s.setQuantity)
  const removeProduct = useCartStore((s) => s.removeProduct)
  const addProduct = useCartStore((s) => s.addProduct)

  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [guestEmail, setGuestEmail] = useState('')
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [confirmBirthData, setConfirmBirthData] = useState(false)
  const [promoCode, setPromoCode] = useState('')
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [birthForm, setBirthForm] = useState<BirthProfileForm>({
    display_name: '',
    birth_date: '',
    birth_time: '12:00',
    birth_place: '',
    latitude: 0,
    longitude: 0,
    timezone: 'UTC',
  })

  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const settings = useSettingsStore()

  const enriched = useMemo(() => linesWithProducts(lines), [lines])
  const total = cartLineTotal(lines)
  const needsAuth = cartHasSubscription(lines)
  const checkoutReady = acceptTerms && confirmBirthData && isBirthProfileComplete(birthForm)

  useEffect(() => {
    const add = searchParams.get('add')
    if (add) {
      const err = addProduct(add)
      if (err) setError(err)
      window.history.replaceState({}, '', '/checkout')
    }
  }, [searchParams, addProduct])

  useEffect(() => {
    if (searchParams.get('canceled') === '1') {
      setError('Paiement annulé. Votre panier est conservé.')
      window.history.replaceState({}, '', '/checkout')
    }
  }, [searchParams])

  useEffect(() => {
    getSession().then((s) => {
      setSessionEmail(s?.user?.email ?? null)
    })
  }, [])

  useEffect(() => {
    setBirthForm((prev) => ({
      ...prev,
      birth_date: settings.defaultBirthDate || prev.birth_date,
      birth_time: settings.defaultBirthTime || prev.birth_time,
      birth_place: prev.birth_place,
      latitude: settings.defaultLatitude ?? prev.latitude,
      longitude: settings.defaultLongitude ?? prev.longitude,
      timezone: settings.defaultTimezone || prev.timezone,
      display_name: settings.defaultFirstName || prev.display_name,
    }))
  }, [
    settings.defaultBirthDate,
    settings.defaultBirthTime,
    settings.defaultLatitude,
    settings.defaultLongitude,
    settings.defaultTimezone,
    settings.defaultFirstName,
  ])

  useEffect(() => {
    if (!sessionEmail) return
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/journal/profile', { credentials: 'include' })
        const json = await res.json()
        const p = json.profile
        if (!p || cancelled) return
        setBirthForm((prev) => ({
          display_name: p.display_name || prev.display_name,
          birth_date: p.birth_date || prev.birth_date,
          birth_time: p.birth_time || prev.birth_time,
          birth_place: p.birth_place || prev.birth_place,
          latitude: p.latitude ?? prev.latitude,
          longitude: p.longitude ?? prev.longitude,
          timezone: p.timezone || prev.timezone,
        }))
      } catch {
        // ignore
      }
    })()
    return () => {
      cancelled = true
    }
  }, [sessionEmail])

  async function persistBirthData() {
    updateSettings?.({
      defaultBirthDate: birthForm.birth_date,
      defaultBirthTime: birthForm.birth_time,
      defaultFirstName: birthForm.display_name,
      defaultLatitude: birthForm.latitude,
      defaultLongitude: birthForm.longitude,
      defaultTimezone: birthForm.timezone,
    })

    if (sessionEmail) {
      const res = await fetch('/api/journal/profile', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(birthForm),
      })
      if (!res.ok) {
        const json = await res.json()
        throw new Error(json?.error || 'Impossible d’enregistrer le profil natal.')
      }
    }
  }

  async function handlePay() {
    if (lines.length === 0) {
      setError('Votre panier est vide.')
      return
    }
    if (!checkoutReady) {
      setError('Complétez vos données de naissance et cochez les deux confirmations.')
      return
    }
    if (needsAuth && !sessionEmail) {
      setError('Connectez-vous pour souscrire au Journal pilote.')
      return
    }
    if (!sessionEmail && !guestEmail.trim()) {
      setError('Indiquez votre courriel pour recevoir le reçu et accéder à vos achats.')
      return
    }

    setPaying(true)
    setError(null)
    try {
      await persistBirthData()
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
          email: sessionEmail || guestEmail.trim(),
          promoCode: promoCode.trim() || undefined,
          acceptTerms: true,
          confirmBirthData: true,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Erreur de paiement')
      if (data.url) {
        window.location.href = data.url
        return
      }
      throw new Error('URL de paiement manquante.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur de paiement')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-dark via-deep-space to-cosmic-dark text-white py-16 px-4 relative">
      <Starfield />
      <div className="max-w-3xl mx-auto relative z-10 space-y-8">
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-cosmic-gold mb-2">Panier et paiement</h1>
          <p className="text-cosmic-silver text-sm">
            Vérifiez votre commande, confirmez vos données de naissance, puis payez en une seule étape.
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-400/40 bg-red-900/20 p-3 text-red-100 text-sm">{error}</div>
        ) : null}

        <section className="rounded-xl border border-cosmic-gold/30 bg-deep-space/50 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Votre panier</h2>
          {enriched.length === 0 ? (
            <p className="text-cosmic-silver text-sm">
              Panier vide.{' '}
              <Link href="/pricing" className="text-cosmic-gold underline">
                Parcourir les services
              </Link>
            </p>
          ) : (
            <ul className="space-y-3">
              {enriched.map(({ productId, product, quantity }) => (
                <li
                  key={productId}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-lg border border-white/10 bg-black/20 p-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">{product.name}</p>
                    <p className="text-xs text-cosmic-silver truncate">{product.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {product.type === 'one-time' ? (
                      <>
                        <button
                          type="button"
                          aria-label="Diminuer la quantité"
                          onClick={() => setQuantity(productId, quantity - 1)}
                          className="rounded border border-white/20 p-1 hover:bg-white/10"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center tabular-nums">{quantity}</span>
                        <button
                          type="button"
                          aria-label="Augmenter la quantité"
                          onClick={() => setQuantity(productId, quantity + 1)}
                          className="rounded border border-white/20 p-1 hover:bg-white/10"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-cosmic-silver">Abonnement mensuel</span>
                    )}
                    <span className="ml-2 font-semibold text-cosmic-gold tabular-nums">
                      {(product.price * quantity).toFixed(2)} $ CAD
                    </span>
                    <button
                      type="button"
                      aria-label="Retirer du panier"
                      onClick={() => removeProduct(productId)}
                      className="ml-2 rounded p-1 text-red-300 hover:bg-red-900/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {enriched.length > 0 ? (
            <p className="text-right text-lg font-bold text-cosmic-gold">
              Total : {total.toFixed(2)} $ CAD
            </p>
          ) : null}
        </section>

        {needsAuth && !sessionEmail ? (
          <section className="rounded-xl border border-amber-400/30 bg-amber-950/20 p-4 text-sm">
            <p className="text-amber-100 mb-3">
              Le Journal pilote nécessite un compte. Connectez-vous ou créez un compte avant de payer.
            </p>
            <Link
              href={`/auth/signin?callbackUrl=${encodeURIComponent('/checkout')}`}
              className="inline-flex rounded-lg bg-cosmic-gold px-4 py-2 font-semibold text-black"
            >
              Se connecter
            </Link>
          </section>
        ) : null}

        {!sessionEmail && enriched.length > 0 && !needsAuth ? (
          <section className="rounded-xl border border-white/10 bg-deep-space/50 p-6">
            <label className="mb-1 block text-sm text-cosmic-silver">Courriel (reçu et accès aux produits)</label>
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
              placeholder="vous@exemple.com"
              required
            />
          </section>
        ) : sessionEmail ? (
          <p className="text-sm text-cosmic-silver text-center">
            Connecté en tant que <span className="text-cosmic-gold">{sessionEmail}</span>
          </p>
        ) : null}

        <section className="rounded-xl border border-white/10 bg-deep-space/50 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Données de naissance</h2>
          <p className="text-sm text-cosmic-silver">
            Ces informations sont indispensables pour tous nos services astrologiques.
          </p>
          <CheckoutBirthForm
            value={birthForm}
            onChange={setBirthForm}
            showDisplayName={Boolean(sessionEmail)}
          />
        </section>

        <section className="rounded-xl border border-white/10 bg-deep-space/50 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Code promo (achats à la pièce)</h2>
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="Optionnel"
            className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
          />
        </section>

        <CheckoutConsentCheckboxes
          acceptTerms={acceptTerms}
          confirmBirthData={confirmBirthData}
          onAcceptTermsChange={setAcceptTerms}
          onConfirmBirthDataChange={setConfirmBirthData}
          birthDateLabel={birthForm.birth_date || null}
          birthTimeLabel={birthForm.birth_time?.slice(0, 5) || null}
        />

        <button
          type="button"
          onClick={() => void handlePay()}
          disabled={paying || enriched.length === 0 || !checkoutReady || (needsAuth && !sessionEmail)}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-cosmic-gold py-3.5 font-semibold text-black hover:bg-cosmic-gold/90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {paying ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
          Payer {total > 0 ? `${total.toFixed(2)} $ CAD` : ''}
        </button>

        <p className="text-center text-xs text-cosmic-silver">
          Paiement sécurisé par Stripe.{' '}
          <Link href="/pricing" className="text-cosmic-gold hover:underline">
            Continuer vos achats
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-cosmic-gold">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  )
}
