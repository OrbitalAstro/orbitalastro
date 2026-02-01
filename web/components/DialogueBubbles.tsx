import React from 'react'

interface DialogueBubblesProps {
  text: string
  firstName?: string
}

/**
 * Parse et rend le texte comme des bulles de conversation
 */
export function DialogueBubbles({ text, firstName }: DialogueBubblesProps) {
  if (!text) return null

  const lines = text.split('\n').filter(line => line.trim())
  const bubbles: React.ReactNode[] = []
  let currentParagraph: string[] = []
  let isInDialogue = false

  const detectDialogue = (line: string) => {
    const match = line.match(/^([^\n:]{2,24})\s*:\s*(.*)$/s)
    if (!match) return null
    
    const speaker = match[1].trim()
    const content = match[2].trim()
    const speakerLower = speaker.toLowerCase()
    
    const isAstro = 
      speakerLower === 'astrologie' ||
      speakerLower === 'astrology' ||
      speakerLower === 'astrología' ||
      speakerLower === 'astrologia'
    
    const looksLikeFirstName = /^[\p{L}'’-]+$/u.test(speaker) && speaker.length <= 16
    
    if (isAstro || looksLikeFirstName) {
      return { speaker, content, isAstro }
    }
    
    return null
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) {
      if (currentParagraph.length > 0) {
        bubbles.push(
          <p key={`para-${i}`} className="dialogue-paragraph">
            {currentParagraph.join(' ')}
          </p>
        )
        currentParagraph = []
      }
      continue
    }

    const dialogue = detectDialogue(line)
    
    if (dialogue) {
      // Si on avait un paragraphe en cours, le terminer
      if (currentParagraph.length > 0) {
        bubbles.push(
          <p key={`para-before-${i}`} className="dialogue-paragraph">
            {currentParagraph.join(' ')}
          </p>
        )
        currentParagraph = []
      }
      
      // Créer une bulle de dialogue
      bubbles.push(
        <div
          key={`bubble-${i}`}
          className={`dialogue-bubble ${dialogue.isAstro ? 'dialogue-bubble-astro' : 'dialogue-bubble-user'}`}
        >
          <div className="dialogue-bubble-speaker">{dialogue.speaker}</div>
          <div className="dialogue-bubble-content">
            <p className="dialogue-bubble-text">{dialogue.content}</p>
          </div>
        </div>
      )
      isInDialogue = true
    } else {
      // Texte normal (paragraphe)
      currentParagraph.push(line)
      isInDialogue = false
    }
  }

  // Ajouter le dernier paragraphe s'il y en a un
  if (currentParagraph.length > 0) {
    bubbles.push(
      <p key="para-last" className="dialogue-paragraph">
        {currentParagraph.join(' ')}
      </p>
    )
  }

  return <div className="dialogue-bubbles-container">{bubbles}</div>
}

