/**
 * Fenêtre courte (~1 semaine) : plus de voix planètes pour soutenir le dialogue.
 */

const WEEK_MESSAGE =
  /\b(transits? de la semaine|transits? de cette semaine|cette semaine|la semaine|fenêtre d'une semaine|7 jours|sept jours|semaine en cours)\b/i

const WEEK_TRANSITS_NOW =
  /\b(quels transits|transits? (?:me )?touchent|transits? (?:du|de ce) moment|en ce moment)\b/i

const LONG_HORIZON =
  /\b(prochaines semaines|deux à quatre semaines|2 à 4 semaines|plusieurs mois|dans les mois)\b/i

const MS_PER_DAY = 86_400_000

/** Transit court (≈ 1 semaine) : élargir le chœur planétaire. */
export function detectJournalWeekTransitHorizon(
  message: string,
  astroTimingBlock: string,
): boolean {
  const t = message.trim()
  if (!t) return false

  if (LONG_HORIZON.test(t)) return false

  if (WEEK_MESSAGE.test(t)) return true
  if (WEEK_TRANSITS_NOW.test(t) && !LONG_HORIZON.test(t)) return true

  const applyingCount = (astroTimingBlock.match(/en approche/gi) || []).length
  if (applyingCount >= 2) return true

  const refIso = astroTimingBlock.match(/ISO \(UTC\)\s*:\s*(\S+)/i)?.[1]
  const refDate = refIso ? new Date(refIso) : null
  if (refDate && !Number.isNaN(refDate.getTime())) {
    let withinTenDays = 0
    for (const m of astroTimingBlock.matchAll(/réf\.\s*UTC\s+(\d{4}-\d{2}-\d{2}T[^\s)]+)/gi)) {
      const hit = new Date(m[1])
      if (Number.isNaN(hit.getTime())) continue
      const days = (hit.getTime() - refDate.getTime()) / MS_PER_DAY
      if (days >= 0 && days <= 10) withinTenDays++
    }
    if (withinTenDays >= 2) return true
  }

  const exactNow = (astroTimingBlock.match(/exact maintenant/gi) || []).length
  if (exactNow >= 1 && applyingCount >= 1) return true

  return false
}

export function journalWeekTransitHorizonSystemBlock(): string {
  return `
**FENÊTRE COURTE (~1 SEMAINE — ce tour)**
Priorise dans le **chœur 5–7 voix** les corps **en approche** ou au **pic ≤ ~10 jours** listés dans le bloc — chaque voix reste **1–2 phrases**, effet distinct.
`
}

export function journalWeekTransitHorizonUserHint(): string {
  return `**Fenêtre ~1 semaine** : dans les **5–7 voix** après Astrologie, privilégie les corps en approche / pic proche du bloc.`
}
