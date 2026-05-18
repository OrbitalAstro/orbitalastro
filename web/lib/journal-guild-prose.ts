/**
 * Format prose du fil journal — pas de markdown dans les bulles affichées.
 */

export function journalGuildProseFormatBlock(): string {
  return `
**FORMAT PROSE (bulles guilde — obligatoire)**
- Texte **brut** lisible dans une messagerie : **pas** de \`**gras**\`, \`*italique*\`, ni puces \`*\` en début de ligne — **sauf** la ligne d’étiquette \`Nom (Natal: … + Transit: …):\` qui reste **intacte** (affichée au-dessus de la bulle).
- Sections numérotées en clair si besoin : « 1. Tensions du moment : » puis paragraphes — pas « 1. **Tensions** ».
- Planètes et aspects : en français normal dans la phrase (ex. « Saturne en Bélier forme un trigone à ta Vesta natale en Lion »).
`
}

export function journalGuildProseUserHint(): string {
  return `**Prose simple** : aucun astérisque de mise en forme (** ou *) dans le **corps** des bulles ; garde les **étiquettes** \`(Natal: … + Transit: …)\` sur chaque planète ; pas de listes à puces markdown — paragraphes fluides.`
}
