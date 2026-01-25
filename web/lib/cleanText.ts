/**
 * Nettoie le texte en retirant les astérisques et les émoticônes
 */
export function cleanText(text: string): string {
  if (!text) return ''
  
  // Retirer les astérisques (***, **, *, * * *)
  let cleaned = text.replace(/\*{1,3}/g, '').replace(/\*\s*\*\s*\*/g, '')
  
  // Retirer tous les émoticônes courants
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Émoticônes Unicode
  cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, '') // Symboles divers
  cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, '') // Symboles décoratifs
  cleaned = cleaned.replace(/[💎🔥🤖✨🌙🧠💻🤝💫🪶🌸]/gu, '') // Émoticônes spécifiques
  
  // Nettoyer les espaces multiples qui peuvent résulter de la suppression
  cleaned = cleaned.replace(/\s{2,}/g, ' ')
  
  return cleaned.trim()
}

