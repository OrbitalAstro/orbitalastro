import React, { useMemo } from 'react'
import { Document, Page, StyleSheet, Text, View, Font, Link, Svg, Path } from '@react-pdf/renderer'
import { translations, type Language } from '@/lib/i18n'

const GOLD = '#b8860b'
const GOLD_DARK = '#8b6914'
const TEXT_BLACK = '#000000'

// Enregistrement de la police Great Vibes depuis le dossier public
// Le fichier est téléchargé automatiquement dans public/fonts/GreatVibes-Regular.ttf
let greatVibesLoaded = false
try {
  // Dans Next.js, les fichiers public sont servis depuis la racine
  // On construit l'URL complète pour react-pdf
  const getFontUrl = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/fonts/GreatVibes-Regular.ttf`
    }
    // Fallback pour le serveur (utilisé lors du SSR)
    return 'http://localhost:3000/fonts/GreatVibes-Regular.ttf'
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
    color: GOLD, // Accents en doré par défaut (le corps du texte est forcé en noir)
    flex: 1,
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
    fontSize: 12,
    lineHeight: 1.6,
    marginBottom: 10,
    textAlign: 'justify',
    color: TEXT_BLACK,
  },
  landing: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 12,
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
    fontSize: 12,
    color: TEXT_BLACK,
  },
  iciMaintenant: {
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Helvetica',
    fontSize: 14,
    fontWeight: 'bold',
    color: TEXT_BLACK,
  },
  inlineBold: {
    fontFamily: 'Helvetica-Bold',
  },
})

interface DialoguePdfProps {
  dialogue: string
  language?: Language
  feedbackSurveyUrl?: string
}

function renderInlineBold(text: string) {
  if (!text.includes('**')) return text

  const nodes: Array<string | React.ReactElement> = []
  let cursor = 0
  let key = 0

  while (cursor < text.length) {
    const start = text.indexOf('**', cursor)
    if (start === -1) break

    const end = text.indexOf('**', start + 2)
    if (end === -1) break

    if (start > cursor) {
      nodes.push(text.slice(cursor, start))
    }

    const boldText = text.slice(start + 2, end)
    if (boldText) {
      nodes.push(
        <Text key={`b-${key++}`} style={styles.inlineBold}>
          {boldText}
        </Text>
      )
    }

    cursor = end + 2
  }

  if (cursor < text.length) {
    nodes.push(text.slice(cursor))
  }

  return nodes.length ? nodes : text
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

export default function DialoguePdf({
  dialogue,
  language = 'fr',
  feedbackSurveyUrl,
}: DialoguePdfProps) {
  const t = translations[language] || translations.fr
  const pdfSubtitle = (t.dialogues.pdfSubtitle || '')
    .replace(/&/g, '-')
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-')
  const paragraphs = useMemo(() => {
    // Diviser par double retour à la ligne, mais aussi traiter les lignes individuelles
    const lines = (dialogue || '').split(/\n/)
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
      
      // Détecter "ICI ET MAINTENANT" ou "ICI et MAINTENANT" (peut être suivi de texte)
      const lower = line.toLowerCase()
      if (lower.includes('ici et maintenant')) {
        if (currentParagraph) {
          result.push(currentParagraph)
          currentParagraph = ''
        }
        // Si la ligne commence par "ICI et MAINTENANT", on la garde telle quelle
        // Sinon, on extrait juste la partie "ICI et MAINTENANT"
        if (/^ici\s+et\s+maintenant/i.test(line.trim())) {
          result.push(line) // Garder la ligne complète si elle commence par ICI et MAINTENANT
        } else {
          // Extraire juste "ICI et MAINTENANT" de la ligne
          const match = line.match(/^(.*?ici\s+et\s+maintenant[^\s]*)/i)
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
    
    return result.map((p) => {
      // Retirer les marqueurs Markdown (####, ###, ##, #) au début des paragraphes
      let cleaned = p.trim()
      cleaned = cleaned.replace(/^#{1,6}\s+/, '') // Retire #, ##, ###, ####, #####, ###### suivi d'un espace
      return cleaned
    }).filter(Boolean)
  }, [dialogue])

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
            
            // Détecter "ICI ET MAINTENANT" ou "ICI et MAINTENANT" - centrer (plusieurs variantes)
            // Peut être suivi de texte, donc on vérifie si ça commence par "ICI et MAINTENANT"
            const isIciMaintenant = 
              lower === 'ici et maintenant' ||
              lower.startsWith('ici et maintenant') ||
              /^ici\s+et\s+maintenant/i.test(trimmed) ||
              (lower.includes('ici et maintenant') && trimmed.length < 200 && trimmed.split('\n').length <= 3)
            
            const isLanding =
              lower.includes('les énergies se rassemblent') ||
              lower.includes('les vibrations se calibrent') ||
              lower.includes('ta matière prend forme') ||
              lower.includes('atterrissage')
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
              // Extraire juste "ICI et MAINTENANT" si suivi de texte
              const iciMatch = p.match(/^(.*?ici\s+et\s+maintenant[^\s]*)/i)
              const iciText = iciMatch ? iciMatch[1].trim() : p
              
              return (
                <View key={idx} style={{ marginBottom: 10 }}>
                  <Text style={styles.iciMaintenant}>
                    {renderInlineBold(iciText)}
                  </Text>
                  {iciMatch && p.length > iciMatch[0].length && (
                    <Text style={styles.paragraph}>
                      {renderInlineBold(p.substring(iciMatch[0].length).trim())}
                    </Text>
                  )}
                </View>
              )
            }

            if (isLanding) {
              return (
                <Text key={idx} style={styles.landing}>
                  {renderInlineBold(p)}
                </Text>
              )
            }

            if (isFootnote) {
              return (
                <Text key={idx} style={styles.footnote}>
                  {renderInlineBold(p)}
                </Text>
              )
            }

            // Exclure les phrases de dialogue (qui commencent par "Astrologie" ou un prénom suivi de ":")
            const isDialogue = /^(Astrologie|Isa|Isabelle|[\w]+\s*):/.test(trimmed)
            
            const isCenter =
              !isDialogue &&
              p.length < 90 &&
              (/\d\s*[–-]\s*\d/.test(p) ||
                /\d{1,2}\s+\w+\s+\d{2,4}/i.test(p) ||
                (p.includes(',') && p.length < 80 && !p.toLowerCase().includes('astrologie')))

            return (
              <Text
                key={idx}
                style={[styles.paragraph, isCenter ? styles.center : null]}
              >
                {renderInlineBold(p)}
              </Text>
            )
          })}

          {!paragraphs.some((p) =>
            p.toLowerCase().startsWith('ce dialogue est symbolique')
          ) && (
            <Text style={styles.footnote}>{renderInlineBold(t.dialogues.disclaimer)}</Text>
          )}

          {feedbackSurveyUrl && (
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
                        <Text style={styles.footnote}>{renderInlineBold(first)}</Text>
                        <HeartIcon />
                      </View>
                    ) : (
                      <Text style={styles.footnote}>{renderInlineBold(raw)}</Text>
                    )}
                    {!!rest.trim() && <Text style={styles.footnote}>{renderInlineBold(rest)}</Text>}
                  </>
                )
              })()}
              <Text style={styles.footnote}>
                <Link src={feedbackSurveyUrl} style={{ color: GOLD, textDecoration: 'underline' }}>
                  {t.dialogues.feedbackLinkLabel}
                </Link>
              </Text>
              <Text style={styles.footnote}>{renderInlineBold(t.dialogues.feedbackPromo)}</Text>
              <Text style={styles.footnote}>{renderInlineBold(t.dialogues.feedbackCta)}</Text>
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
