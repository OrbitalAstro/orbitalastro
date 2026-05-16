'use client'

import Link from 'next/link'

export type CheckoutConsentValues = {
  acceptTerms: boolean
  confirmBirthData: boolean
}

type Props = CheckoutConsentValues & {
  onAcceptTermsChange: (value: boolean) => void
  onConfirmBirthDataChange: (value: boolean) => void
  birthDateLabel?: string | null
  birthTimeLabel?: string | null
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
  confirmBirthData,
  onAcceptTermsChange,
  onConfirmBirthDataChange,
  birthDateLabel,
  birthTimeLabel,
  className = '',
}: Props) {
  const showBirthSummary = birthDateLabel || birthTimeLabel

  return (
    <div className={`space-y-3 ${className}`} role="group" aria-label="Confirmations avant paiement">
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

      <label className={labelClass(confirmBirthData)}>
        <input
          type="checkbox"
          checked={confirmBirthData}
          onChange={(e) => onConfirmBirthDataChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-cosmic-gold/40 text-cosmic-gold focus:ring-cosmic-gold"
        />
        <span>
          Je confirme disposer de ma <strong className="font-semibold text-white">date</strong> et de mon{' '}
          <strong className="font-semibold text-white">heure de naissance exactes</strong>, nécessaires au calcul
          astrologique de mon profil et des services commandés.
        </span>
      </label>

      {showBirthSummary ? (
        <p className="text-xs text-cosmic-silver/90 pl-1">
          Profil enregistré :{' '}
          {birthDateLabel ? <span>date {birthDateLabel}</span> : null}
          {birthDateLabel && birthTimeLabel ? ' · ' : null}
          {birthTimeLabel ? <span>heure {birthTimeLabel}</span> : null}
          . Vérifie que ces informations sont correctes avant de payer.
        </p>
      ) : null}
    </div>
  )
}
