'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShoppingBag } from 'lucide-react'
import { useCartStore } from '@/lib/cart-store'

type Props = {
  className?: string
}

export default function CartNavLink({ className = '' }: Props) {
  const [mounted, setMounted] = useState(false)
  const count = useCartStore((s) => s.itemCount())

  useEffect(() => setMounted(true), [])

  return (
    <Link
      href="/checkout"
      className={`relative inline-flex items-center gap-1.5 text-cosmic-gold/90 hover:text-cosmic-gold transition ${className}`}
      aria-label={`Panier${count > 0 ? `, ${count} article${count > 1 ? 's' : ''}` : ''}`}
    >
      <ShoppingBag className="h-5 w-5" />
      <span className="hidden sm:inline text-sm">Panier</span>
      {mounted && count > 0 ? (
        <span className="absolute -right-2 -top-2 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-cosmic-gold px-1 text-[10px] font-bold text-cosmic-purple">
          {count > 9 ? '9+' : count}
        </span>
      ) : null}
    </Link>
  )
}
