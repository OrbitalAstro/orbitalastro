'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { CheckCircle2, ShoppingBag } from 'lucide-react'
import Starfield from '@/components/Starfield'
import BackButton from '@/components/BackButton'
import ProductOrderForm from '@/components/ProductOrderForm'
import { getProductById } from '@/lib/stripe-catalog'
import { useCartStore } from '@/lib/cart-store'
import type { CartRecipientProfile } from '@/lib/cart-types'
import { useSettingsStore } from '@/lib/store'

export default function CommanderProductPage() {
  const params = useParams()
  const router = useRouter()
  const productId = typeof params.productId === 'string' ? params.productId : ''
  const product = useMemo(() => getProductById(productId), [productId])
  const addConfiguredLine = useCartStore((s) => s.addConfiguredLine)
  const updateSettings = useSettingsStore((s) => s.updateSettings)
  const [added, setAdded] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center text-cosmic-gold px-4">
        <p>
          Produit introuvable.{' '}
          <Link href="/pricing" className="underline">
            Voir les services
          </Link>
        </p>
      </div>
    )
  }

  async function handleAdd(recipient: CartRecipientProfile) {
    const err = addConfiguredLine(productId, recipient)
    if (err) {
      setAddError(err)
      throw new Error(err)
    }
    updateSettings?.({
      defaultBirthDate: recipient.birth_date,
      defaultBirthTime: recipient.birth_time,
      defaultFirstName: recipient.display_name,
      defaultLatitude: recipient.latitude,
      defaultLongitude: recipient.longitude,
      defaultTimezone: recipient.timezone,
    })
    setAddError(null)
    setAdded(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-dark via-deep-space to-cosmic-dark text-white py-16 px-4 relative">
      <Starfield />
      <div className="max-w-xl mx-auto relative z-10">
        <BackButton />
        <div className="mt-6 rounded-xl border border-cosmic-gold/30 bg-deep-space/50 p-6 sm:p-8">
          <h1 className="text-2xl font-bold text-cosmic-gold mb-1">Commander</h1>
          <p className="text-cosmic-silver text-sm mb-6">
            {product.name} — {product.price.toFixed(2)} $ CAD
            {product.type === 'subscription' ? ' / mois' : ''}
          </p>

          {added ? (
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-lg border border-emerald-400/40 bg-emerald-900/20 p-4 text-emerald-100">
                <CheckCircle2 className="h-6 w-6 shrink-0" />
                <div>
                  <p className="font-semibold">Ajouté au panier</p>
                  <p className="text-sm mt-1">
                    Vous pouvez ajouter le même produit avec d&apos;autres informations de naissance,
                    ou passer au paiement.
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setAdded(false)}
                  className="flex-1 rounded-lg border border-cosmic-gold/40 px-4 py-2.5 text-sm font-medium text-cosmic-gold hover:bg-cosmic-gold/10"
                >
                  Même produit, autres informations
                </button>
                <Link
                  href="/checkout"
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-cosmic-gold px-4 py-2.5 text-sm font-semibold text-cosmic-purple"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Voir le panier
                </Link>
              </div>
              <button
                type="button"
                onClick={() => router.push(product.type === 'subscription' ? '/journal-pilot' : '/pricing')}
                className="w-full text-sm text-cosmic-silver underline"
              >
                Continuer vos achats
              </button>
            </div>
          ) : (
            <>
              {addError ? <p className="mb-4 text-sm text-amber-200">{addError}</p> : null}
              <ProductOrderForm
                productName={product.name}
                showEmail={product.type === 'one-time'}
                onSubmit={handleAdd}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
