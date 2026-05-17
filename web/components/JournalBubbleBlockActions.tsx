'use client'

import JournalBubbleHeartButton from '@/components/JournalBubbleHeartButton'
import JournalBubblePillButton from '@/components/JournalBubblePillButton'
import { JOURNAL_CONCRETE_PATH_LABEL, JOURNAL_DEEPEN_LABEL } from '@/lib/journal-chat-suggestions'

type Props = {
  align?: 'left' | 'right' | 'center'
  disabled?: boolean
  touched?: boolean
  onTouched?: () => void
  onDeepen: () => void
  onConcretePath: () => void
}

export default function JournalBubbleBlockActions({
  align = 'left',
  disabled,
  touched,
  onTouched,
  onDeepen,
  onConcretePath,
}: Props) {
  const justify =
    align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'
  return (
    <div className={`journal-thread__block-actions flex w-full flex-wrap items-center gap-2 ${justify}`}>
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
  )
}
