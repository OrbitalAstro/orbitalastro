'use client'

import { glyphForJournalSpeaker, glyphKeyForJournalSpeaker } from '@/lib/journal-speaker-symbols'

type Props = { speaker: string }

const SVG_SIZE = '1.35rem'

/** Mars / Vénus : glyphes « genre » Unicode — proportions différentes des symboles astro (☉, ☽…). */
function JournalSpeakerGlyphSvg({ glyphKey }: { glyphKey: 'mars' | 'venus' }) {
  const common = {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    width: SVG_SIZE,
    height: SVG_SIZE,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.75,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: 'journal-speaker-glyph__svg',
    'aria-hidden': true,
  }

  if (glyphKey === 'mars') {
    return (
      <svg {...common}>
        <circle cx="10" cy="15" r="5" />
        <path d="M14 11l5-5M19 5h-4M19 5v4" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <circle cx="12" cy="9" r="5" />
      <path d="M12 14v7M9 18h6" />
    </svg>
  )
}

export default function JournalSpeakerGlyph({ speaker }: Props) {
  const glyphKey = glyphKeyForJournalSpeaker(speaker)
  const glyph = glyphForJournalSpeaker(speaker)
  if (!glyph) return null

  if (glyphKey === 'mars' || glyphKey === 'venus') {
    return (
      <span className="journal-speaker-glyph journal-speaker-glyph--svg" data-glyph={glyphKey} aria-hidden>
        <JournalSpeakerGlyphSvg glyphKey={glyphKey} />
      </span>
    )
  }

  return (
    <span className="journal-speaker-glyph journal-speaker-glyph--text" data-glyph={glyphKey || undefined} aria-hidden>
      {glyph}
    </span>
  )
}
