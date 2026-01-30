/**
 * Nettoie le texte en retirant les astérisques, les émoticônes, les symboles markdown et les instructions
 */
export function cleanText(text: string): string {
  if (!text) return ''
  
  let cleaned = text
  
  // Retirer les astérisques (***, **, *, * * *)
  cleaned = cleaned.replace(/\*{1,3}/g, '').replace(/\*\s*\*\s*\*/g, '')
  
  // Retirer les symboles markdown
  cleaned = cleaned.replace(/^#{1,6}\s+/gm, '') // Headers markdown (##, ###, etc.)
  cleaned = cleaned.replace(/\*\*/g, '') // Bold markdown **
  cleaned = cleaned.replace(/`{1,3}/g, '') // Code blocks ```
  cleaned = cleaned.replace(/~~/g, '') // Strikethrough ~~
  
  // Retirer les symboles de tableau markdown
  cleaned = cleaned.replace(/\|:?-+:?\|/g, '') // Table separators |:---|
  cleaned = cleaned.replace(/^\|\s*/gm, '') // Leading | at start of lines
  cleaned = cleaned.replace(/\s*\|$/gm, '') // Trailing | at end of lines
  
  // Retirer les instructions entre parenthèses qui sont clairement des instructions
  cleaned = cleaned.replace(/\(0\s+INTRODUCTION\s+2026\)/gi, '')
  cleaned = cleaned.replace(/\(nomme\s+un\s+levier\s+simple\)/gi, '')
  cleaned = cleaned.replace(/\(Décrit\s+un\s+piège\)/gi, '')
  cleaned = cleaned.replace(/\(Nomme\s+un\s+levier\s+simple\)/gi, '')
  cleaned = cleaned.replace(/\(1\s+phrase\)/gi, '')
  cleaned = cleaned.replace(/\(2-3\s+éléments\)/gi, '')
  cleaned = cleaned.replace(/\(1\s+action\s+\+\s+1\s+micro-habitude\)/gi, '')
  
  // Retirer tous les émoticônes courants
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Émoticônes Unicode
  cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, '') // Symboles divers
  cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, '') // Symboles décoratifs
  cleaned = cleaned.replace(/[💎🔥🤖✨🌙🧠💻🤝💫🪶🌸]/gu, '') // Émoticônes spécifiques
  
  // Nettoyer les espaces multiples qui peuvent résulter de la suppression
  cleaned = cleaned.replace(/[ \t]+/g, ' ') // Multiple spaces/tabs to single space
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n') // More than 2 newlines to 2 newlines
  
  return cleaned.trim()
}

