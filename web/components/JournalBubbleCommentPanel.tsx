'use client'

import { useId, useState } from 'react'
import { MessageSquarePlus } from 'lucide-react'
import { JOURNAL_BUBBLE_COMMENT_LABEL } from '@/lib/journal-bubble-comment'

type ToggleProps = {
  disabled?: boolean
  submitted?: boolean
  open?: boolean
  onToggle?: () => void
}

export function JournalBubbleCommentToggle({
  disabled,
  submitted,
  open,
  onToggle,
}: ToggleProps) {
  return (
    <button
      type="button"
      disabled={disabled || submitted}
      onClick={onToggle}
      className={`journal-bubble-comment__toggle ${submitted ? 'journal-bubble-comment__toggle--done' : ''}`.trim()}
      aria-expanded={open}
    >
      <MessageSquarePlus className="journal-bubble-comment__icon" aria-hidden />
      <span>{submitted ? 'Commentaire envoyé' : JOURNAL_BUBBLE_COMMENT_LABEL}</span>
    </button>
  )
}

type FormProps = {
  open: boolean
  disabled?: boolean
  submitted?: boolean
  onSubmit: (comment: string) => void | Promise<void>
  onClose?: () => void
}

export function JournalBubbleCommentForm({
  open,
  disabled,
  submitted,
  onSubmit,
  onClose,
}: FormProps) {
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const textareaId = useId()

  if (!open || submitted) return null

  async function handleSubmit() {
    const text = draft.trim()
    if (!text || disabled || submitted || saving) return
    setSaving(true)
    try {
      await onSubmit(text)
      setDraft('')
      onClose?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="journal-bubble-comment__form">
      <label htmlFor={textareaId} className="sr-only">
        Commentaire pour nourrir cette intervention
      </label>
      <textarea
        id={textareaId}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        maxLength={2000}
        disabled={disabled || saving}
        placeholder="Précise, corrige ou ajoute du contexte — la guilde s’en servira pour la suite…"
        className="journal-bubble-comment__input"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled || saving || !draft.trim()}
          onClick={() => void handleSubmit()}
          className="journal-bubble-comment__send"
        >
          {saving ? 'Envoi…' : 'Nourrir la guilde'}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => {
            onClose?.()
            setDraft('')
          }}
          className="journal-bubble-comment__cancel"
        >
          Annuler
        </button>
      </div>
    </div>
  )
}

type Props = {
  disabled?: boolean
  submitted?: boolean
  onSubmit: (comment: string) => void | Promise<void>
}

/** Disposition empilée (toggle puis formulaire) — préférer la barre d’outils unifiée. */
export default function JournalBubbleCommentPanel({ disabled, submitted, onSubmit }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <div className="journal-bubble-comment w-full">
      <JournalBubbleCommentToggle
        disabled={disabled}
        submitted={submitted}
        open={open}
        onToggle={() => setOpen((v) => !v)}
      />
      <JournalBubbleCommentForm
        open={open}
        disabled={disabled}
        submitted={submitted}
        onSubmit={onSubmit}
        onClose={() => setOpen(false)}
      />
    </div>
  )
}
