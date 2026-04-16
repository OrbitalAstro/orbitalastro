import React from 'react'
import { Document, Page, StyleSheet, Text, View, Font } from '@react-pdf/renderer'
import { translations, type Language } from '@/lib/i18n'

const GOLD = '#b8860b'
const GOLD_DARK = '#8b6914'
const TEXT_BLACK = '#000000'

let greatVibesLoaded = false
try {
  const getFontUrl = () => {
    if (typeof window !== 'undefined') return `${window.location.origin}/fonts/GreatVibes-Regular.ttf`
    return 'public/fonts/GreatVibes-Regular.ttf'
  }
  Font.register({
    family: 'GreatVibes',
    src: getFontUrl(),
  })
  greatVibesLoaded = true
} catch (error) {
  console.warn('Failed to register GreatVibes font from local file:', error)
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: '#ffffff',
    padding: 20, // Réduit pour mobile
    position: 'relative',
  },
  pageFrame: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    bottom: 20,
    border: `2 solid ${GOLD}`,
    borderRadius: 8,
  },
  pageContent: {
    position: 'relative',
    zIndex: 1,
    flexGrow: 1,
  },
  container: {
    backgroundColor: 'transparent',
    padding: 15, // Réduit pour mobile
    flexGrow: 1,
    color: GOLD,
  },
  pagination: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: 'Helvetica',
    fontSize: 10,
    color: GOLD_DARK,
  },
  header: {
    textAlign: 'center',
    marginBottom: 14,
  },
  brandLine: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8,
  },
  brandScript: {
    fontFamily: greatVibesLoaded ? 'GreatVibes' : 'Times-Italic',
    fontSize: greatVibesLoaded ? 34 : 40,
    color: GOLD,
    letterSpacing: greatVibesLoaded ? 0.5 : 1.5,
    fontStyle: greatVibesLoaded ? 'normal' : 'italic',
  },
  brandSans: {
    fontFamily: 'Times-Roman',
    fontSize: 16,
    color: GOLD_DARK,
    letterSpacing: 6,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginLeft: 4,
    marginBottom: -4,
  },
  subtitle: {
    fontFamily: 'Times-Roman',
    fontSize: 9,
    color: GOLD_DARK,
    letterSpacing: 4,
    marginTop: 6,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  brand: {
    fontFamily: 'Times-Roman',
    fontSize: 22,
    color: GOLD,
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: {
    fontFamily: 'Times-Bold',
    fontSize: 14,
    color: GOLD_DARK,
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  meta: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: GOLD_DARK,
    marginBottom: 2,
  },
  paragraph: {
    fontFamily: 'Helvetica',
    fontSize: 14, // Augmenté pour mobile
    lineHeight: 1.55,
    marginBottom: 10,
    textAlign: 'justify',
    color: TEXT_BLACK,
  },
  heading: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 16, // Augmenté pour mobile (14 + 2 = 16)
    marginTop: 8,
    marginBottom: 8,
    color: TEXT_BLACK,
    fontWeight: 'bold',
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  bullet: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 14, // Augmenté pour mobile
    color: TEXT_BLACK,
    width: 10,
  },
  bulletText: {
    fontFamily: 'Helvetica',
    fontSize: 14, // Augmenté pour mobile
    lineHeight: 1.45,
    color: TEXT_BLACK,
  },
  footer: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: GOLD_DARK,
    textAlign: 'center',
    marginTop: 12,
  },
  inlineScript: {
    fontFamily: greatVibesLoaded ? 'GreatVibes' : 'Times-Italic',
    fontStyle: greatVibesLoaded ? 'normal' : 'italic',
    fontSize: 18,
  },
  // Styles pour les bulles de dialogue
  dialogueBubbleContainer: {
    marginBottom: 16,
    maxWidth: '85%',
  },
  dialogueBubbleAstro: {
    alignSelf: 'flex-start',
  },
  dialogueBubbleUser: {
    alignSelf: 'flex-end',
  },
  dialogueBubbleContent: {
    padding: 12,
    borderRadius: 18,
    marginBottom: 6,
  },
  dialogueBubbleAstroContent: {
    backgroundColor: '#FAF5FF', // Fond mauve clair
    border: `1 solid ${GOLD}`,
    borderBottomLeftRadius: 6, // Queue de bulle
  },
  dialogueBubbleUserContent: {
    backgroundColor: '#FCF8FF', // Fond mauve très clair
    border: `1 solid ${GOLD}`,
    borderBottomRightRadius: 6, // Queue de bulle
  },
  dialogueBubbleSpeaker: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 4,
    fontStyle: 'italic',
    color: GOLD,
  },
  dialogueBubbleUserSpeaker: {
    textAlign: 'right',
    color: GOLD_DARK,
  },
  dialogueBubbleText: {
    fontFamily: 'Helvetica',
    fontSize: 14, // Augmenté pour mobile
    lineHeight: 1.7,
    color: TEXT_BLACK,
    textAlign: 'left',
  },
})

