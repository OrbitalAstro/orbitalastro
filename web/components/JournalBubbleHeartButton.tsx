'use client'

import { Heart } from 'lucide-react'

type Props = {
  active?: boolean
  disabled?: boolean
  onClick: () => void
}

export default function JournalBubbleHeartButton({ active, disabled, onClick }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`journal-bubble-heart ${active ? 'journal-bubble-heart--active' : ''}`.trim()}
      aria-label={
        active
          ? 'Tu as marqué ce passage comme touchant'
          : 'Marquer ce passage — ça m’a touchée'
      }
      aria-pressed={active}
      title={active ? 'Tu as dit que ça t’a touchée' : 'Ce passage m’a touchée'}
    >
      <Heart
        className="journal-bubble-heart__icon"
        strokeWidth={1.75}
        fill={active ? 'currentColor' : 'none'}
        aria-hidden
      />
      <span className="journal-bubble-heart__label">Touchée</span>
    </button>
  )
}
