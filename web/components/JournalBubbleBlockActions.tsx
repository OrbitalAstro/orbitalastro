'use client'

import { useState } from 'react'
import JournalBubbleHeartButton from '@/components/JournalBubbleHeartButton'
import JournalBubblePillButton from '@/components/JournalBubblePillButton'
import {
  JournalBubbleCommentForm,
  JournalBubbleCommentToggle,
} from '@/components/JournalBubbleCommentPanel'
import { JOURNAL_CONCRETE_PATH_LABEL, JOURNAL_DEEPEN_LABEL } from '@/lib/journal-chat-suggestions'

type CommentProps = {
  disabled?: boolean
  submitted?: boolean
  onSubmit: (comment: string) => void | Promise<void>
}

type Props = {
  align?: 'left' | 'right' | 'center'
  disabled?: boolean
  touched?: boolean
  onTouched?: () => void
  onDeepen: () => void
  onConcretePath: () => void
  comment?: CommentProps
}

export default function JournalBubbleBlockActions({
  align = 'left',
  disabled,
  touched,
  onTouched,
  onDeepen,
  onConcretePath,
  comment,
}: Props) {
  const [commentOpen, setCommentOpen] = useState(false)

  const leftJustify =
    align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'

  return (
    <div className="journal-thread__block-toolbar w-full">
      <div className="journal-thread__block-toolbar-row flex w-full items-center gap-2">
        <div
          className={`journal-thread__block-actions flex min-w-0 flex-1 flex-wrap items-center gap-2 ${leftJustify}`}
        >
          {onTouched ? (
            <JournalBubbleHeartButton
              active={touched}
              disabled={disabled || touched}
              onClick={onTouched}
            />
          ) : null}
          <JournalBubblePillButton
            label={JOURNAL_DEEPEN_LABEL}
            disabled={disabled}
            onClick={onDeepen}
          />
          <JournalBubblePillButton
            label={JOURNAL_CONCRETE_PATH_LABEL}
            disabled={disabled}
            onClick={onConcretePath}
          />
        </div>
        {comment ? (
          <div className="journal-thread__block-actions-comment shrink-0">
            <JournalBubbleCommentToggle
              disabled={comment.disabled}
              submitted={comment.submitted}
              open={commentOpen}
              onToggle={() => setCommentOpen((v) => !v)}
            />
          </div>
        ) : null}
      </div>
      {comment ? (
        <JournalBubbleCommentForm
          open={commentOpen}
          disabled={comment.disabled}
          submitted={comment.submitted}
          onSubmit={comment.onSubmit}
          onClose={() => setCommentOpen(false)}
        />
      ) : null}
    </div>
  )
}
