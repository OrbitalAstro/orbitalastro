'use client'

import JournalSpeakerGlyph from '@/components/JournalSpeakerGlyph'
import { parseJournalGuildSpeakerLabel } from '@/lib/journal-guild-placement-labels'

type Props = {
  speaker: string
}

export default function JournalGuildBubbleSpeaker({ speaker }: Props) {
  const { displayName, placementCaption } = parseJournalGuildSpeakerLabel(speaker)

  return (
    <p className="journal-guild-bubble__speaker">
      <JournalSpeakerGlyph speaker={displayName} />
      <span className="journal-guild-bubble__speaker-name">{displayName}</span>
      {placementCaption ? (
        <>
          <span className="journal-guild-bubble__speaker-sep" aria-hidden>
            ·
          </span>
          <span className="journal-guild-bubble__placement" title={placementCaption}>
            {placementCaption}
          </span>
        </>
      ) : null}
    </p>
  )
}
