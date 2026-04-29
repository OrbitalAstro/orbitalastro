/**
 * Titre d’archive lisible, sans appel LLM : première question + indice tiré de la discussion.
 */

function squish(s: string, max: number): string {
  const t = s.replace(/\s+/g, ' ').trim()
  if (t.length <= max) return t
  return `${t.slice(0, Math.max(0, max - 1)).trimEnd()}…`
}

/** Première ligne utile d’une réponse « guilde » (souvent « Rôle : … »). */
function firstGuildLine(reply: string): string {
  const line = (reply.split(/\r?\n/).find((l) => l.trim().length > 0) || reply).trim()
  return line.replace(/^([A-Za-zÀ-ÿ][^:]{0,48}:\s*)/u, '').trim() || line
}

export function buildArchiveTitleFromMessages(
  messages: Array<{ role: string; content: string }>,
  maxTotal = 96,
): string {
  const users = messages
    .filter((m) => m.role === 'user')
    .map((m) => m.content.trim())
    .filter(Boolean)
  const assistants = messages
    .filter((m) => m.role === 'assistant')
    .map((m) => m.content.trim())
    .filter(Boolean)

  const firstQ = users[0] || ''
  const lastUser = users.length > 1 ? users[users.length - 1] : ''
  const firstReply = assistants[0] || ''

  let title = squish(firstQ, 58)
  if (!title) title = 'Conversation archivée'

  if (users.length >= 2 && lastUser && lastUser !== users[0]) {
    const tail = squish(lastUser, 44)
    if (tail.length > 6) {
      const merged = `${title} · ${tail}`
      title = merged.length <= maxTotal ? merged : squish(merged, maxTotal)
    }
  } else if (firstReply) {
    const hint = squish(firstGuildLine(firstReply), 40)
    if (hint.length > 8) {
      const merged = `${title} — ${hint}`
      title = merged.length <= maxTotal ? merged : squish(merged, maxTotal)
    }
  }

  return squish(title, maxTotal)
}
