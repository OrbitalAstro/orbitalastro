'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getSession } from 'next-auth/react'
import { CreditCard, Loader2, Trash2 } from 'lucide-react'
import Starfield from '@/components/Starfield'
import { useCartStore } from '@/lib/cart-store'
import { cartHasSubscription, cartLineTotal, linesWithProducts } from '@/lib/cart-rules'
import { formatRecipientSummary } from '@/lib/cart-types'

function CheckoutContent() {
  const searchParams = useSearchParams()
  const lines = useCartStore((s) => s.lines)
  const removeLine = useCartStore((s) => s.removeLine)
  const clear = useCartStore((s) => s.clear)

  const [sessionEmail, setSessionEmail] = useState<string | null>(null)
  const [guestEmail, setGuestEmail] = useState('')
  const [promoCode, setPromoCode] = useState('')
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enriched = useMemo(() => linesWithProducts(lines), [lines])
  const total = cartLineTotal(lines)
  const needsAuth = cartHasSubscription(lines)
  useEffect(() => {
    if (searchParams.get('canceled') === '1') {
      setError('Paiement annulé. Votre panier est conservé.')
      window.history.replaceState({}, '', '/checkout')
    }
    if (searchParams.get('add')) {
      setError('Configurez le produit avant de l’ajouter au panier.')
      window.history.replaceState({}, '', '/checkout')
    }
  }, [searchParams])

  useEffect(() => {
    getSession().then((s) => setSessionEmail(s?.user?.email ?? null))
  }, [])

  async function handlePay() {
    if (lines.length === 0) {
      setError('Votre panier est vide.')
      return
    }
    if (needsAuth && !sessionEmail) {
      setError('Connectez-vous pour l’abonnement Journal pilote.')
      return
    }
    if (!sessionEmail && !guestEmail.trim()) {
      setError('Indiquez votre courriel pour le reçu.')
      return
    }

    setPaying(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          cartLines: lines,
          email: sessionEmail || guestEmail.trim(),
          promoCode: promoCode.trim() || undefined,
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
          <h1 className="text-3xl font-bold text-cosmic-gold mb-2">Panier</h1>
          <p className="text-cosmic-silver text-sm">
            Chaque ligne correspond à une personne (vous ou un tiers). Vérifiez puis payez.
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-400/40 bg-red-900/20 p-3 text-red-100 text-sm">{error}</div>
        ) : null}

        <section className="rounded-xl border border-cosmic-gold/30 bg-deep-space/50 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-white">Articles</h2>
          {enriched.length === 0 ? (
            <p className="text-cosmic-silver text-sm">
              Panier vide.{' '}
              <Link href="/pricing" className="text-cosmic-gold underline">
                Choisir un service
              </Link>
            </p>
          ) : (
            <ul className="space-y-3">
              {enriched.map(({ id, product, recipient }) => (
                <li
                  key={id}
                  className="rounded-lg border border-white/10 bg-black/20 p-4 flex flex-col sm:flex-row sm:items-start gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white">{product.name}</p>
                    <p className="text-xs text-cosmic-gold mt-1">{recipient.label}</p>
                    <p className="text-xs text-cosmic-silver mt-1">{formatRecipientSummary(recipient)}</p>
                    <Link
                      href={`/commander/${product.id}`}
                      className="text-xs text-cosmic-gold/80 underline mt-2 inline-block"
                    >
                      Modifier cette entrée
                    </Link>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold text-cosmic-gold tabular-nums">
                      {product.price.toFixed(2)} $ CAD
                    </span>
                    <button
                      type="button"
                      aria-label="Retirer"
                      onClick={() => removeLine(id)}
                      className="rounded p-1 text-red-300 hover:bg-red-900/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {enriched.length > 0 ? (
            <p className="text-right text-lg font-bold text-cosmic-gold">Total : {total.toFixed(2)} $ CAD</p>
          ) : null}
        </section>

        {needsAuth && !sessionEmail ? (
          <section className="rounded-xl border border-amber-400/30 bg-amber-950/20 p-4 text-sm">
            <p className="text-amber-100 mb-3">Connexion requise pour le Journal pilote.</p>
            <Link
              href={`/auth/signin?callbackUrl=${encodeURIComponent('/checkout')}`}
              className="inline-flex rounded-lg bg-cosmic-gold px-4 py-2 font-semibold text-black"
            >
              Se connecter
            </Link>
          </section>
        ) : null}

        {!sessionEmail && enriched.length > 0 ? (
          <section className="rounded-xl border border-white/10 bg-deep-space/50 p-6">
            <label className="mb-1 block text-sm text-cosmic-silver">Courriel (reçu)</label>
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white"
              placeholder="vous@exemple.com"
            />
          </section>
        ) : sessionEmail ? (
          <p className="text-sm text-center text-cosmic-silver">
            Connecté : <span className="text-cosmic-gold">{sessionEmail}</span>
          </p>
        ) : null}

        <p className="text-xs text-cosmic-silver text-center">
          Vous serez redirigé vers la page de paiement sécurisée Stripe. L&apos;acceptation des{' '}
          <Link href="/terms" className="text-cosmic-gold underline">
            termes et conditions
          </Link>{' '}
          s&apos;y fait juste avant de confirmer le paiement.
        </p>

        <button
          type="button"
          onClick={() => void handlePay()}
          disabled={paying || enriched.length === 0 || (needsAuth && !sessionEmail) || (!sessionEmail && !guestEmail.trim())}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-cosmic-gold py-3.5 font-semibold text-black hover:bg-cosmic-gold/90 disabled:opacity-50"
        >
          {paying ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
          Continuer vers le paiement {total > 0 ? `(${total.toFixed(2)} $ CAD)` : ''}
        </button>

        <p className="text-center text-xs text-cosmic-silver">
          <Link href="/pricing" className="text-cosmic-gold underline">
            Ajouter un autre service
          </Link>
          {' · '}
          <button type="button" onClick={() => clear()} className="underline">
            Vider le panier
          </button>
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
