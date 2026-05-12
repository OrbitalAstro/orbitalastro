'use client'

import type { ReactNode } from 'react'
import JournalBubbleTailSvg from '@/components/JournalBubbleTailSvg'
import { journalBubbleKindFromSpeaker, journalGuildBubbleFillIndex } from '@/lib/journal-bubble-personality'

type BubbleTail = 'left' | 'right'

type Props = {
  speaker: string
  tail: BubbleTail
  colorIdx: number
  className?: string
  compact?: boolean
  children: ReactNode
}

export default function JournalGuildSpeechBubble({
  speaker,
  tail,
  colorIdx,
  className = '',
  compact = false,
  children,
}: Props) {
  const kind = journalBubbleKindFromSpeaker(speaker)
  const fill = journalGuildBubbleFillIndex(colorIdx)
  const dream = kind === 'dream'

  return (
    <div
      className={`journal-guild-bubble ${compact ? 'journal-guild-bubble--compact' : ''} ${className}`.trim()}
      data-kind={kind}
      data-tail={tail}
      data-fill={fill}
    >
      {dream ? (
        <>
          <span className="journal-guild-bubble__thought journal-guild-bubble__thought--a" aria-hidden />
          <span className="journal-guild-bubble__thought journal-guild-bubble__thought--b" aria-hidden />
        </>
      ) : null}
      <JournalBubbleTailSvg side={tail} />
      <div className="journal-guild-bubble__frame">{children}</div>
    </div>
  )
}
