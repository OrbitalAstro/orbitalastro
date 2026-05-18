/**
 * Aération du texte guilde (surtout Astrologie) — paragraphes courts, respiration visuelle.
 */

const SECTION_LINE = /^\d+\.\s+.+$/m

/** Insère des sauts de paragraphe pour une lecture type messagerie aérée. */
export function aerateJournalGuildBody(body: string, roleLabel: string): string {
  const isAstrologie = /^astrologie\s*$/i.test(roleLabel.trim())
  if (!body.trim()) return body
  if (!isAstrologie) return normalizeParagraphBreaks(body)

  let t = body.replace(/\r\n/g, '\n').trim()

  // Ligne vide avant chaque section numérotée
  t = t.replace(/([^\n])\n(\d+\.\s+)/g, '$1\n\n$2')
  t = t.replace(/([^\n])(\d+\.\s+)/g, '$1\n\n$2')

  // Ligne vide après un titre de section (ligne se terminant par :)
  t = t.replace(/^(\d+\.\s+[^\n]+:)\s*\n(?!\n)/gm, '$1\n\n')

  t = normalizeParagraphBreaks(t)

  // Pavé sans aucun double saut : couper tous les 2 phrases
  if (!/\n\n/.test(t) && t.length > 280) {
    t = splitEveryNSentences(t, 2)
  } else if (t.length > 520) {
    // Paragraphes encore trop longs
    t = t
      .split(/\n\n+/)
      .map((block) => (block.length > 380 ? splitEveryNSentences(block, 2) : block))
      .join('\n\n')
  }

  return t.trim()
}

function normalizeParagraphBreaks(text: string): string {
  return text
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

function splitEveryNSentences(text: string, n: number): string {
  const parts = text
    .split(/(?<=[.!?…])\s+/u)
    .map((s) => s.trim())
    .filter(Boolean)
  if (parts.length <= n) return text

  const paras: string[] = []
  for (let i = 0; i < parts.length; i += n) {
    paras.push(parts.slice(i, i + n).join(' '))
  }
  return paras.join('\n\n')
}

export function journalGuildAerationBlock(): string {
  return `
**AÉRATION (bulle Astrologie — lecture type messagerie, comme ChatGPT)**
- **Ligne vide** entre chaque paragraphe : tape **deux retours à la ligne** (\\n\\n) — indispensable pour l’affichage.
- Paragraphes **courts** : **1 à 2 phrases** maximum chacun ; **jamais** un seul pavé de 4+ phrases.
- Chaque section numérotée sur **sa propre ligne**, avec **ligne vide avant et après** :
  (ligne vide)
  1. Tensions du moment :
  (ligne vide)
  (paragraphe court)
  (ligne vide)
- Phrases **courtes** et directes ; une idée principale par paragraphe.
- Accroche initiale : **1 à 2 phrases** puis **ligne vide** avant la section 1.
`
}

export function journalGuildAerationUserHint(): string {
  return `**Texte aéré (Astrologie)** : paragraphes courts séparés par une **ligne vide** ; sections 1. / 2. / 3. isolées — style lecture ChatGPT, pas un bloc compact.`
}

export function isJournalGuildSectionLine(line: string): boolean {
  return SECTION_LINE.test(line.trim())
}
