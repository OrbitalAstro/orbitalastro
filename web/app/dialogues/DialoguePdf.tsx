import React, { useMemo } from 'react'
import { Document, Page, StyleSheet, Text, View, Font } from '@react-pdf/renderer'

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
    border: '2 solid #000000', // Noir temporairement (original: '#b8860b' - Doré plus foncé)
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
    color: '#000000', // Noir temporairement (original: '#b8860b' - Doré plus foncé)
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
    color: '#000000', // Noir temporairement (original: '#b8860b' - Doré plus foncé)
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
    color: '#000000', // Noir temporairement (original: '#b8860b' - Doré plus foncé)
    letterSpacing: greatVibesLoaded ? 0.5 : 1.5,
    fontStyle: greatVibesLoaded ? 'normal' : 'italic',
  },
  brandSans: {
    fontFamily: 'Times-Roman',
    fontSize: 16,
    color: '#000000', // Noir temporairement (original: '#8b6914' - Doré foncé)
    letterSpacing: 6,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginLeft: 4,
    marginBottom: -4, // Légèrement au-dessus de la ligne de base
  },
  subtitle: {
    fontFamily: 'Times-Roman',
    fontSize: 9,
    color: '#000000', // Noir temporairement (original: '#8b6914' - Doré foncé)
    letterSpacing: 4,
    textTransform: 'uppercase',
    marginTop: 6,
    fontWeight: 'bold',
  },
  paragraph: {
    fontFamily: 'Helvetica',
    fontSize: 12,
    lineHeight: 1.6,
    marginBottom: 10,
    textAlign: 'justify',
  },
  landing: {
    fontFamily: 'Helvetica-Oblique',
    fontSize: 12,
    lineHeight: 1.4,
    letterSpacing: 1,
    textAlign: 'center',
    marginVertical: 8,
  },
  center: {
    textAlign: 'center',
    marginBottom: 6,
  },
  footnote: {
    fontFamily: 'Helvetica',
    fontSize: 9,
    color: '#000000', // Noir temporairement (original: '#8b6914' - Doré foncé)
    textAlign: 'center',
    marginTop: 10,
  },
  asterisks: {
    textAlign: 'center',
    marginBottom: 6,
    fontFamily: 'Helvetica',
    fontSize: 12,
  },
  iciMaintenant: {
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Helvetica',
    fontSize: 14,
    fontWeight: 'bold',
  },
})

interface DialoguePdfProps {
  dialogue: string
}

export default function DialoguePdf({ dialogue }: DialoguePdfProps) {
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
      
      // Détecter les astérisques seuls sur une ligne
      if (line === '***' || line === '* * *' || /^\*{3,}$/.test(line)) {
        if (currentParagraph) {
          result.push(currentParagraph)
          currentParagraph = ''
        }
        result.push('***') // Marqueur spécial pour les astérisques
        continue
      }
      
      // Détecter "ICI ET MAINTENANT" ou "ICI et MAINTENANT"
      const lower = line.toLowerCase()
      if (lower.includes('ici et maintenant') || lower === 'ici et maintenant') {
        if (currentParagraph) {
          result.push(currentParagraph)
          currentParagraph = ''
        }
        result.push(line) // Garder la ligne telle quelle
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
              <View style={{ height: 1, backgroundColor: '#000000', width: '100%', marginBottom: 2 }} />
              <View style={{ height: 1, backgroundColor: '#000000', width: '100%' }} />
            </View>
            
            <View style={styles.brandLine}>
              <Text style={styles.brandScript}>Orbital</Text>
              <Text style={styles.brandSans}>ASTRO</Text>
            </View>
            <Text style={styles.subtitle}>DIALOGUE PRÉ-INCARNATION</Text>
          </View>

          {paragraphs.map((p, idx) => {
            const lower = p.toLowerCase()
            const trimmed = p.trim()
            
            // Détecter les astérisques (***) - centrer
            const isAsterisks = trimmed === '***' || trimmed === '* * *' || /^\*{3,}$/.test(trimmed)
            
            // Détecter "ICI ET MAINTENANT" ou "ICI et MAINTENANT" - centrer (plusieurs variantes)
            const isIciMaintenant = 
              lower === 'ici et maintenant' ||
              lower.startsWith('ici et maintenant') ||
              /^ici\s+et\s+maintenant/i.test(trimmed)
            
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
              return (
                <Text key={idx} style={styles.iciMaintenant}>
                  {p}
                </Text>
              )
            }

            if (isLanding) {
              return (
                <Text key={idx} style={styles.landing}>
                  {p}
                </Text>
              )
            }

            if (isFootnote) {
              return (
                <Text key={idx} style={styles.footnote}>
                  {p}
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
                {p}
              </Text>
            )
          })}

          {!paragraphs.some((p) =>
            p.toLowerCase().startsWith('ce dialogue est symbolique')
          ) && (
            <Text style={styles.footnote}>
              Ce dialogue est symbolique, un échange interprété pour le plaisir
              et la réflexion : il est offert à des fins de divertissement et
              d’inspiration, sans prétention de vérité absolue ni de certitude.
              OrbitalAstro.ca
            </Text>
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
