'use client'

import { useId } from 'react'

type TailSide = 'left' | 'right' | 'center'

type Props = {
  side: TailSide
}

/**
 * Queue de bulle fluide en courbes de Bézier, effilée vers une pointe.
 */
export default function JournalBubbleTailSvg({ side }: Props) {
  const uid = useId().replace(/:/g, '')
  const gid = `journal-tail-grad-${uid}`

  if (side === 'center') {
    return (
      <svg
        className="journal-bubble-tail-svg journal-bubble-tail-svg--center"
        viewBox="0 0 44 52"
        aria-hidden
      >
        <defs>
          <linearGradient id={gid} x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 248, 245, 0.5)" />
            <stop offset="45%" stopColor="rgba(228, 181, 160, 0.32)" />
            <stop offset="100%" stopColor="rgba(100, 80, 150, 0.22)" />
          </linearGradient>
        </defs>
        <path
          fill={`url(#${gid})`}
          d="M22 0.5
             C29 0.5 35.5 6.5 37 14
             C38.5 22 33.5 32 26 40
             C20 46.5 14 49.5 10 51.5
             C8 49 11 42 15 34
             C18 26 20 14 22 0.5 Z"
        />
      </svg>
    )
  }

  const isRight = side === 'right'

  return (
    <svg
      className={`journal-bubble-tail-svg journal-bubble-tail-svg--guild ${isRight ? 'journal-bubble-tail-svg--right' : 'journal-bubble-tail-svg--left'}`.trim()}
      viewBox="0 0 42 50"
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 252, 255, 0.45)" />
          <stop offset="40%" stopColor="rgba(200, 185, 240, 0.28)" />
          <stop offset="100%" stopColor="rgba(120, 100, 180, 0.2)" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gid})`}
        d="M30 0.5
           C36 0.5 40.5 5.5 41 12
           C41.5 20 36 30 26 38
           C18 44.5 10 48.5 4 49.5
           C2 47 6 38 12 28
           C18 16 24 6 30 0.5 Z"
      />
    </svg>
  )
}
