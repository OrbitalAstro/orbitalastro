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
    padding: 30,
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
    flex: 1,
  },
  container: {
    backgroundColor: 'transparent',
    padding: 20,
    flex: 1,
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
  meta: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: GOLD_DARK,
    marginBottom: 2,
  },
  paragraph: {
    fontFamily: 'Helvetica',
    fontSize: 12,
    lineHeight: 1.55,
    marginBottom: 10,
    textAlign: 'justify',
    color: TEXT_BLACK,
  },
  heading: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    marginTop: 6,
    marginBottom: 6,
    color: TEXT_BLACK,
  },
  bulletRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 4,
  },
  bullet: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 12,
    color: TEXT_BLACK,
    width: 10,
  },
  bulletText: {
    fontFamily: 'Helvetica',
    fontSize: 12,
    lineHeight: 1.45,
    color: TEXT_BLACK,
    flex: 1,
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
  },
  dialogueBubbleFullWidth: {
    width: '100%',
    alignSelf: 'stretch',
  },
  dialogueBubbleLeft: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  dialogueBubbleRight: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  dialogueBubbleAstro: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  dialogueBubbleUser: {
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  dialogueBubbleContent: {
    padding: 12,
    borderRadius: 18,
    marginBottom: 6,
  },
  dialogueBubbleFullWidthContent: {
    backgroundColor: '#FAF5FF', // Fond mauve clair
    border: `1 solid ${GOLD}`,
    borderRadius: 18, // Pas de queue pour largeur complète
  },
  dialogueBubbleLeftContent: {
    backgroundColor: '#FAF5FF', // Fond mauve clair
    border: `1 solid ${GOLD}`,
    borderBottomLeftRadius: 6, // Queue de bulle à gauche
  },
  dialogueBubbleRightContent: {
    backgroundColor: '#FCF8FF', // Fond mauve très clair
    border: `1 solid ${GOLD}`,
    borderBottomRightRadius: 6, // Queue de bulle à droite
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
    fontSize: 12,
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

// Fonction pour détecter si c'est un dialogue
function isDialogueLine(text: string): { isDialogue: boolean; speaker?: string; content?: string } {
  const match = text.match(/^([^\n:]{2,80})\s*:\s*(.*)$/s)
  if (!match) return { isDialogue: false }
  
  const label = match[1].trim()
  const labelLower = label.toLowerCase()
  const dialogueText = match[2].trim()
  
  // Exclure "Mode d'emploi relationnel" des dialogues
  if (labelLower === "mode d'emploi relationnel" || labelLower === "relational user manual" || labelLower === "manual de uso relacional") {
    return { isDialogue: false }
  }
  
  // Si pas de texte après les deux-points, ce n'est pas un dialogue
  if (!dialogueText || dialogueText.length < 3) return { isDialogue: false }
  
  const isAstro =
    labelLower === 'astrologie' ||
    labelLower === 'astrology' ||
    labelLower === 'astrología' ||
    labelLower === 'astrologia'
  // Détecter les planètes/signes qui parlent : "Vénus d'Isabelle en Balance", "Lune de OA en Lion", etc.
  const isPlanetInSign = /^(soleil|lune|mercure|venus|mars|jupiter|saturne|uranus|neptune|pluton|ascendant|midheaven|mc|asc|sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|ascendant|midheaven)\s+(de|d'|of|of')\s+[\p{L}'’-]+\s+en\s+(belier|bélier|taureau|gemeaux|gémeaux|cancer|lion|vierge|balance|scorpion|sagittaire|capricorne|verseau|poissons|poisson|aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces)$/iu.test(label)
  // Détecter les prénoms simples (plus permissif)
  const excludedWords = ['naissance', 'atterrissage', 'birth', 'nascimiento', 'gestes', 'actions', 'acciones', 'résumé', 'summary', 'resumen', 'conclusion', 'mode', 'emploi', 'relationnel', 'user', 'manual', 'uso', 'relacional']
  const looksLikeFirstName = /^[\p{L}'’\s-]+$/u.test(label) && 
    label.length <= 30 && 
    label.length >= 2 &&
    !excludedWords.some(word => labelLower === word || labelLower.startsWith(word + ' ') || labelLower.endsWith(' ' + word))
  // Détecter les phrases d'observation
  const isObservationPhrase = /^(tu\s+(pourrais|remarqueras|noteras|observeras|constateras)|vous\s+(pourriez|remarquerez|noterez|observerez|constaterez)|on\s+(pourrait|remarque|note|observe|constate))\s+/i.test(label)
  
  // Si c'est un titre de section connu, ce n'est pas un dialogue
  const isSectionTitle = /^(ce qui marche|what works|lo que funciona|ce qui sécurise|what secures|lo que asegura|ce qui ne marche pas|what doesn't|lo que no funciona|frictions mignonnes|cute frictions|fricciones lindas|3 gestes|3 actions|3 acciones|en résumé|summary|resumen|conclusion)/i.test(labelLower)
  
  if (!isSectionTitle && (isAstro || isPlanetInSign || looksLikeFirstName || isObservationPhrase)) {
    return { isDialogue: true, speaker: label, content: dialogueText }
  }
  
  return { isDialogue: false }
}

function parseBlocks(markdown: string): Block[] {
  const text = cleanText((markdown || '').replace(/\r\n/g, '\n')).trim()
  if (!text) return []

  const blocks: Block[] = []
  // Diviser par lignes vides (une ou plusieurs)
  const paragraphs = text.split(/\n\s*\n/)

  for (const raw of paragraphs) {
    const chunk = raw.trim()
    if (!chunk) continue

    // Si le paragraphe contient plusieurs lignes, les traiter séparément
    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean)
      .filter((l) => {
        // Filtrer les lignes qui sont uniquement des traits (---, ---, etc.)
        const onlyDashes = /^[-─—]+$/.test(l)
        return !onlyDashes
      })
    if (!lines.length) continue

    // Si c'est une seule ligne, créer un bloc
    if (lines.length === 1) {
      const line = lines[0]
      if (/^#{1,6}\s+/.test(line)) {
        blocks.push({ type: 'heading', text: line.replace(/^#{1,6}\s+/, '').trim() })
      } else if (/^(?:[-•*]|\d+\.)\s+/.test(line)) {
        blocks.push({ type: 'bullet', text: line.replace(/^(?:[-•*]|\d+\.)\s+/, '').trim() })
      } else {
        blocks.push({ type: 'paragraph', text: line })
      }
    } else {
      // Si plusieurs lignes, créer un bloc paragraphe avec tout le contenu
      // (pour préserver les dialogues et les retours à la ligne)
      const fullText = lines.join('\n')
      if (/^#{1,6}\s+/.test(lines[0])) {
        blocks.push({ type: 'heading', text: lines[0].replace(/^#{1,6}\s+/, '').trim() })
        if (lines.length > 1) {
          blocks.push({ type: 'paragraph', text: lines.slice(1).join('\n') })
        }
      } else if (/^(?:[-•*]|\d+\.)\s+/.test(lines[0])) {
        // Pour les listes, créer un bloc par ligne
        for (const line of lines) {
          if (/^(?:[-•*]|\d+\.)\s+/.test(line)) {
            blocks.push({ type: 'bullet', text: line.replace(/^(?:[-•*]|\d+\.)\s+/, '').trim() })
          } else {
            blocks.push({ type: 'paragraph', text: line })
          }
        }
      } else {
        // Paragraphe normal avec plusieurs lignes (dialogue ou texte)
        // Si plusieurs lignes avec format dialogue, créer un bloc par ligne
        const dialogueLines = lines.filter(line => /^([^\n:]{2,80})\s*:\s*(.*)$/s.test(line))
        if (dialogueLines.length > 1) {
          // Créer un bloc séparé pour chaque ligne de dialogue
          for (const line of lines) {
            blocks.push({ type: 'paragraph', text: line })
          }
        } else {
          // Sinon, garder le texte complet
          blocks.push({ type: 'paragraph', text: fullText })
        }
      }
    }
  }

  return blocks
}

interface ValentinePdfProps {
  content: string
  language?: Language
  youName?: string
  partnerName?: string
  relationshipContext?: string
}

export default function ValentinePdf({ content, language = 'fr', youName, partnerName, relationshipContext }: ValentinePdfProps) {
  const t = translations[language] || translations.fr
  const blocks = parseBlocks(content)

  const metaLines = [
    youName ? `${t.valentine.youName.replace(/\s*\(.*?\)\s*$/, '')}: ${youName}` : null,
    partnerName ? `${t.valentine.partnerName.replace(/\s*\(.*?\)\s*$/, '')}: ${partnerName}` : null,
    relationshipContext ? `${t.valentine.relationshipContext}: ${relationshipContext}` : null,
  ].filter(Boolean) as string[]

  const title = t.valentine.title

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
                // Retirer les puces - afficher juste le texte
                return (
                  <Text key={index} style={styles.paragraph}>
                    {preventLineBreakAfterPunctuation(block.text)}
                  </Text>
                )
              }
              
              // Détecter "Mode d'emploi relationnel" comme titre
              const blockTextLower = block.text.toLowerCase().trim()
              
              
              if (blockTextLower === "mode d'emploi relationnel :" || blockTextLower === "mode d'emploi relationnel" || 
                  blockTextLower === "relational user manual :" || blockTextLower === "relational user manual" ||
                  blockTextLower === "manual de uso relacional :" || blockTextLower === "manual de uso relacional") {
                return (
                  <Text key={index} style={[styles.heading, { fontSize: 16, marginTop: 12, marginBottom: 8, fontWeight: 'bold' }]}>
                    {block.text.replace(/:\s*$/, '').trim()}
                  </Text>
                )
              }
              
              // Détecter "naviguer vos orbites" comme sous-titre
              if (blockTextLower === "naviguer vos orbites" || blockTextLower === "navigate your orbits" || 
                  blockTextLower === "navegar vuestras órbitas") {
                return (
                  <Text key={index} style={[styles.heading, { fontSize: 14, marginTop: 8, marginBottom: 6, fontStyle: 'italic' }]}>
                    {block.text}
                  </Text>
                )
              }
              
              // Détecter "Solution douce" et ne pas le mettre en bulle
              const solutionMatch = block.text.match(/^Solution\s+douce\s*:\s*(.+)$/i)
              if (solutionMatch) {
                const solutionText = solutionMatch[1].trim()
                return (
                  <View key={index} style={{ marginTop: 12, marginBottom: 8 }}>
                    <Text style={[styles.heading, { fontSize: 14, marginBottom: 4 }]}>
                      Solution douce
                    </Text>
                    <Text style={styles.paragraph}>
                      {preventLineBreakAfterPunctuation(solutionText)}
                    </Text>
                  </View>
                )
              }
              if (blockTextLower === "solution douce :" || blockTextLower === "solution douce" ||
                  blockTextLower === "gentle solution :" || blockTextLower === "gentle solution" ||
                  blockTextLower === "solución suave :" || blockTextLower === "solución suave") {
                return (
                  <Text key={index} style={[styles.heading, { fontSize: 14, marginTop: 8, marginBottom: 6 }]}>
                    Solution douce
                  </Text>
                )
              }
              
              // Séparer les dialogues multiples dans le même bloc
              const lines = block.text.split('\n').map(l => l.trim()).filter(Boolean)
              const dialogues: Array<{ speaker: string; text: string }> = []
              
              for (const line of lines) {
                const lineMatch = line.match(/^([^\n:]{2,80})\s*:\s*(.*)$/s)
                if (lineMatch) {
                  const speaker = lineMatch[1].trim()
                  const text = lineMatch[2].trim()
                  if (text && text.length >= 3) {
                    dialogues.push({ speaker, text })
                  }
                }
              }
              
              // Si plusieurs dialogues sont détectés, les rendre séparément
              if (dialogues.length > 1) {
                return (
                  <>
                    {dialogues.map((dialogue, idx) => {
                      const speaker = dialogue.speaker
                      const content = dialogue.text
                      const dialogueInfo = isDialogueLine(`${speaker}: ${content}`)
                      if (!dialogueInfo.isDialogue || !dialogueInfo.speaker || !dialogueInfo.content) {
                        return (
                          <Text key={idx} style={styles.paragraph}>
                            {preventLineBreakAfterPunctuation(content)}
                          </Text>
                        )
                      }
                      
                      // Rendre la bulle pour ce dialogue - RÈGLES STRICTES
                      const labelLower = speaker.toLowerCase()
                      const isAstro =
                        labelLower === 'astrologie' ||
                        labelLower === 'astrology' ||
                        labelLower === 'astrología' ||
                        labelLower === 'astrologia'
                      const isPlanetInSign = /^(soleil|lune|mercure|venus|mars|jupiter|saturne|uranus|neptune|pluton|ascendant|midheaven|mc|asc|sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|ascendant|midheaven)\s+(de|d'|of|of')\s+[\p{L}'’-]+\s+en\s+(belier|bélier|taureau|gemeaux|gémeaux|cancer|lion|vierge|balance|scorpion|sagittaire|capricorne|verseau|poissons|poisson|aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces)/iu.test(labelLower)
                      const isAstroType = isAstro || isPlanetInSign
                      
                      // Déterminer la position de la bulle - RÈGLES STRICTES
                      let positionStyle = styles.dialogueBubbleAstro
                      let contentStyle = styles.dialogueBubbleAstroContent
                      const youNameLower = (youName || '').toLowerCase().trim()
                      const partnerNameLower = (partnerName || '').toLowerCase().trim()
                      const speakerNameLower = speaker.toLowerCase().trim()
                      
                      // RÈGLE 1 : Astrologie = largeur complète
                      if (isAstro) {
                        positionStyle = styles.dialogueBubbleFullWidth
                        contentStyle = styles.dialogueBubbleFullWidthContent
                      } else {
                        // RÈGLE 2 : Vérifier si c'est la personne principale (gauche) ou l'autre personne (droite)
                        // Vérifier d'abord si c'est le prénom directement
                        const isYouName = youNameLower && speakerNameLower === youNameLower
                        const isPartnerName = partnerNameLower && speakerNameLower === partnerNameLower
                        
                        // Vérifier si c'est un placement de la personne principale
                        const isYouPlacement = youNameLower && (
                          speakerNameLower.includes(` de ${youNameLower}`) ||
                          speakerNameLower.includes(` d'${youNameLower}`) ||
                          speakerNameLower.includes(` of ${youNameLower}`)
                        )
                        
                        // Vérifier si c'est un placement de l'autre personne
                        const isPartnerPlacement = partnerNameLower && (
                          speakerNameLower.includes(` de ${partnerNameLower}`) ||
                          speakerNameLower.includes(` d'${partnerNameLower}`) ||
                          speakerNameLower.includes(` of ${partnerNameLower}`)
                        )
                        
                        // RÈGLE STRICTE : Personne principale = gauche, Autre personne = droite
                        if (isYouName || isYouPlacement) {
                          positionStyle = styles.dialogueBubbleLeft
                          contentStyle = styles.dialogueBubbleLeftContent
                        } else if (isPartnerName || isPartnerPlacement) {
                          positionStyle = styles.dialogueBubbleRight
                          contentStyle = styles.dialogueBubbleRightContent
                        } else {
                          // Par défaut si on ne peut pas déterminer (ne devrait pas arriver avec les règles strictes)
                          positionStyle = styles.dialogueBubbleFullWidth
                          contentStyle = styles.dialogueBubbleFullWidthContent
                        }
                      }
                      
                      return (
                        <View
                          key={idx}
                          wrap={false}
                          style={[
                            styles.dialogueBubbleContainer,
                            positionStyle,
                          ]}
                          minPresenceAhead={50}
                        >
                          <Text
                            style={[
                              styles.dialogueBubbleSpeaker,
                              !isAstroType ? styles.dialogueBubbleUserSpeaker : null,
                              { fontWeight: 'bold' },
                            ]}
                          >
                            {speaker}
                          </Text>
                          <View
                            style={[
                              styles.dialogueBubbleContent,
                              contentStyle,
                            ]}
                          >
                            <Text style={styles.dialogueBubbleText}>
                              {preventLineBreakAfterPunctuation(content)}
                            </Text>
                          </View>
                        </View>
                      )
                    })}
                  </>
                )
              }
              
              // Si un seul dialogue ou aucun, utiliser la logique existante
              // Vérifier si c'est un dialogue et appliquer le formatage avec bulles
              const dialogueInfo = isDialogueLine(block.text)
              if (dialogueInfo.isDialogue && dialogueInfo.speaker && dialogueInfo.content) {
              const speaker = dialogueInfo.speaker
              const content = dialogueInfo.content
              const labelLower = speaker.toLowerCase()
              const isAstro =
                labelLower === 'astrologie' ||
                labelLower === 'astrology' ||
                labelLower === 'astrología' ||
                labelLower === 'astrologia'
              // Les planètes/signes qui parlent sont aussi considérés comme "astro"
              const isPlanetInSign = /^(soleil|lune|mercure|venus|mars|jupiter|saturne|uranus|neptune|pluton|ascendant|midheaven|mc|asc|sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|ascendant|midheaven)\s+(de|d'|of|of')\s+[\p{L}'’-]+\s+en\s+(belier|bélier|taureau|gemeaux|gémeaux|cancer|lion|vierge|balance|scorpion|sagittaire|capricorne|verseau|poissons|poisson|aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces)/iu.test(labelLower)
              const isAstroType = isAstro || isPlanetInSign
              
              // Déterminer la position de la bulle pour Duo relationnel - RÈGLES STRICTES
              let positionStyle = styles.dialogueBubbleAstro
              let contentStyle = styles.dialogueBubbleAstroContent
              const youNameLower = (youName || '').toLowerCase().trim()
              const partnerNameLower = (partnerName || '').toLowerCase().trim()
              const speakerNameLower = speaker.toLowerCase().trim()
              
              // RÈGLE 1 : Astrologie = largeur complète
              if (isAstro) {
                positionStyle = styles.dialogueBubbleFullWidth
                contentStyle = styles.dialogueBubbleFullWidthContent
              } else {
                // RÈGLE 2 : Vérifier si c'est la personne principale (gauche) ou l'autre personne (droite)
                // Vérifier d'abord si c'est le prénom directement
                const isYouName = youNameLower && speakerNameLower === youNameLower
                const isPartnerName = partnerNameLower && speakerNameLower === partnerNameLower
                
                // Vérifier si c'est un placement de la personne principale
                const isYouPlacement = youNameLower && (
                  speakerNameLower.includes(` de ${youNameLower}`) ||
                  speakerNameLower.includes(` d'${youNameLower}`) ||
                  speakerNameLower.includes(` of ${youNameLower}`)
                )
                
                // Vérifier si c'est un placement de l'autre personne
                const isPartnerPlacement = partnerNameLower && (
                  speakerNameLower.includes(` de ${partnerNameLower}`) ||
                  speakerNameLower.includes(` d'${partnerNameLower}`) ||
                  speakerNameLower.includes(` of ${partnerNameLower}`)
                )
                
                // RÈGLE STRICTE : Personne principale = gauche, Autre personne = droite
                if (isYouName || isYouPlacement) {
                  positionStyle = styles.dialogueBubbleLeft
                  contentStyle = styles.dialogueBubbleLeftContent
                } else if (isPartnerName || isPartnerPlacement) {
                  positionStyle = styles.dialogueBubbleRight
                  contentStyle = styles.dialogueBubbleRightContent
                } else {
                  // Par défaut si on ne peut pas déterminer (ne devrait pas arriver avec les règles strictes)
                  positionStyle = styles.dialogueBubbleFullWidth
                  contentStyle = styles.dialogueBubbleFullWidthContent
                }
              }
                
                return (
                  <View
                    key={index}
                    wrap={false}
                    style={[
                      styles.dialogueBubbleContainer,
                      positionStyle,
                    ]}
                    minPresenceAhead={50}
                  >
                    <Text
                      style={[
                        styles.dialogueBubbleSpeaker,
                        !isAstroType ? styles.dialogueBubbleUserSpeaker : null,
                        { fontWeight: 'bold' },
                      ]}
                    >
                      {speaker}
                    </Text>
                  <View
                    style={[
                      styles.dialogueBubbleContent,
                      contentStyle,
                    ]}
                    >
                      <Text style={styles.dialogueBubbleText}>
                        {preventLineBreakAfterPunctuation(content)}
                      </Text>
                    </View>
                  </View>
                )
              }
              
              // Détecter et formater les 3 gestes relationnels ultra concrets (format simple)
              // Chercher les patterns avec numérotation (1., 2., 3.)
              if (block.text && /\d+\./.test(block.text)) {
                // Séparer les gestes par numéros (1., 2., 3.)
                const parts = block.text.split(/(?=^\d+\.)/m)
                let gestes: Array<{ number: string; title: string; description: string }> = []
                
                for (const part of parts) {
                  const trimmed = part.trim()
                  if (!trimmed || /^\d+\.\s*$/.test(trimmed)) continue
                  
                  // Détecter le numéro au début
                  const numMatch = trimmed.match(/^(\d+)\.\s*/)
                  if (!numMatch) continue
                  
                  const num = numMatch[1]
                  let rest = trimmed.substring(numMatch[0].length).trim()
                  
                  // Séparer titre et description (titre avant ":", description après)
                  const titleMatch = rest.match(/^([^:\n]+?):\s*(.+)$/s)
                  if (titleMatch) {
                    gestes.push({
                      number: num,
                      title: titleMatch[1].trim(),
                      description: titleMatch[2].trim()
                    })
                  } else {
                    // Si pas de ":", tout le texte est la description
                    gestes.push({
                      number: num,
                      title: '',
                      description: rest
                    })
                  }
                }
                
                // Si on a trouvé au moins 2 gestes, les formater simplement
                if (gestes.length >= 2 && gestes.length <= 5) {
                  return (
                    <View key={index} style={{ marginTop: 12, marginBottom: 8 }}>
                      {gestes.map((geste, idx) => (
                        <Text key={idx} style={[styles.paragraph, { marginBottom: 6 }]}>
                          <Text style={{ fontWeight: 'bold' }}>{geste.number}.</Text> {geste.title ? <Text style={{ fontWeight: 'bold' }}>{geste.title} : </Text> : ''}{preventLineBreakAfterPunctuation(geste.description)}
                        </Text>
                      ))}
                    </View>
                  )
                }
              }
              
              // Détecter "Phrase-signature Orbital" et le remplacer par "Orbital" + phrase comme conclusion
              const signatureMatch = block.text.match(/^Phrase-signature\s+Orbital\s*:\s*(.+)$/i)
              if (signatureMatch) {
                const phrase = signatureMatch[1].trim()
                return (
                  <View key={index} style={{ marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: GOLD, borderTopStyle: 'solid', opacity: 0.3 }}>
                    <Text style={[styles.footer, { fontSize: 14, fontWeight: 'bold', marginBottom: 4 }]}>
                      Orbital
                    </Text>
                    <Text style={[styles.paragraph, { fontStyle: 'italic', fontSize: 13, color: TEXT_BLACK }]}>
                      {preventLineBreakAfterPunctuation(phrase)}
                    </Text>
                  </View>
                )
              }
              
              // Sinon, texte normal
              return (
                <Text key={index} style={styles.paragraph}>
                  {preventLineBreakAfterPunctuation(block.text)}
                </Text>
              )
            })}

            <Text style={styles.footer}>
              Orbital
            </Text>
            
            {/* Phrase de divertissement */}
            <Text style={[styles.footer, { marginTop: 8, fontSize: 8, fontStyle: 'italic' }]}>
              {t.valentine.disclaimer}
            </Text>
          </View>
        </View>

        <Text style={styles.pagination} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  )
}