type Block =
  | { type: 'heading'; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'paragraph'; text: string }

// Fonction pour nettoyer le texte : retirer astérisques et émoticônes
function cleanText(text: string): string {
  if (!text) return ''
  // Retirer les astérisques (***, **, *, * * *)
  let cleaned = text.replace(/\*{1,3}/g, '').replace(/\*\s*\*\s*\*/g, '')
  // Retirer tous les émoticônes courants
  cleaned = cleaned.replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Émoticônes Unicode
  cleaned = cleaned.replace(/[\u{2600}-\u{26FF}]/gu, '') // Symboles divers
  cleaned = cleaned.replace(/[\u{2700}-\u{27BF}]/gu, '') // Symboles décoratifs
  cleaned = cleaned.replace(/[💎🔥🤖✨🌙🧠💻🤝💫🪶🌸]/gu, '') // Émoticônes spécifiques
  return cleaned.trim()
}

// Fonction pour éviter les retours à la ligne après certains signes de ponctuation
function preventLineBreakAfterPunctuation(text: string): string {
  // Remplacer les espaces après ;, :, » par des espaces insécables
  return text
    .replace(/;\s+/g, ';\u00A0') // Espace insécable après point-virgule
    .replace(/:\s+/g, ':\u00A0') // Espace insécable après deux-points
    .replace(/»\s+/g, '»\u00A0') // Espace insécable après guillemet fermant
}

