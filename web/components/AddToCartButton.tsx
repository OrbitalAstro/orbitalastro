'use client'

import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/lib/cart-store'

type Props = {
  productId: string
  className?: string
  label?: string
  goToCheckout?: boolean
}

export default function AddToCartButton({
  productId,
  className = '',
  label = 'Ajouter au panier',
  goToCheckout = false,
}: Props) {
  const router = useRouter()
  const addProduct = useCartStore((s) => s.addProduct)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    const err = addProduct(productId)
    if (err) {
      setError(err)
      setAdded(false)
      return
    }
    setError(null)
    setAdded(true)
    if (goToCheckout) {
      router.push('/checkout')
      return
    }
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={handleClick}
        className={
          className ||
          'inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cosmic-gold px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-cosmic-gold/90'
        }
      >
        {added ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
        {added ? 'Ajouté' : label}
      </button>
      {error ? <p className="text-xs text-amber-200/90">{error}</p> : null}
    </div>
  )
}
