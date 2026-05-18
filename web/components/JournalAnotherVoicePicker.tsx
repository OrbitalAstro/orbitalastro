'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import JournalSpeakerGlyph from '@/components/JournalSpeakerGlyph'
import { JOURNAL_GUILD_VOICE_MEMBERS } from '@/lib/journal-guild-members'
import { JOURNAL_SUGGESTION_PILL_CLASS } from '@/lib/journal-chat-suggestions'

type Props = {
  open: boolean
  onClose: () => void
  onSelect: (roleLabel: string) => void
  disabled?: boolean
}

export default function JournalAnotherVoicePicker({ open, onClose, onSelect, disabled }: Props) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={panelRef}
      className="journal-voice-picker mt-2 rounded-xl border border-cosmic-gold/35 bg-cosmic-purple/50 p-3 backdrop-blur-sm"
      role="dialog"
      aria-label="Choisir une voix de la guilde"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-cosmic-gold/85">Choisis un membre de la guilde</p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-cosmic-gold/70 hover:bg-cosmic-gold/10 hover:text-cosmic-gold"
          aria-label="Fermer"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="journal-voice-picker__grid max-h-[min(240px,40vh)] overflow-y-auto pr-0.5">
        {JOURNAL_GUILD_VOICE_MEMBERS.map((member) => (
          <button
            key={member.id}
            type="button"
            disabled={disabled}
            className="journal-voice-picker__item"
            onClick={() => {
              onSelect(member.label)
              onClose()
            }}
          >
            <JournalSpeakerGlyph speaker={member.label} />
            <span>{member.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

/** Bouton pastille « Autre voix » (ouvre le menu). */
export function JournalAnotherVoicePill({
  active,
  disabled,
  onToggle,
}: {
  active: boolean
  disabled?: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      aria-expanded={active}
      aria-haspopup="dialog"
      className={`${JOURNAL_SUGGESTION_PILL_CLASS} text-left${active ? ' border-cosmic-gold/70 bg-cosmic-gold/15' : ''}`}
    >
      Autre voix
    </button>
  )
}