// Fonction pour rendre les dialogues avec noms en italique
function renderDialogueLine(text: string, firstName?: string): React.ReactNode {
  // Détecter le format "Nom : « texte »" ou "Nom : texte"
  // Aussi détecter "Tu pourrais remarquer : " et inclure tout le texte suivant
  const match = text.match(/^([^\n:]{2,50})\s*:\s*(.*)$/s)
  if (!match) {
    // Pas un dialogue, retourner le texte normal avec protection des retours à la ligne
    return preventLineBreakAfterPunctuation(text)
  }

  const label = match[1].trim()
  const rest = match[2] ?? ''
  const labelLower = label.toLowerCase()
  
  // Détecter si c'est "Astrologie" ou un prénom
  const isAstrologie = labelLower === 'astrologie' || labelLower === 'astrology' || labelLower === 'astrología' || labelLower === 'astrologia'
  const looksLikeFirstName = /^[\p{L}'’-]+$/u.test(label) && label.length <= 16 && labelLower !== 'naissance' && labelLower !== 'atterrissage'
  
  // Détecter les phrases comme "Tu pourrais remarquer", "Tu remarqueras", etc.
  const isObservationPhrase = /^(tu\s+(pourrais|remarqueras|noteras|observeras|constateras)|vous\s+(pourriez|remarquerez|noterez|observerez|constaterez)|on\s+(pourrait|remarque|note|observe|constate))\s+/i.test(label)
  
  if (!isAstrologie && !looksLikeFirstName && !isObservationPhrase) {
    // Pas un dialogue reconnu, retourner le texte normal
    return preventLineBreakAfterPunctuation(text)
  }

  // C'est un dialogue : mettre le nom en italique
  return (
    <>
      <Text style={styles.inlineScript}>{label}</Text>
      {': '}
      {preventLineBreakAfterPunctuation(rest)}
    </>
  )
}

// Liste des titres de section connus pour la lecture 2026
const KNOWN_SECTION_TITLES = [
  'Missions de l\'année 2026',
  'Missions de l\'année',
  'Missions',
  'Grandes dynamiques de croissance',
  'Grandes dynamiques',
  'Dynamiques de croissance',
  'Cycles intérieurs',
  'Cycles intérieurs (Lune)',
  'Cycles intérieurs Lune',
  'Destinée',
  'Destinée (Nœud Nord + MC / axe vocation)',
  'Destinée Nœud Nord MC axe vocation',
  'Image symbolique de 2026',
  'Image symbolique',
  'Séquence temporelle 2026',
  'Séquence temporelle',
  'Filtre de décision',
  'En résumé',
  'Résumé',
  'Conclusion',
  'Clôture vivante 2026',
  // Versions anglaises
  'Missions for 2026',
  'Missions',
  'Major Growth Dynamics',
  'Growth Dynamics',
  'Inner Cycles',
  'Inner Cycles (Moon)',
  'Inner Cycles Moon',
  'Destiny',
  'Destiny (North Node + MC / Vocation Axis)',
  'Destiny North Node MC Vocation Axis',
  'Symbolic Image of 2026',
  'Symbolic Image',
  'Temporal Sequence 2026',
  'Temporal Sequence',
  'Decision Filter',
  'Summary',
  'In Summary',
  'Conclusion',
  'Living Closure 2026',
  // Versions espagnoles
  'Misiones del año 2026',
  'Misiones',
  'Grandes dinámicas de crecimiento',
  'Dinámicas de crecimiento',
  'Ciclos interiores',
  'Ciclos interiores (Luna)',
  'Ciclos interiores Luna',
  'Destino',
  'Destino (Nodo Norte + MC / Eje de vocación)',
  'Destino Nodo Norte MC Eje vocación',
  'Imagen simbólica de 2026',
  'Imagen simbólica',
  'Secuencia temporal 2026',
  'Secuencia temporal',
  'Filtro de decisión',
  'Resumen',
  'En resumen',
  'Conclusión',
  'Cierre viviente 2026',
]

function isSectionTitle(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false
  
  // Vérifier si c'est un titre markdown
  if (/^#{1,6}\s+/.test(trimmed)) return true
  
  // Vérifier si c'est un titre avec numéro au début (ex: "2.4) Filtre de décision", "4.5) Séquence temporelle")
  if (/^\d+\.\d+\)\s+/.test(trimmed) || /^\d+\)\s+/.test(trimmed)) {
    // C'est probablement un titre si après le numéro il y a du texte en majuscule ou avec majuscule
    const afterNumber = trimmed.replace(/^\d+\.\d+\)\s+/, '').replace(/^\d+\)\s+/, '').trim()
    if (afterNumber.length > 0 && afterNumber.length < 100 && /^\p{Lu}/u.test(afterNumber)) {
      return true
    }
  }
  
  // Vérifier si c'est un titre connu (après avoir retiré les numéros)
  const withoutNumbers = trimmed.replace(/^\d+\.\d+\)\s+/, '').replace(/^\d+\)\s+/, '').trim()
  const normalized = withoutNumbers.toLowerCase()
  for (const title of KNOWN_SECTION_TITLES) {
    const titleLower = title.toLowerCase()
    // Vérifier correspondance exacte ou si le titre commence par le titre connu
    if (normalized === titleLower || normalized.startsWith(titleLower) || titleLower.startsWith(normalized)) {
      return true
    }
    // Vérifier si le titre contient des mots-clés importants
    const titleWords = titleLower.split(/\s+/).filter(w => w.length > 3)
    const normalizedWords = normalized.split(/\s+/).filter(w => w.length > 3)
    const matchingWords = titleWords.filter(w => normalizedWords.includes(w))
    if (matchingWords.length >= 2) {
      return true
    }
  }
  
  // Vérifier les patterns de titres : ligne courte, commence par majuscule, pas de point à la fin
  // Mais aussi accepter les titres qui commencent par un numéro suivi d'un texte
  if (trimmed.length < 100 && 
      (/^\p{Lu}/u.test(trimmed) || /^\d+[\.\)]\s+\p{Lu}/u.test(trimmed)) && 
      !trimmed.endsWith('.') && 
      !trimmed.endsWith(',') &&
      !trimmed.endsWith(';') &&
      !trimmed.includes(' : ') && // Pas un dialogue
      trimmed.split(' ').length <= 15) {
    return true
  }
  
  return false
}

