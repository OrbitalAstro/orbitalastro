'use client'

import type { ReactNode } from 'react'
import { journalBubbleKindFromSpeaker, journalGuildBubbleFillIndex } from '@/lib/journal-bubble-personality'

type Props = {
  speaker: string
  colorIdx: number
  className?: string
  compact?: boolean
  children: ReactNode
}

export default function JournalGuildSpeechBubble({
  speaker,
  colorIdx,
  className = '',
  compact = false,
  children,
}: Props) {
  const kind = journalBubbleKindFromSpeaker(speaker)
  const fill = journalGuildBubbleFillIndex(colorIdx)

  return (
    <div
      className={`journal-guild-bubble ${compact ? 'journal-guild-bubble--compact' : ''} ${className}`.trim()}
      data-kind={kind}
      data-fill={fill}
    >
      <div className="journal-guild-bubble__frame">{children}</div>
    </div>
  )
}
