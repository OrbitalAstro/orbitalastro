'use client'

import { useId } from 'react'

type TailSide = 'left' | 'right' | 'center'

type Props = {
  side: TailSide
}

/**
 * Queue de bulle en courbes (SVG), plus douce qu’un triangle CSS.
 */
export default function JournalBubbleTailSvg({ side }: Props) {
  const uid = useId().replace(/:/g, '')
  const gid = `journal-tail-grad-${uid}`

  if (side === 'center') {
    return (
      <svg
        className="journal-bubble-tail-svg journal-bubble-tail-svg--center"
        viewBox="0 0 56 36"
        aria-hidden
      >
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="rgba(255, 248, 245, 0.45)" />
            <stop offset="50%" stopColor="rgba(228, 181, 160, 0.3)" />
            <stop offset="100%" stopColor="rgba(100, 80, 150, 0.2)" />
          </linearGradient>
        </defs>
      <path
        fill={`url(#${gid})`}
        d="M28 1.5 C34 1.5 40.5 5.5 44.5 11.5 C46.5 15.5 47.5 21 46.5 27.5 C42.5 25.5 36 22.5 28 20.5 C20 22.5 13.5 25.5 9.5 27.5 C8.5 21 9.5 15.5 11.5 11.5 C15.5 5.5 22 1.5 28 1.5 Z"
      />
      </svg>
    )
  }

  const isRight = side === 'right'

  return (
    <svg
      className={`journal-bubble-tail-svg journal-bubble-tail-svg--guild ${isRight ? 'journal-bubble-tail-svg--right' : 'journal-bubble-tail-svg--left'}`.trim()}
      viewBox="0 0 52 42"
      aria-hidden
    >
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(255, 252, 255, 0.4)" />
          <stop offset="40%" stopColor="rgba(200, 185, 240, 0.24)" />
          <stop offset="100%" stopColor="rgba(120, 100, 180, 0.18)" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gid})`}
        d="M7 3 C20 0.5 38 6 45.5 15.5 C43.5 23.5 34 32 23 38.5 C15 40.5 8 39.5 5.5 33.5 C4 24 4.5 14 7 3 Z"
      />
    </svg>
  )
}