function cleanTitleText(text: string): string {
  // Retirer les numéros de titres comme "2.4) Filtre de décision" → "Filtre de décision"
  // Patterns: "2.4) ", "2.4. ", "2) ", "(2.4) ", "4.5) Séquence temporelle 2026 - TABLEAU" → "Séquence temporelle 2026 - TABLEAU"
  let cleaned = text
    .replace(/^#{1,6}\s+/, '') // Retirer les # markdown
    .replace(/^\d+\.\d+\)\s+/, '') // "2.4) " ou "4.5) "
    .replace(/^\d+\.\d+\.\s+/, '') // "2.4. "
    .replace(/^\d+\)\s+/, '') // "2) "
    .replace(/^\(\d+\.\d+\)\s+/, '') // "(2.4) "
    .replace(/^\(\d+\)\s+/, '') // "(2) "
    .trim()
  
  // Si le texte commence encore par un numéro après le premier nettoyage, réessayer
  if (/^\d+\.\d+\)\s+/.test(cleaned) || /^\d+\)\s+/.test(cleaned)) {
    cleaned = cleaned.replace(/^\d+\.\d+\)\s+/, '').replace(/^\d+\)\s+/, '').trim()
  }
  
  return cleaned
}

function parseBlocks(markdown: string): Block[] {
  let text = cleanText((markdown || '').replace(/\r\n/g, '\n')).trim()
  if (!text) return []

  // Pré-traiter le texte pour regrouper les lignes qui suivent "Tu pourrais remarquer :" dans le même bloc
  const processedLines: string[] = []
  const allLines = text.split(/\r?\n/)
  let i = 0
  
  while (i < allLines.length) {
    const line = allLines[i].trim()
    
    // Détecter si cette ligne commence par "Tu pourrais remarquer :" ou similaire
    const observationMatch = line.match(/^(tu\s+(pourrais|remarqueras|noteras|observeras|constateras)|vous\s+(pourriez|remarquerez|noterez|observerez|constaterez)|on\s+(pourrait|remarque|note|observe|constate))\s*:\s*(.*)$/i)
    
    if (observationMatch) {
      // Commencer un nouveau bloc avec cette ligne
      let combinedText = line
      i++
      
      // Continuer à ajouter les lignes suivantes jusqu'à ce qu'on trouve :
      // - Une ligne vide (fin de paragraphe)
      // - Un nouveau dialogue (ligne avec "Nom :")
      // - Un titre (ligne qui commence par # ou qui est un titre connu)
      while (i < allLines.length) {
        const nextLine = allLines[i].trim()
        
        // Arrêter si ligne vide
        if (!nextLine) {
          break
        }
        
        // Arrêter si c'est un nouveau dialogue
        const dialogueMatch = nextLine.match(/^([^\n:]{2,24})\s*:\s*(.*)$/)
        if (dialogueMatch) {
          const label = dialogueMatch[1].trim().toLowerCase()
          const isNewDialogue = 
            label === 'astrologie' || label === 'astrology' || label === 'astrología' || label === 'astrologia' ||
            /^[\p{L}'’-]+$/u.test(dialogueMatch[1].trim()) && dialogueMatch[1].trim().length <= 16
          if (isNewDialogue) {
            break
          }
        }
        
        // Arrêter si c'est un titre (commence par # ou est un titre connu)
        if (isSectionTitle(nextLine)) {
          break
        }
        
        // Ajouter cette ligne au bloc combiné
        combinedText += '\n' + nextLine
        i++
      }
      
      processedLines.push(combinedText)
    } else {
      // Ligne normale, l'ajouter telle quelle
      processedLines.push(line)
      i++
    }
  }
  
  // Rejoindre les lignes traitées
  text = processedLines.join('\n\n')

  const blocks: Block[] = []
  // Diviser par lignes pour préserver tout le contenu
  const lines = text.split(/\r?\n/)
  const hasBlankLine = /\n\s*\n/.test(text)
  
  let currentParagraph = ''
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // Si la ligne est vide, terminer le paragraphe courant
    if (!line) {
      if (currentParagraph) {
        const trimmed = currentParagraph.trim()
        if (trimmed) {
          // Vérifier si c'est un titre
          if (isSectionTitle(trimmed)) {
            blocks.push({ type: 'heading', text: cleanTitleText(trimmed) })
          } else if (/^(?:[-•*]|\d+\.)\s+/.test(trimmed)) {
            blocks.push({ type: 'bullet', text: trimmed.replace(/^(?:[-•*]|\d+\.)\s+/, '').trim() })
          } else {
            blocks.push({ type: 'paragraph', text: trimmed })
          }
        }
        currentParagraph = ''
      }
      continue
    }
    
    // Si pas de lignes vides dans le texte, traiter chaque ligne séparément
    if (!hasBlankLine) {
      if (currentParagraph) {
        const trimmed = currentParagraph.trim()
        if (trimmed) {
          if (isSectionTitle(trimmed)) {
            blocks.push({ type: 'heading', text: cleanTitleText(trimmed) })
          } else if (/^(?:[-•*]|\d+\.)\s+/.test(trimmed)) {
            blocks.push({ type: 'bullet', text: trimmed.replace(/^(?:[-•*]|\d+\.)\s+/, '').trim() })
          } else {
            blocks.push({ type: 'paragraph', text: trimmed })
          }
        }
        currentParagraph = ''
      }
      // Vérifier si la ligne actuelle est un titre
      if (isSectionTitle(line)) {
        blocks.push({ type: 'heading', text: cleanTitleText(line) })
      } else if (/^(?:[-•*]|\d+\.)\s+/.test(line)) {
        blocks.push({ type: 'bullet', text: line.replace(/^(?:[-•*]|\d+\.)\s+/, '').trim() })
      } else {
        blocks.push({ type: 'paragraph', text: line })
      }
      continue
    }
    
    // Sinon, accumuler les lignes dans le paragraphe courant
    if (currentParagraph) {
      currentParagraph += '\n' + line
    } else {
      currentParagraph = line
    }
  }
  
  // Ajouter le dernier paragraphe
  if (currentParagraph) {
    const trimmed = currentParagraph.trim()
    if (trimmed) {
      if (isSectionTitle(trimmed)) {
        blocks.push({ type: 'heading', text: cleanTitleText(trimmed) })
      } else if (/^(?:[-•*]|\d+\.)\s+/.test(trimmed)) {
        blocks.push({ type: 'bullet', text: trimmed.replace(/^(?:[-•*]|\d+\.)\s+/, '').trim() })
      } else {
        blocks.push({ type: 'paragraph', text: trimmed })
      }
    }
  }

  return blocks
}

