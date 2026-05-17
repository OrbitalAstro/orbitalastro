'use client'

import Link from 'next/link'

type Props = {
  acceptTerms: boolean
  onAcceptTermsChange: (value: boolean) => void
  className?: string
}

function labelClass(checked: boolean) {
  return `flex cursor-pointer items-start gap-3 rounded-lg border px-4 py-3 text-sm leading-snug transition ${
    checked
      ? 'border-cosmic-gold/50 bg-cosmic-gold/10 text-cosmic-gold'
      : 'border-white/15 bg-black/20 text-cosmic-silver hover:border-cosmic-gold/30'
  }`
}

export default function CheckoutConsentCheckboxes({
  acceptTerms,
  onAcceptTermsChange,
  className = '',
}: Props) {
  return (
    <div className={`space-y-3 ${className}`} role="group" aria-label="Confirmation avant paiement">
      <label className={labelClass(acceptTerms)}>
        <input
          type="checkbox"
          checked={acceptTerms}
          onChange={(e) => onAcceptTermsChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-cosmic-gold/40 text-cosmic-gold focus:ring-cosmic-gold"
        />
        <span>
          J&apos;accepte les{' '}
          <Link href="/terms" className="text-cosmic-gold underline underline-offset-2 hover:text-cosmic-gold/80">
            termes et conditions
          </Link>{' '}
          et la{' '}
          <Link href="/privacy" className="text-cosmic-gold underline underline-offset-2 hover:text-cosmic-gold/80">
            politique de confidentialité
          </Link>
          .
        </span>
      </label>
    </div>
  )
}
