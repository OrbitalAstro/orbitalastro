import React from 'react'
import { Document, Page, StyleSheet, Text, View, Font, Link, Svg, Path } from '@react-pdf/renderer'
import { translations, type Language } from '@/lib/i18n'

const GOLD = '#b8860b'
const GOLD_DARK = '#8b6914'
const TEXT_BLACK = '#000000'

// Enregistrement de la police Great Vibes depuis le dossier public
// Le fichier est téléchargé automatiquement dans public/fonts/GreatVibes-Regular.ttf
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
    backgroundColor: '#ffffff', // Fond blanc
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
    color: GOLD, // Accents en doré par défaut (le corps du texte est forcé en noir)
    flexGrow: 1,
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
    marginBottom: 12,
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
    marginBottom: -4, // Légèrement au-dessus de la ligne de base
  },
  subtitle: {
    fontFamily: 'Times-Roman',
    fontSize: 9,
    color: GOLD_DARK,
    letterSpacing: 4,
    marginTop: 6,
    fontWeight: 'bold',
  },
  paragraph: {
    fontFamily: 'Helvetica',
    fontSize: 14, // Augmenté pour mobile
    lineHeight: 1.6,
    marginBottom: 10,
    textAlign: 'justify',
    color: TEXT_BLACK,
  },
  landing: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 14, // Augmenté pour mobile
    lineHeight: 1.4,
    letterSpacing: 1,
    textAlign: 'center',
    marginVertical: 8,
    color: TEXT_BLACK,
  },
  center: {
    textAlign: 'center',
    marginBottom: 6,
  },
  footnote: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: GOLD_DARK,
    textAlign: 'center',
    marginTop: 10,
  },
  asterisks: {
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: 'Helvetica',
    fontSize: 14, // Augmenté pour mobile
    color: TEXT_BLACK,
  },
  iciMaintenant: {
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Helvetica',
    fontSize: 16, // Augmenté pour mobile
    fontWeight: 'bold',
    color: TEXT_BLACK,
  },
  finalCenter: {
    textAlign: 'center',
  },
  inlineBold: {
    fontFamily: 'Helvetica-Bold',
  },
  inlineScript: {
    fontFamily: greatVibesLoaded ? 'GreatVibes' : 'Times-Italic',
    fontStyle: greatVibesLoaded ? 'normal' : 'italic',
    fontSize: 18,
  },
  finalScript: {
    fontFamily: greatVibesLoaded ? 'GreatVibes' : 'Times-Italic',
    fontStyle: greatVibesLoaded ? 'normal' : 'italic',
    fontSize: 24,
    textAlign: 'center',
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

interface DialoguePdfProps {
  dialogue: string
  language?: Language
  feedbackSurveyUrl?: string
  firstName?: string
}

function renderInlineBold(text: string) {
  return renderRichText(text)
}

function HeartIcon({ color = GOLD, size = 9 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={{ marginLeft: 3, marginTop: 1 }}>
      <Path
        d="M12 21s-7.2-4.7-9.6-8.5C.3 9 .9 5.9 3.6 4.3c2-1.2 4.6-.8 6.1 1l2.3 2.7 2.3-2.7c1.5-1.8 4.1-2.2 6.1-1 2.7 1.6 3.3 4.7 1.2 8.2C19.2 16.3 12 21 12 21z"
        fill={color}
      />
    </Svg>
  )
}

type RichPiece = {
  text: string
  bold?: boolean
  script?: boolean
}

function asNodeArray(value: string | Array<string | React.ReactElement>) {
  return Array.isArray(value) ? value : [value]
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function buildFirstNameRegex(firstName?: string) {
  const trimmed = (firstName || '').trim()
  if (!trimmed) return null
  return new RegExp(`(?<!\\p{L})${escapeRegExp(trimmed)}(?!\\p{L})`, 'giu')
}

function looksLikeLocationLine(text: string) {
  const value = (text || '').trim()
  if (!value || value.length > 80) return false
  if (/[0-9]/.test(value)) return false
  const match = value.match(
    /^([\p{L}][\p{L}'’.\- ]{0,40}),\s*([\p{L}][\p{L}'’.\- ]{0,40}),\s*([\p{L}][\p{L}'’.\- ]{0,40})$/u
  )
  if (!match) return false
  const startsUpper = (part: string) => /^\p{Lu}/u.test(part.trim())
  return startsUpper(match[1]) && startsUpper(match[2]) && startsUpper(match[3])
}

function looksLikeCountdownLine(text: string) {
  const value = (text || '').trim()
  if (!value) return false
  return /\b5\s*[–-]\s*4\s*[–-]\s*3\s*[–-]\s*2\s*[–-]\s*1\b/.test(value)
}

function splitMarkdownBold(text: string): RichPiece[] {
  if (!text.includes('**')) return [{ text }]

  const pieces: RichPiece[] = []
  let cursor = 0
  let bold = false

  while (cursor < text.length) {
    const idx = text.indexOf('**', cursor)
    if (idx === -1) {
      pieces.push({ text: text.slice(cursor), bold })
      break
    }

    if (idx > cursor) {
      pieces.push({ text: text.slice(cursor, idx), bold })
    }

    bold = !bold
    cursor = idx + 2
  }

  return pieces.filter((p) => p.text.length > 0)
}

function applyRegex(
  pieces: RichPiece[],
  regex: RegExp,
  apply: (piece: RichPiece) => RichPiece
): RichPiece[] {
  const out: RichPiece[] = []

  for (const piece of pieces) {
    const text = piece.text
    if (!text) continue

    regex.lastIndex = 0
    let lastIndex = 0
    let match: RegExpExecArray | null

    while ((match = regex.exec(text)) !== null) {
      const start = match.index
      const end = start + match[0].length

      if (start > lastIndex) {
        out.push({ ...piece, text: text.slice(lastIndex, start) })
      }

      out.push(apply({ ...piece, text: match[0] }))
      lastIndex = end

      if (match[0].length === 0) {
        regex.lastIndex++
      }
    }

    if (lastIndex < text.length) {
      out.push({ ...piece, text: text.slice(lastIndex) })
    }
  }

  return out.filter((p) => p.text.length > 0)
}

const forcedBoldPatterns: RegExp[] = [
  /essence\s+de\s+présence/giu,
  /lumière/giu,
  /émotions/giu,
  /Amour,\s*amitié,\s*valeur,\s*sécurité/giu,
  /énergie\s+d[’']action,\s*ta\s+créativité/giu,
  /plus\s+grands\s+talents/giu,
  /(?<!\p{L})chance(?!\p{L})/giu,
  /(?<!\p{L})apprentissage(?!\p{L})/giu,
  /ICI\s+et\s+MAINTENANT/giu,
  /HERE\s+AND\s+NOW/giu,
  /AQU[IÍ]\s+Y\s+AHORA/giu,
]

const scriptTerms = [
  // FR
  'Astrologie',
  // EN/ES
  'Astrology',
  'Astrología',
  'Astrologia',
  'Ascendant',
  'Soleil',
  'Lune',
  'Mercure',
  'Vénus',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturne',
  'Uranus',
  'Neptune',
  'Pluton',
  'Nœud Nord',
  'Noeud Nord',
  'Vertex',
  'Fortune',
  'Part de Fortune',
  'Bélier',
  'Taureau',
  'Gémeaux',
  'Cancer',
  'Lion',
  'Vierge',
  'Balance',
  'Scorpion',
  'Sagittaire',
  'Capricorne',
  'Verseau',
  'Poissons',
  // EN
  'Sun',
  'Moon',
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
  'Uranus',
  'Neptune',
  'Pluto',
  'Ascendant',
  'North Node',
  'Vertex',
  'Fortune',
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
  // ES
  'Sol',
  'Luna',
  'Mercurio',
  'Venus',
  'Marte',
  'Júpiter',
  'Jupiter',
  'Saturno',
  'Urano',
  'Neptuno',
  'Plutón',
  'Pluton',
  'Ascendente',
  'Nodo Norte',
  'Casa',
  'Aries',
  'Tauro',
  'Géminis',
  'Geminis',
  'Cáncer',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Escorpio',
  'Sagitario',
  'Capricornio',
  'Acuario',
  'Piscis',
].sort((a, b) => b.length - a.length)

const scriptTermRegex = new RegExp(
  `(?<!\\p{L})(${scriptTerms.map(escapeRegExp).join('|')})(?!\\p{L})`,
  'giu'
)
const houseRegex = /(?<!\p{L})(Maison|House|Casa)\s*(\d{1,2}|[IVX]{1,6})(?!\p{L})/giu

function renderRichText(text: string, base?: { script?: boolean; extraScriptRegex?: RegExp | null }) {
  const normalized = text.replace(
    /(Enfin,\s*quel\s+sera\s+le\s+)Nord(\s+de\s+la\s+boussole\s+qui\s+guidera\s+ton\s+(?:\u00e9|e)volution)(\s*[?.!])?/giu,
    '$1**Nord**$2$3'
  )
  const baseScript = base?.script ?? false
  let pieces: RichPiece[] = splitMarkdownBold(normalized).map((p) => ({ ...p, script: baseScript }))

  for (const pattern of forcedBoldPatterns) {
    pieces = applyRegex(pieces, new RegExp(pattern.source, pattern.flags), (piece) => ({
      ...piece,
      bold: true,
    }))
  }

  pieces = applyRegex(pieces, new RegExp(houseRegex.source, houseRegex.flags), (piece) => ({
    ...piece,
    script: true,
  }))
  pieces = applyRegex(pieces, new RegExp(scriptTermRegex.source, scriptTermRegex.flags), (piece) => ({
    ...piece,
    script: true,
  }))
  if (base?.extraScriptRegex) {
    pieces = applyRegex(pieces, new RegExp(base.extraScriptRegex.source, base.extraScriptRegex.flags), (piece) => ({
      ...piece,
      script: true,
    }))
  }

  const nodes: Array<string | React.ReactElement> = []
  let key = 0
  for (const piece of pieces) {
    const needsBold = !!piece.bold
    const needsScript = !!piece.script && !needsBold

    if (!needsBold && !needsScript) {
      nodes.push(piece.text)
      continue
    }

    const style = needsBold ? styles.inlineBold : styles.inlineScript
    nodes.push(
      <Text key={`rt-${key++}`} style={style}>
        {piece.text}
      </Text>
    )
  }

  return nodes.length ? nodes : text
}

const speakerLabelBlacklist = new Set(['atterrissage', 'naissance'])

function renderSpeakerLine(
  text: string,
  options?: { baseScript?: boolean; extraScriptRegex?: RegExp | null }
) {
  const match = text.match(/^([^\n:]{2,24})\s*:\s*(.*)$/)
  if (!match) return renderRichText(text, { script: options?.baseScript, extraScriptRegex: options?.extraScriptRegex })

  const label = match[1].trim()
  const rest = match[2] ?? ''

  const labelLower = label.toLowerCase()
  const isAstrologie = labelLower === 'astrologie' || labelLower === 'astrology' || labelLower === 'astrología' || labelLower === 'astrologia'
  const looksLikeFirstName =
    /^[\p{L}'’-]+$/u.test(label) && label.length <= 16 && !speakerLabelBlacklist.has(labelLower)

  if (!isAstrologie && !looksLikeFirstName) {
    return renderRichText(text, { script: options?.baseScript })
  }

  const nodes: Array<string | React.ReactElement> = []
  nodes.push(
    <Text key="spk" style={styles.inlineScript}>
      {label}
    </Text>
  )
  nodes.push(': ')
  nodes.push(
    ...asNodeArray(
      renderRichText(rest, { script: options?.baseScript, extraScriptRegex: options?.extraScriptRegex })
    )
  )
  return nodes
}

export default function DialoguePdf({
  dialogue,
  language = 'fr',
  feedbackSurveyUrl,
  firstName,
}: DialoguePdfProps) {
  const t = translations[language] || translations.fr
  const firstNameRegex = buildFirstNameRegex(firstName)
  const renderText = (text: string, base?: { script?: boolean }) =>
    renderRichText(text, { script: base?.script, extraScriptRegex: firstNameRegex })
  const pdfSubtitle = (t.dialogues.pdfSubtitle || '')
    .replace(/&/g, '-')
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-')
  const paragraphs = (() => {
    const rawDialogue = dialogue || ''
    
    // Log pour déboguer
    console.log('[DialoguePdf] Parsing dialogue:', {
      dialogueType: typeof dialogue,
      dialogueLength: dialogue?.length || 0,
      rawDialogueLength: rawDialogue.length,
      firstChars: rawDialogue.substring(0, 100),
    })
    
    if (!rawDialogue || rawDialogue.trim().length === 0) {
      console.warn('[DialoguePdf] Dialogue vide ou manquant:', { dialogue, rawDialogue })
      return []
    }
    
    const hasBlankLine = /\n\s*\n/.test(rawDialogue)
    const lines = rawDialogue.split(/\r?\n/)
    console.log('[DialoguePdf] Lines count:', lines.length, 'hasBlankLine:', hasBlankLine)
    const result: string[] = []
    let currentParagraph = ''
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Si la ligne est vide, on termine le paragraphe courant
      if (!line) {
        if (currentParagraph) {
          result.push(currentParagraph)
          currentParagraph = ''
        }
        continue
      }
      
      // Détecter les astérisques seuls sur une ligne (plusieurs variantes)
      // Supporte: ***, * * *, *** avec espaces, etc.
      const asteriskPattern = /^\s*\*{3,}\s*$|^\s*\*\s*\*\s*\*\s*$/
      if (asteriskPattern.test(line)) {
        if (currentParagraph) {
          result.push(currentParagraph)
          currentParagraph = ''
        }
        result.push('***') // Marqueur spécial pour les astérisques
        continue
      }
      
      // Détecter "ICI ET MAINTENANT" / "HERE AND NOW" / "AQUÍ Y AHORA" (peut être suivi de texte)
      const lower = line.toLowerCase()
      const isNowSection =
        lower.includes('ici et maintenant') ||
        lower.includes('here and now') ||
        lower.includes('aquí y ahora') ||
        lower.includes('aqui y ahora')
      if (isNowSection) {
        if (currentParagraph) {
          result.push(currentParagraph)
          currentParagraph = ''
        }
        const headerPattern = /(ici\s+et\s+maintenant|here\s+and\s+now|aqui\s+y\s+ahora|aquí\s+y\s+ahora)/i
        if (headerPattern.test(line.trim()) && headerPattern.exec(line.trim())?.index === 0) {
          result.push(line)
        } else {
          const match = line.match(/^(.*?(ici\s+et\s+maintenant|here\s+and\s+now|aqui\s+y\s+ahora|aquí\s+y\s+ahora)[^\s]*)/i)
          if (match) {
            result.push(match[1].trim())
            // Si il y a du texte après, l'ajouter comme paragraphe séparé
            const rest = line.substring(match[0].length).trim()
            if (rest) {
              result.push(rest)
            }
          } else {
            result.push(line)
          }
        }
        continue
      }
      
      // If the dialogue has no blank lines, treat each non-empty line as its own paragraph.
      // This prevents the whole dialogue from being merged into a single block (which can trigger global centering).
      if (!hasBlankLine) {
        if (currentParagraph) {
          result.push(currentParagraph)
          currentParagraph = ''
        }
        result.push(line)
        continue
      }

      // Sinon, ajouter à la ligne courante
      if (currentParagraph) {
        currentParagraph += '\n' + line
      } else {
        currentParagraph = line
      }
    }
    
    // Ajouter le dernier paragraphe
    if (currentParagraph) {
      result.push(currentParagraph)
    }
    
    const cleaned = result.map((p) => {
      // Retirer les marqueurs Markdown (####, ###, ##, #) au début des paragraphes
      let cleaned = p.trim()
      cleaned = cleaned.replace(/^#{1,6}\s+/, '') // Retire #, ##, ###, ####, #####, ###### suivi d'un espace
      return cleaned
    }).filter(Boolean)
    
    console.log('[DialoguePdf] Paragraphs parsed:', {
      originalCount: result.length,
      cleanedCount: cleaned.length,
      firstParagraph: cleaned[0]?.substring(0, 50),
    })
    
    return cleaned
  })()
  const firstFootnoteIndex = paragraphs.findIndex((p) => p.toLowerCase().startsWith('ce dialogue est symbolique'))
  const finalPhraseIndex = firstFootnoteIndex > 0 ? firstFootnoteIndex - 1 : -1
  
  console.log('[DialoguePdf] Final paragraphs count:', paragraphs.length, 'firstFootnoteIndex:', firstFootnoteIndex)

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        {/* Cadre autour de la page */}
        <View style={styles.pageFrame} fixed />
        
        <View style={styles.pageContent}>
          <View style={styles.container}>
          <View style={styles.header}>
            {/* Lignes décoratives en haut */}
            <View style={{ marginBottom: 8 }}>
              <View style={{ height: 1, backgroundColor: GOLD, width: '100%', marginBottom: 2 }} />
              <View style={{ height: 1, backgroundColor: GOLD, width: '100%' }} />
            </View>
            
            <View style={styles.brandLine}>
              <Text style={styles.brandScript}>Orbital</Text>
              <Text style={styles.brandSans}>ASTRO</Text>
            </View>
            <Text style={styles.subtitle}>{pdfSubtitle}</Text>
          </View>

          {paragraphs.map((p, idx) => {
            const lower = p.toLowerCase()
            const trimmed = p.trim()
            
            // Détecter les astérisques (***) - centrer (plusieurs variantes)
            const isAsterisks = 
              trimmed === '***' || 
              trimmed === '* * *' || 
              /^\s*\*{3,}\s*$/.test(trimmed) ||
              /^\s*\*\s*\*\s*\*\s*$/.test(trimmed)
            
            // Détecter "ICI ET MAINTENANT" / "HERE AND NOW" / "AQUÍ Y AHORA"
            const isIciMaintenant = (() => {
              const lowerTrim = trimmed.toLowerCase()
              const isFr =
                lowerTrim === 'ici et maintenant' ||
                lowerTrim.startsWith('ici et maintenant') ||
                /^ici\s+et\s+maintenant/i.test(trimmed) ||
                (lowerTrim.includes('ici et maintenant') && trimmed.length < 200 && trimmed.split('\n').length <= 3)
              const isEn =
                lowerTrim === 'here and now' ||
                lowerTrim.startsWith('here and now') ||
                /^here\s+and\s+now/i.test(trimmed) ||
                (lowerTrim.includes('here and now') && trimmed.length < 200 && trimmed.split('\n').length <= 3)
              const isEs =
                lowerTrim === 'aquí y ahora' ||
                lowerTrim === 'aqui y ahora' ||
                lowerTrim.startsWith('aquí y ahora') ||
                lowerTrim.startsWith('aqui y ahora') ||
                /^aqu[ií]\s+y\s+ahora/i.test(trimmed) ||
                ((lowerTrim.includes('aquí y ahora') || lowerTrim.includes('aqui y ahora')) &&
                  trimmed.length < 200 &&
                  trimmed.split('\n').length <= 3)
              return isFr || isEn || isEs
            })()
            
            const isLandingPhrase =
              lower.includes('les énergies se rassemblent') ||
              lower.includes('les vibrations se calibrent') ||
              lower.includes('ta matière prend forme') ||
              lower.includes('the energies gather') ||
              lower.includes('the vibrations calibrate') ||
              lower.includes('your matter takes form') ||
              lower.includes('las energías se reúnen') ||
              lower.includes('las energias se reunen')
            const isLandingLabel = /\b(?:atterrissage|landing|aterrizaje)\s*:/i.test(trimmed)
            const isLanding = isLandingPhrase || looksLikeCountdownLine(trimmed) || looksLikeLocationLine(trimmed) || isLandingLabel
            const isFootnote =
              lower.startsWith('ce dialogue est symbolique')

            if (isAsterisks) {
              return (
                <Text key={idx} style={styles.asterisks}>
                  ***
                </Text>
              )
            }

            if (isIciMaintenant) {
              const iciMatch = p.match(/^(.*?(ici\s+et\s+maintenant|here\s+and\s+now|aqui\s+y\s+ahora|aquí\s+y\s+ahora)[^\s]*)/i)
              const iciText = iciMatch ? iciMatch[1].trim() : p
              
              return (
                <View key={idx} style={{ marginBottom: 10 }}>
                  <Text style={styles.iciMaintenant}>
                    {renderText(iciText)}
                  </Text>
                  {iciMatch && p.length > iciMatch[0].length && (
                    <Text style={styles.paragraph}>
                      {renderText(p.substring(iciMatch[0].length).trim())}
                    </Text>
                  )}
                </View>
              )
            }

            if (isLanding) {
              return (
                <Text key={idx} style={styles.landing}>
                  {renderSpeakerLine(p, { extraScriptRegex: firstNameRegex })}
                </Text>
              )
            }

            if (isFootnote) {
              return (
                <Text key={idx} style={styles.footnote}>
                  {renderSpeakerLine(p, { extraScriptRegex: firstNameRegex })}
                </Text>
              )
            }

            // Détecter les dialogues (qui commencent par "Astrologie" ou un prénom suivi de ":")
            const speakerMatch = trimmed.match(/^([^\n:]{2,24})\s*:\s*(.*)$/)
            const isDialogue = (() => {
              if (!speakerMatch) return false
              const label = speakerMatch[1].trim()
              const labelLower = label.toLowerCase()
              const isAstro =
                labelLower === 'astrologie' ||
                labelLower === 'astrology' ||
                labelLower === 'astrología' ||
                labelLower === 'astrologia'
              const looksLikeFirstName =
                /^[\p{L}'’-]+$/u.test(label) && label.length <= 16 && !speakerLabelBlacklist.has(labelLower)
              return isAstro || looksLikeFirstName
            })()
            
            // Si c'est un dialogue, rendre comme une bulle
            if (isDialogue && speakerMatch) {
              const speaker = speakerMatch[1].trim()
              const content = speakerMatch[2].trim()
              const labelLower = speaker.toLowerCase()
              const isAstro =
                labelLower === 'astrologie' ||
                labelLower === 'astrology' ||
                labelLower === 'astrología' ||
                labelLower === 'astrologia'
              
              return (
                <View
                  key={idx}
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
                      {renderText(content, { script: false })}
                    </Text>
                  </View>
                </View>
              )
            }
            
            const isCenter =
              !isDialogue &&
              p.length < 90 &&
              (looksLikeCountdownLine(p) ||
                /\d{1,2}\s+\w+\s+\d{2,4}/i.test(p) ||
                // Centrer seulement les lignes type "ville, région, pays" (2 virgules), pas les phrases normales.
                looksLikeLocationLine(p))

            return (
              <Text
                key={idx}
                style={[
                  styles.paragraph,
                  isCenter ? styles.center : null,
                  idx === finalPhraseIndex ? styles.finalScript : null,
                  idx === finalPhraseIndex ? styles.finalCenter : null,
                ]}
              >
                {renderSpeakerLine(p, { baseScript: idx === finalPhraseIndex, extraScriptRegex: firstNameRegex })}
              </Text>
            )
          })}

          {!paragraphs.some((p) =>
            p.toLowerCase().startsWith('ce dialogue est symbolique')
          ) && (
            <Text style={styles.footnote}>{renderText(t.dialogues.disclaimer)}</Text>
          )}

          {feedbackSurveyUrl && t.dialogues.feedbackPrompt && (
            <View style={{ marginTop: 10 }}>
              {(() => {
                const raw = t.dialogues.feedbackPrompt || ''
                const lines = raw.split(/\r?\n/)
                const first = (lines[0] || '').replace(/[♡♥]/g, '').trimEnd()
                const hasHeart = /[♡♥]/.test(lines[0] || '')
                const rest = lines.slice(1).join('\n')

                return (
                  <>
                    {hasHeart ? (
                      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                        <Text style={styles.footnote}>{renderText(first)}</Text>
                        <HeartIcon />
                      </View>
                    ) : (
                      <Text style={styles.footnote}>{renderText(raw)}</Text>
                    )}
                    {!!rest.trim() && <Text style={styles.footnote}>{renderText(rest)}</Text>}
                  </>
                )
              })()}
              {t.dialogues.feedbackLinkLabel && (
                <Text style={styles.footnote}>
                  <Link src={feedbackSurveyUrl} style={{ color: GOLD, textDecoration: 'underline' }}>
                    {t.dialogues.feedbackLinkLabel}
                  </Link>
                </Text>
              )}
              {t.dialogues.feedbackPromo && <Text style={styles.footnote}>{renderText(t.dialogues.feedbackPromo)}</Text>}
              {t.dialogues.feedbackCta && <Text style={styles.footnote}>{renderText(t.dialogues.feedbackCta)}</Text>}
            </View>
          )}
          </View>
        </View>
        
        {/* Pagination */}
        <Text
          style={styles.pagination}
          render={({ pageNumber, totalPages }) =>
            `${pageNumber} / ${totalPages}`
          }
          fixed
        />
      </Page>
    </Document>
  )
}