interface Reading2026PdfProps {
  reading: string
  language?: Language
  firstName?: string
  birthDate?: string
  birthTime?: string
  birthPlace?: string
}

export default function Reading2026Pdf({
  reading,
  language = 'fr',
  firstName,
  birthDate,
  birthTime,
  birthPlace,
}: Reading2026PdfProps) {
  const t = translations[language] || translations.fr

  console.log('[Reading2026Pdf] Texte reçu (longueur):', reading?.length || 0)
  console.log('[Reading2026Pdf] Premiers 500 caractères:', reading?.substring(0, 500))
  console.log('[Reading2026Pdf] Derniers 500 caractères:', reading?.substring(Math.max(0, (reading?.length || 0) - 500)))

  let blocks = parseBlocks(reading)
  
  // Vérifier que tout le contenu est préservé
  const totalBlockLength = blocks.reduce((sum, b) => sum + b.text.length, 0)
  const originalLength = (reading || '').replace(/\r\n/g, '\n').trim().length
  const preservedRatio = originalLength > 0 ? (totalBlockLength / originalLength) : 1
  
  console.log('[Reading2026Pdf] Nombre de blocs créés:', blocks.length)
  console.log('[Reading2026Pdf] Longueur totale des blocs:', totalBlockLength)
  console.log('[Reading2026Pdf] Longueur originale:', originalLength)
  console.log('[Reading2026Pdf] Ratio de préservation:', (preservedRatio * 100).toFixed(1) + '%')
  
  if (preservedRatio < 0.9) {
    console.warn('[Reading2026Pdf] ⚠️ Plus de 10% du contenu pourrait être perdu lors du parsing!')
  }
  
  console.log('[Reading2026Pdf] Premiers 3 blocs:', blocks.slice(0, 3).map(b => ({ type: b.type, textLength: b.text.length, preview: b.text.substring(0, 100) })))
  console.log('[Reading2026Pdf] Derniers 3 blocs:', blocks.slice(-3).map(b => ({ type: b.type, textLength: b.text.length, preview: b.text.substring(0, 100) })))
  
  // Remove the title line if it matches "FirstName - Plan de jeu astrologique 2026" pattern
  if (blocks.length > 0 && blocks[0].type === 'paragraph') {
    const firstBlockText = blocks[0].text.trim()
    const titlePattern = /^[^-]+ - Plan de jeu astrologique 2026$/i
    if (titlePattern.test(firstBlockText)) {
      blocks = blocks.slice(1) // Remove the first block
    }
  }

  // Format birth place to remove administrative region
  const formatBirthPlaceForPdf = (place: string): string => {
    if (!place) return ''
    const parts = place
      .split(',')
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .filter(p => !p.toLowerCase().includes('région administrative'))
    if (parts.length >= 3) {
      const city = parts[0]
      const province = parts[parts.length - 2]
      const country = parts[parts.length - 1]
      return `${city}, ${province}, ${country}`
    } else if (parts.length === 2) {
      return `${parts[0]}, ${parts[1]}`
    } else {
      return parts[0] || place
    }
  }

  const metaLines = [
    firstName ? firstName : null, // Only show the name, no label
    birthDate ? `${t.reading2026.birthDate}: ${birthDate}` : null,
    birthTime ? `${t.reading2026.birthTime}: ${birthTime}` : null,
    birthPlace ? `${t.reading2026.birthPlace}: ${formatBirthPlaceForPdf(birthPlace)}` : null,
  ].filter(Boolean) as string[]

  const title = language === 'en' ? '2026 Astrological Game Plan' : language === 'es' ? 'Plan de juego astrológico 2026' : 'Plan de jeu astrologique 2026'

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.pageFrame} fixed />
        <View style={styles.pageContent}>
          <View style={styles.container}>
            <View style={styles.header}>
              <View style={{ marginBottom: 8 }}>
                <View style={{ height: 1, backgroundColor: GOLD, width: '100%', marginBottom: 2 }} />
                <View style={{ height: 1, backgroundColor: GOLD, width: '100%' }} />
              </View>

              <View style={styles.brandLine}>
                <Text style={styles.brandScript}>Orbital</Text>
                <Text style={styles.brandSans}>ASTRO</Text>
              </View>

              <Text style={styles.subtitle}>{title}</Text>
              <View style={{ height: 8 }} />
              {metaLines.map((line, i) => (
                <Text key={i} style={styles.meta}>
                  {line}
                </Text>
              ))}
            </View>

          {blocks.map((block, index) => {
            if (block.type === 'heading') {
              return (
                <Text key={index} style={styles.heading}>
                  {block.text}
                </Text>
              )
            }
            if (block.type === 'bullet') {
              return (
                <View key={index} style={styles.bulletRow}>
                  <Text style={styles.bullet}>•</Text>
                  <Text style={styles.bulletText}>{block.text}</Text>
                </View>
              )
            }
            // Vérifier si c'est un dialogue et appliquer le formatage avec bulles
            const dialogueMatch = block.text.match(/^([^\n:]{2,50})\s*:\s*(.*)$/s)
            const isDialogue = (() => {
              if (!dialogueMatch) return false
              const label = dialogueMatch[1].trim()
              const labelLower = label.toLowerCase()
              const isAstro =
                labelLower === 'astrologie' ||
                labelLower === 'astrology' ||
                labelLower === 'astrología' ||
                labelLower === 'astrologia'
              const looksLikeFirstName = /^[\p{L}'’-]+$/u.test(label) && label.length <= 16 && labelLower !== 'naissance' && labelLower !== 'atterrissage'
              const isObservationPhrase = /^(tu\s+(pourrais|remarqueras|noteras|observeras|constateras)|vous\s+(pourriez|remarquerez|noterez|observerez|constaterez)|on\s+(pourrait|remarque|note|observe|constate))\s+/i.test(label)
              return isAstro || looksLikeFirstName || isObservationPhrase
            })()
            
            // Si c'est un dialogue, rendre comme une bulle
            if (isDialogue && dialogueMatch) {
              const speaker = dialogueMatch[1].trim()
              const content = dialogueMatch[2].trim()
              const labelLower = speaker.toLowerCase()
              const isAstro =
                labelLower === 'astrologie' ||
                labelLower === 'astrology' ||
                labelLower === 'astrología' ||
                labelLower === 'astrologia'
              
              return (
                <View
                  key={index}
                  wrap={false}
                  style={[
                    styles.dialogueBubbleContainer,
                    isAstro ? styles.dialogueBubbleAstro : styles.dialogueBubbleUser,
                  ]}
                  minPresenceAhead={50}
                >
                  <Text
                    style={[
                      styles.dialogueBubbleSpeaker,
                      !isAstro ? styles.dialogueBubbleUserSpeaker : null,
                    ]}
                  >
                    {speaker}
                  </Text>
                  <View
                    style={[
                      styles.dialogueBubbleContent,
                      isAstro ? styles.dialogueBubbleAstroContent : styles.dialogueBubbleUserContent,
                    ]}
                  >
                    <Text style={styles.dialogueBubbleText}>
                      {preventLineBreakAfterPunctuation(content)}
                    </Text>
                  </View>
                </View>
              )
            }
            
            // Sinon, texte normal
            const dialogueContent = renderDialogueLine(block.text, firstName)
            return (
              <Text key={index} style={styles.paragraph}>
                {dialogueContent}
              </Text>
            )
          })}

            <Text style={styles.footer}>
              {language === 'en'
                ? 'Generated by OrbitalAstro'
                : language === 'es'
                  ? 'Generado por OrbitalAstro'
                  : 'Généré par OrbitalAstro'}
            </Text>
          </View>
        </View>

        <Text
          style={styles.pagination}
          render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
          fixed
        />
      </Page>
    </Document>
  )
}
