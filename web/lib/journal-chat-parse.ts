/**
 * Découpe les réponses guilde « Rôle : texte » où le rôle peut contenir des « : »
 * (ex. Lune (Natal: Balance, maison 5 + Transit: Scorpion, maison 11): …).
 */

const ROLE_LINE_START =
  /^(Astrologie|Lune|Soleil|Mercure|Vénus|Venus|Mars|Jupiter|Saturne|Uranus|Neptune|Pluton)\s*/i

/** Retourne { role, body } si la ligne commence par un rôle guilde reconnu, sinon null. */
export function splitJournalGuildRoleLine(line: string): { role: string; body: string } | null {
  const rm = line.match(ROLE_LINE_START)
  if (!rm) return null
  let pos = rm[0].length
  if (pos < line.length && line[pos] === '(') {
    let depth = 0
    for (; pos < line.length; pos++) {
      const c = line[pos]
      if (c === '(') depth++
      else if (c === ')') {
        depth--
        if (depth === 0) {
          pos++
          break
        }
      }
    }
    if (depth !== 0) return null
    const tail = line.slice(pos).trimStart()
    if (!tail.startsWith(':')) return null
    return { role: line.slice(0, pos).trim(), body: tail.slice(1).trimStart() }
  }
  const tail = line.slice(pos).trimStart()
  if (!tail.startsWith(':')) return null
  return { role: rm[0].trim(), body: tail.slice(1).trimStart() }
}

const LEGACY_SPEAKER_LINE =
  /^([A-Za-zÀ-ÿ][A-Za-zÀ-ÿéèêëàâôûùç'’\s]{1,80})\s*:\s*(.*)$/

/** Bulles « intervenant : corps » pour l’affichage fil journal. */
export function parseJournalGuildReply(reply: string): { speaker: string; body: string }[] {
  const trimmed = reply.trim()
  if (!trimmed) return []

  const messages: { speaker: string; body: string }[] = []
  let current: { speaker: string; lines: string[] } | null = null

  for (const line of trimmed.split('\n')) {
    const guild = splitJournalGuildRoleLine(line)
    const legacy = guild ? null : line.match(LEGACY_SPEAKER_LINE)
    const m = guild || (legacy ? { role: legacy[1].trim(), body: legacy[2] ?? '' } : null)

    if (m) {
      if (current) {
        messages.push({ speaker: current.speaker, body: current.lines.join('\n').trim() })
      }
      current = { speaker: m.role, lines: m.body ? [m.body] : [] }
    } else if (current) {
      current.lines.push(line)
    }
  }
  if (current) {
    messages.push({ speaker: current.speaker, body: current.lines.join('\n').trim() })
  }

  const normalized =
    messages.length === 0 ? [{ speaker: 'Guilde', body: trimmed }] : messages.filter((msg) => msg.body.length > 0)

  return normalized.reduce<{ speaker: string; body: string }[]>((acc, cur) => {
    const prev = acc[acc.length - 1]
    if (prev && prev.speaker === cur.speaker) {
      prev.body = `${prev.body}\n\n${cur.body}`.trim()
      return acc
    }
    acc.push({ ...cur })
    return acc
  }, [])
}
