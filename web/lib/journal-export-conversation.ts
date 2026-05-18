/**
 * Export du fil journal pilote — Markdown (analyse / répétitions) et HTML (Word).
 */

import { parseJournalGuildReply } from '@/lib/journal-chat-parse'
import { isJournalBubbleCommentMessage } from '@/lib/journal-bubble-comment'
import { isJournalTouchedReactionMessage } from '@/lib/journal-touched-reaction'

export type JournalExportMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export type JournalExportOptions = {
  title?: string
  profileName?: string | null
  includeRepetitionReport?: boolean
}

function formatTimestamp(iso: string): string {
  try {
    return new Date(iso).toLocaleString('fr-CA')
  } catch {
    return iso
  }
}

export function journalExportFilename(extension: 'md' | 'html'): string {
  const d = new Date()
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}-${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}`
  return `journal-pilote-${stamp}.${extension}`
}

function userMessageLabel(content: string): string {
  if (isJournalBubbleCommentMessage(content)) return 'Commentaire (nourrir la guilde)'
  if (isJournalTouchedReactionMessage(content)) return 'Réaction touchée'
  return 'Message'
}

function collectAssistantPlainTexts(messages: JournalExportMessage[]): string[] {
  const out: string[] = []
  for (const m of messages) {
    if (m.role !== 'assistant') continue
    for (const bubble of parseJournalGuildReply(m.content)) {
      const block = `${bubble.speaker}\n${bubble.body}`.trim()
      if (block) out.push(block)
    }
  }
  return out
}

/** Phrases / segments répétés (heuristique légère pour repérage manuel). */
export function findLikelyRepeatedSegments(
  texts: string[],
  options?: { minChars?: number; minCount?: number },
): Array<{ text: string; count: number }> {
  const minChars = options?.minChars ?? 42
  const minCount = options?.minCount ?? 2
  const counts = new Map<string, number>()

  const add = (raw: string) => {
    const t = raw.replace(/\s+/g, ' ').trim()
    if (t.length < minChars) return
    const key = t.toLowerCase()
    counts.set(key, (counts.get(key) || 0) + 1)
  }

  for (const text of texts) {
    const normalized = text.replace(/\s+/g, ' ').trim()
    const sentences = normalized.split(/(?<=[.!?…])\s+|\n+/u)
    for (const s of sentences) add(s)

    const words = normalized.toLowerCase().split(/\s+/).filter(Boolean)
    for (let n = 6; n <= 10; n++) {
      for (let i = 0; i <= words.length - n; i++) {
        add(words.slice(i, i + n).join(' '))
      }
    }
  }

  return [...counts.entries()]
    .filter(([, c]) => c >= minCount)
    .map(([text, count]) => ({ text, count }))
    .sort((a, b) => b.count - a.count || b.text.length - a.text.length)
    .slice(0, 35)
}

function repetitionReportMarkdown(messages: JournalExportMessage[]): string {
  const segments = findLikelyRepeatedSegments(collectAssistantPlainTexts(messages))
  if (segments.length === 0) {
    return `## Répétitions possibles (repère automatique)

_Aucun segment long répété détecté dans les réponses de la guilde — vérifie quand même à la lecture._

`
  }
  const lines = segments.map(
    (s) => `- **${s.count}×** « ${s.text.length > 120 ? `${s.text.slice(0, 120)}…` : s.text} »`,
  )
  return `## Répétitions possibles (repère automatique)

Segments ou phrases qui reviennent **plus d’une fois** dans les bulles guilde — à valider de ton côté (faux positifs possibles).

${lines.join('\n')}

---

`
}

export function formatJournalConversationMarkdown(
  messages: JournalExportMessage[],
  options?: JournalExportOptions,
): string {
  const title = options?.title || 'Journal pilote — conversation'
  const who = options?.profileName?.trim() || 'Utilisateur'
  const lines: string[] = [
    `# ${title}`,
    '',
    `- **Exporté le :** ${formatTimestamp(new Date().toISOString())}`,
    `- **Personne :** ${who}`,
    `- **Messages :** ${messages.length}`,
    '',
    `_Format conseillé pour repérer les répétitions : recherche (Ctrl+F) dans ce fichier, ou compare deux exports._`,
    '',
    '---',
    '',
  ]

  if (options?.includeRepetitionReport !== false) {
    lines.push(repetitionReportMarkdown(messages))
  }

  for (const m of messages) {
    const when = formatTimestamp(m.created_at)
    if (m.role === 'user') {
      lines.push(`## Toi · ${when}`, '', `_${userMessageLabel(m.content)}_`, '', m.content.trim(), '', '---', '')
      continue
    }

    lines.push(`## Guilde · ${when}`, '')
    const bubbles = parseJournalGuildReply(m.content)
    if (bubbles.length === 0) {
      lines.push(m.content.trim(), '', '---', '')
      continue
    }
    for (const b of bubbles) {
      lines.push(`### ${b.speaker}`, '', b.body.trim(), '')
    }
    lines.push('---', '')
  }

  return lines.join('\n').trimEnd() + '\n'
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function formatJournalConversationHtml(
  messages: JournalExportMessage[],
  options?: JournalExportOptions,
): string {
  const title = escapeHtml(options?.title || 'Journal pilote — conversation')
  const who = escapeHtml(options?.profileName?.trim() || 'Utilisateur')
  const exported = escapeHtml(formatTimestamp(new Date().toISOString()))

  const bodyParts: string[] = []
  for (const m of messages) {
    const when = escapeHtml(formatTimestamp(m.created_at))
    if (m.role === 'user') {
      bodyParts.push(
        `<h2>Toi · ${when}</h2><p><em>${escapeHtml(userMessageLabel(m.content))}</em></p><p>${escapeHtml(m.content).replace(/\n/g, '<br/>')}</p><hr/>`,
      )
      continue
    }
    bodyParts.push(`<h2>Guilde · ${when}</h2>`)
    for (const b of parseJournalGuildReply(m.content)) {
      bodyParts.push(
        `<h3>${escapeHtml(b.speaker)}</h3><p>${escapeHtml(b.body).replace(/\n/g, '<br/>')}</p>`,
      )
    }
    bodyParts.push('<hr/>')
  }

  let repetitionHtml = ''
  if (options?.includeRepetitionReport !== false) {
    const segments = findLikelyRepeatedSegments(collectAssistantPlainTexts(messages))
    if (segments.length > 0) {
      repetitionHtml = `<h2>Répétitions possibles</h2><ul>${segments
        .map(
          (s) =>
            `<li><strong>${s.count}×</strong> ${escapeHtml(s.text.length > 140 ? `${s.text.slice(0, 140)}…` : s.text)}</li>`,
        )
        .join('')}</ul><hr/>`
    }
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>${title}</title>
<style>
  body { font-family: Georgia, 'Times New Roman', serif; max-width: 42rem; margin: 2rem auto; line-height: 1.55; color: #1a1020; }
  h1 { font-size: 1.5rem; }
  h2 { font-size: 1.15rem; margin-top: 1.5rem; color: #4a2d5c; }
  h3 { font-size: 1rem; margin-top: 1rem; color: #5c3d6e; }
  hr { border: none; border-top: 1px solid #ccc; margin: 1.25rem 0; }
  .meta { font-size: 0.9rem; color: #555; }
</style>
</head>
<body>
<h1>${title}</h1>
<p class="meta">Exporté le ${exported} · ${who}</p>
${repetitionHtml}
${bodyParts.join('\n')}
</body>
</html>`
}

export function downloadJournalExportFile(
  filename: string,
  content: string,
  mimeType: string,
): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
