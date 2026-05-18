/**
 * Étiquettes de bulle : nom de la voix + rappel Natal / Transit (affichage fil).
 */

import { stripJournalGuildMarkdown } from '@/lib/journal-guild-reply-sanitize'

const PLACEMENT_SUFFIX =
  /^\s*(.+?)\s*\(\s*Natal:\s*([^+)]+?)\s*\+\s*Transit:\s*([^)]+?)\s*\)\s*$/is

/** Découpe « Lune (Natal: Balance, maison 5 + Transit: Bélier, maison 5) » pour l’UI. */
export function parseJournalGuildSpeakerLabel(speaker: string): {
  displayName: string
  placementCaption: string | null
} {
  const raw = speaker.trim()
  if (!raw) return { displayName: '', placementCaption: null }

  const m = raw.match(PLACEMENT_SUFFIX)
  if (m) {
    const natal = stripJournalGuildMarkdown(m[2].trim())
    const transit = stripJournalGuildMarkdown(m[3].trim())
    return {
      displayName: stripJournalGuildMarkdown(m[1].trim()),
      placementCaption: `Natal : ${natal} · Transit : ${transit}`,
    }
  }

  const loose = raw.match(/^(.+?)\s*\((.+)\)\s*$/s)
  if (loose && /natal/i.test(loose[2]) && /transit/i.test(loose[2])) {
    return {
      displayName: stripJournalGuildMarkdown(loose[1].trim()),
      placementCaption: stripJournalGuildMarkdown(loose[2].trim()),
    }
  }

  return { displayName: raw, placementCaption: null }
}

export function journalGuildPlacementLabelsBlock(): string {
  return `
**ÉTIQUETTES DE BULLE (planètes et points — obligatoire pour chaque voix sauf Astrologie)**
Chaque voix planète / point utilise **une ligne d’étiquette** avec le **placement natal et transit** tirés du bloc astro (données réelles seulement) :

Format exact :
\`Lune (Natal: Balance, maison 5 + Transit: Bélier, maison 5):\`
\`Saturne (Natal: Capricorne, maison 8 + Transit: Bélier, maison 5):\`

- **Natal:** signe en français + maison natale quand le bloc la donne.
- **Transit:** signe (et maison transit) à la date de référence — corps impliqués dans les aspects listés.
- **Astrologie:** étiquette simple \`Astrologie:\` sans parenthèses (la lecture détaillée est dans le corps).
- Le **corps** de la bulle = effets en **je**, sans re-coller toute la ligne d’étiquette mot pour mot.
`
}

export function journalGuildPlacementLabelsUserHint(): string {
  return `**Étiquettes planètes** : \`Nom (Natal: signe, maison X + Transit: signe, maison Y):\` sur chaque voix planète — données du bloc ; Astrologie reste \`Astrologie:\` seule.`
}
