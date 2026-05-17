'use client'

import { JOURNAL_SUGGESTION_PILL_CLASS } from '@/lib/journal-chat-suggestions'

type Props = {
  label: string
  disabled?: boolean
  onClick: () => void
}

export default function JournalBubblePillButton({ label, disabled, onClick }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={JOURNAL_SUGGESTION_PILL_CLASS}
      aria-label={`${label} — cette intervention`}
    >
      {label}
    </button>
  )
}
