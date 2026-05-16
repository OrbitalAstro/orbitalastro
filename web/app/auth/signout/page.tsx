'use client'

import { Suspense, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import Logo from '@/components/Logo'
import Starfield from '@/components/Starfield'

/** Chemin relatif uniquement — évite les callbackUrl absolues mal formées. */
function safeCallbackPath(raw: string | null): string {
  if (!raw) return '/'
  const trimmed = raw.trim().replace(/^["']+|["']+$/g, '')
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      return new URL(trimmed).pathname || '/'
    } catch {
      return '/'
    }
  }
  if (!trimmed.startsWith('/') || trimmed.startsWith('//')) return '/'
  return trimmed
}

function SignOutContent() {
  const searchParams = useSearchParams()
  const callbackUrl = safeCallbackPath(searchParams.get('callbackUrl'))

  useEffect(() => {
    void signOut({ callbackUrl })
  }, [callbackUrl])

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-purple to-magenta-purple text-cosmic-gold relative flex items-center justify-center px-4">
      <Starfield />
      <div className="relative z-10 text-center max-w-md">
        <Logo className="mx-auto mb-6" />
        <Loader2 className="h-8 w-8 animate-spin text-cosmic-gold mx-auto mb-4" />
        <p className="text-cosmic-gold/90">Déconnexion en cours…</p>
      </div>
    </div>
  )
}

function SignOutFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-purple to-magenta-purple flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-cosmic-gold" />
    </div>
  )
}

export default function SignOutPage() {
  return (
    <Suspense fallback={<SignOutFallback />}>
      <SignOutContent />
    </Suspense>
  )
}
