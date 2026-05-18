/**
 * Commentaire sous une bulle — nourrit le fil et la mémoire sans relancer toute la guilde.
 */

export const JOURNAL_BUBBLE_COMMENT_TAG = '[💬 commentaire bulle]'

export const JOURNAL_BUBBLE_COMMENT_LABEL = 'Commenter'

function roleFromSpeaker(speaker: string): string {
  return speaker.split('(')[0]?.trim() || speaker.trim() || 'cette intervention'
}

export function journalBubbleCommentMessage(
  speaker: string,
  body: string | undefined,
  comment: string,
): string {
  const role = roleFromSpeaker(speaker)
  const excerpt = (body || '').replace(/\s+/g, ' ').trim().slice(0, 100)
  const tail = excerpt.length >= 100 ? '…' : ''
  const note = comment.trim()
  if (excerpt) {
    return `${JOURNAL_BUBBLE_COMMENT_TAG} Commentaire pour nourrir ce que ${role} a dit (« ${excerpt}${tail} ») :\n${note}`
  }
  return `${JOURNAL_BUBBLE_COMMENT_TAG} Commentaire pour nourrir ce que ${role} a dit :\n${note}`
}

export function isJournalBubbleCommentMessage(text: string): boolean {
  return String(text || '').trimStart().startsWith(JOURNAL_BUBBLE_COMMENT_TAG)
}

export function journalBubbleCommentDisplayText(text: string): string {
  const raw = String(text || '').trim()
  if (!isJournalBubbleCommentMessage(raw)) return raw
  const body = raw.slice(JOURNAL_BUBBLE_COMMENT_TAG.length).trim()
  return body ? `💬 ${body}` : '💬 Commentaire pour nourrir la guilde'
}
