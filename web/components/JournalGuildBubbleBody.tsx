'use client'

import { aerateJournalGuildBody, isJournalGuildSectionLine } from '@/lib/journal-guild-aeration'

type Props = {
  speaker: string
  body: string
}

export default function JournalGuildBubbleBody({ speaker, body }: Props) {
  const formatted = aerateJournalGuildBody(body, speaker)
  const isAstrologie = /^astrologie\s*$/i.test(speaker.trim())
  const blocks = formatted.split(/\n\n+/).map((b) => b.trim()).filter(Boolean)

  if (blocks.length <= 1) {
    return (
      <p
        className={`journal-guild-bubble__body${isAstrologie ? ' journal-guild-bubble__body--aerated' : ''}`}
      >
        {formatted}
      </p>
    )
  }

  return (
    <div
      className={`journal-guild-bubble__body journal-guild-bubble__body--stacked${
        isAstrologie ? ' journal-guild-bubble__body--aerated' : ''
      }`}
    >
      {blocks.map((block, i) => {
        const lines = block.split('\n').filter((l) => l.trim())
        const first = lines[0] ?? block
        const isSection = isJournalGuildSectionLine(first) && lines.length === 1
        const isSectionWithBody = isJournalGuildSectionLine(first) && lines.length > 1

        if (isSection) {
          return (
            <p key={i} className="journal-guild-bubble__section-title">
              {first}
            </p>
          )
        }

        if (isSectionWithBody) {
          return (
            <div key={i} className="journal-guild-bubble__section">
              <p className="journal-guild-bubble__section-title">{first}</p>
              <p className="journal-guild-bubble__para">{lines.slice(1).join('\n')}</p>
            </div>
          )
        }

        return (
          <p key={i} className="journal-guild-bubble__para">
            {block}
          </p>
        )
      })}
    </div>
  )
}
