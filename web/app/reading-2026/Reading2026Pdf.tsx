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
  const match = text.match(/^([^\n:]{2,24})\s*:\s*(.*)$/)
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
  
  if (!isAstrologie && !looksLikeFirstName) {
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

function parseBlocks(markdown: string): Block[] {
  const text = cleanText((markdown || '').replace(/\r\n/g, '\n')).trim()
  if (!text) return []

  const blocks: Block[] = []
  const paragraphs = text.split(/\n{2,}/)

  for (const raw of paragraphs) {
    const chunk = raw.trim()
    if (!chunk) continue

    const lines = chunk.split('\n').map((l) => l.trim()).filter(Boolean)
    if (!lines.length) continue

    for (const line of lines) {
      if (/^#{1,6}\s+/.test(line)) {
        blocks.push({ type: 'heading', text: line.replace(/^#{1,6}\s+/, '').trim() })
        continue
      }
      if (/^(?:[-•*]|\d+\.)\s+/.test(line)) {
        blocks.push({ type: 'bullet', text: line.replace(/^(?:[-•*]|\d+\.)\s+/, '').trim() })
        continue
      }
      blocks.push({ type: 'paragraph', text: line })
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

  let blocks = parseBlocks(reading)
  
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
            // Vérifier si c'est un dialogue et appliquer le formatage
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
