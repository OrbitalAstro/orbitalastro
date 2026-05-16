'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2 } from 'lucide-react'
import Starfield from '@/components/Starfield'
import { useCartStore } from '@/lib/cart-store'
import { getProductById, getProductDestination } from '@/lib/stripe-catalog'

function SuccessContent() {
  const searchParams = useSearchParams()
  const clear = useCartStore((s) => s.clear)
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [productIds, setProductIds] = useState<string[]>([])
  const [message, setMessage] = useState('')

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (!sessionId) {
      setStatus('error')
      setMessage('Session de paiement introuvable.')
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
        const data = await res.json()
        if (!res.ok || !data.paid) {
          throw new Error(data.error || 'Paiement non confirmé.')
        }
        if (cancelled) return
        const ids: string[] = data.productIds?.length ? data.productIds : [data.productId]
        setProductIds(ids)
        clear()
        setStatus('ok')
      } catch (e) {
        if (!cancelled) {
          setStatus('error')
          setMessage(e instanceof Error ? e.message : 'Erreur de vérification')
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [searchParams, clear])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center text-cosmic-gold">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const sessionId = searchParams.get('session_id') || ''

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-dark via-deep-space to-cosmic-dark text-white py-20 px-4 relative">
      <Starfield />
      <div className="max-w-lg mx-auto relative z-10 text-center space-y-6">
        {status === 'ok' ? (
          <>
            <CheckCircle2 className="h-16 w-16 text-emerald-400 mx-auto" />
            <h1 className="text-2xl font-bold text-cosmic-gold">Paiement réussi</h1>
            <p className="text-cosmic-silver text-sm">Merci ! Voici vos accès :</p>
            <ul className="space-y-2 text-left">
              {productIds.map((id) => {
                const p = getProductById(id)
                const base = getProductDestination(id)
                const sep = base.includes('?') ? '&' : '?'
                const href = sessionId ? `${base}${sep}session_id=${sessionId}` : base
                return (
                  <li key={id}>
                    <Link
                      href={href}
                      className="block rounded-lg border border-cosmic-gold/40 bg-cosmic-purple/30 px-4 py-3 text-cosmic-gold hover:bg-cosmic-gold/10"
                    >
                      {p?.name || id} → Accéder
                    </Link>
                  </li>
                )
              })}
            </ul>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-red-200">Problème de confirmation</h1>
            <p className="text-cosmic-silver text-sm">{message}</p>
            <Link href="/checkout" className="text-cosmic-gold underline">
              Retour au panier
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-cosmic-gold">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  )
}
