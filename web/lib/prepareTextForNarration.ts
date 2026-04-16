/**
 * Prépare le texte des lectures pour la synthèse vocale du navigateur.
 * Retire les glyphes que la voix prononce mal ; garde la structure en paragraphes.
 */
export function prepareTextForNarration(raw: string): string {
  if (!raw) return ''
  let t = raw.replace(/\r\n/g, '\n')
  // Symboles planètes / signes (Unicode) — la voix les déforme
  t = t.replace(/[\u2640-\u2642\u26A5\u26A6\u2648-\u2653\u2609\u263F\u263D\u2641\u2643-\u2647]/gu, ' ')
  t = t.replace(/\*{1,3}/g, '')
  t = t.replace(/#{1,6}\s+/g, '')
  t = t.replace(/\n{3,}/g, '\n\n')
  return t.replace(/[ \t]+\n/g, '\n').trim()
}
