/**
 * Ouvertures génériques type assistant — interdites dans les bulles Astrologie.
 */

const BANNED_OPENING_PATTERNS: RegExp[] = [
  /^je comprends que tu\b[^.!?\n]{0,420}[.!?]\s*/iu,
  /^je perçois (?:bien )?ton envie de\b[^.!?\n]{0,520}[.!?]\s*/iu,
  /^je perçois (?:bien )?que tu (?:cherches|souhaites|veux|cherches à)\b[^.!?\n]{0,420}[.!?]\s*/iu,
  /^je perçois (?:bien )?(?:ton |ta )?(?:envie|question)\b[^.!?\n]{0,420}[.!?]\s*/iu,
  /^c'est une (?:excellente|très bonne|belle|superbe) question\b[^.!?\n]*[.!?]\s*/iu,
  /^merci pour (?:cette|ta) question\b[^.!?\n]*[.!?]\s*/iu,
  /^le ciel nous offre (?:toujours )?des pistes\b[^.!?\n]*[.!?]\s*/iu,
  /^c'est une question (?:très )?pertinente\b[^.!?\n]*[.!?]\s*/iu,
  /^tu as raison de (?:te )?demander\b[^.!?\n]*[.!?]\s*/iu,
  /^ton envie de saisir\b[^.!?\n]{0,400}[.!?]\s*/iu,
]

export function journalGuildBannedOpeningsBlock(): string {
  return `
**OUVERTURES INTERDITES (bulle Astrologie — pas requis)**
Ne commence **pas** par des formules génériques type chatbot — **inutiles, ça alourdit pour rien** :
- « Je comprends que tu cherches à… » / « tu souhaites éclaircir… »
- « Je perçois bien ton envie de saisir les énergies… » / « comment elles se manifestent dans ton quotidien »
- « C'est une excellente question » / « très bonne question »
- « Le ciel nous offre toujours des pistes pour mieux nous sentir »
- « Merci pour cette question »

**Interdit** : reformuler sa question en préambule molle avant d’entrer dans le fond.

**À la place** : première phrase = **fait astro ou vécu concret** (tension, soutien, contraste du jour) — pas une méta-commentaire sur sa « envie de saisir ».
`
}

export function journalGuildBannedOpeningsUserHint(): string {
  return `**Pas d'ouverture molle** : interdit reformuler sa question (« je perçois ton envie de saisir… », « excellente question ») — 1re phrase = fond (ciel ou vécu), pas méta.`
}

function capitalizeFirst(s: string): string {
  if (!s) return s
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Retire jusqu'à 3 phrases d'ouverture génériques en tête d'une bulle Astrologie. */
export function stripJournalGuildBannedOpenings(body: string): string {
  let t = body.trim()
  if (!t) return t

  for (let pass = 0; pass < 4; pass++) {
    let changed = false
    for (const re of BANNED_OPENING_PATTERNS) {
      const next = t.replace(re, '')
      if (next !== t) {
        t = next.trim()
        changed = true
      }
    }
    if (!changed) break
  }
  return t.trim() || body.trim()
}

export function detectJournalGuildBannedOpenings(text: string): string[] {
  const issues: string[] = []
  const n = text.toLowerCase()
  if (/je comprends que tu (?:cherches|souhaites|veux)/i.test(text)) {
    issues.push('Ouverture interdite : « je comprends que tu cherches… » — commence par le fond, pas par la reformulation de sa question.')
  }
  if (/excellente question|très bonne question|belle question/i.test(n)) {
    issues.push('Interdit : « excellente question » et variantes — pas de validation générique.')
  }
  if (/le ciel nous offre.*pistes/i.test(n)) {
    issues.push('Interdit : « le ciel nous offre des pistes… » — entre dans la lecture concrète.')
  }
  if (/je perçois (?:bien )?ton envie de saisir/i.test(n)) {
    issues.push(
      'Ouverture interdite : « je perçois ton envie de saisir les énergies… » — entre directement dans le ciel ou le vécu, sans reformuler sa question.',
    )
  }
  if (/énergies qui te traversent|se manifestent dans ton quotidien/i.test(n) && /^je perçois/i.test(text.trim())) {
    issues.push('Interdit : préambule molle sur les énergies / le quotidien — 1re phrase = fait concret.')
  }
  return issues
}
