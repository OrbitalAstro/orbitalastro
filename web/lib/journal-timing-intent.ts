/**
 * Détecte si le message justifie l’appel au calcul lourd « prochains passages à orbe minimale ».
 * Heuristique simple (pas d’appel LLM) — à affiner si besoin.
 */
export function journalMessageWantsNextExactDates(message: string): boolean {
  const t = message.trim().toLowerCase()
  if (t.length < 3) return false

  const timing =
    /\b(quand|date|jour|mois|année|prochain|prochaine|prochains|bientôt|passage|exact|orbe|timing|calendrier|échéance|échéances|énergie|energie|pic)\b/.test(
      t,
    )
  const astro =
    /\b(transit|transits|aspect|aspects|rétrograde|rétrograd|conjonction|carré|trigone|opposition|sextile)\b/.test(
      t,
    )
  const bodies =
    /\b(saturne|jupiter|uranus|neptune|pluton|mars|vénus|mercure|soleil|lune|chiron)\b/.test(t)

  return timing || astro || bodies
}
