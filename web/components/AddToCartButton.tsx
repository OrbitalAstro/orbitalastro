'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { getProductById } from '@/lib/stripe-catalog'

type Props = {
  productId: string
  className?: string
  label?: string
}

export default function AddToCartButton({
  productId,
  className = '',
  label = 'Commander',
}: Props) {
  const product = getProductById(productId)
  if (!product || product.id === 'valentine-2026') {
    return (
      <button
        type="button"
        disabled
        className="w-full py-3 px-6 bg-gray-500/50 text-gray-300 font-semibold rounded-lg cursor-not-allowed"
      >
        Bientôt disponible
      </button>
    )
  }

  return (
    <Link
      href={`/commander/${productId}`}
      className={
        className ||
        'inline-flex w-full items-center justify-center gap-2 rounded-lg bg-cosmic-gold px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-cosmic-gold/90'
      }
    >
      <ShoppingCart className="h-4 w-4" />
      {label}
    </Link>
  )
}
