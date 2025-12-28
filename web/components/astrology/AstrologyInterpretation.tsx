'use client'

import { useState, useEffect } from 'react'
import { useSettingsStore } from '@/lib/store'
import { apiClient } from '@/lib/api'
import { translateSign } from './signTranslations'
import { useTranslation } from '@/lib/useTranslation'

interface AstrologyInterpretationProps {
  planets: Record<string, { sign: string; house: number }>
  aspects: Array<{ planet1: string; planet2: string; type: string }>
  ascendant: string
  sunSign: string
  moonSign: string
}

export default function AstrologyInterpretation({
  planets,
  aspects,
  ascendant,
  sunSign,
  moonSign,
}: AstrologyInterpretationProps) {
  const settings = useSettingsStore()
  const t = useTranslation()
  const [interpretation, setInterpretation] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const language = (settings.language || 'en') as 'en' | 'fr' | 'es'

  useEffect(() => {
    const generateInterpretation = async () => {
      // API key is now handled by backend
      
      setLoading(true)
      setError(null)

      try {
        // Translate signs to target language
        const sunSignTranslated = translateSign(sunSign, language)
        const moonSignTranslated = translateSign(moonSign, language)
        const ascSignTranslated = translateSign(ascendant, language)

        // Build chart summary organized by house for better analysis
        const planetsByHouse: Record<number, Array<{name: string, sign: string}>> = {}
        Object.entries(planets).forEach(([name, data]) => {
          const house = data.house
          if (!planetsByHouse[house]) {
            planetsByHouse[house] = []
          }
          const signTranslated = translateSign(data.sign, language)
          planetsByHouse[house].push({ name, sign: signTranslated })
        })

        // Format planets by house
        const planetsByHouseSummary = Object.entries(planetsByHouse)
          .sort(([a], [b]) => parseInt(a) - parseInt(b))
          .map(([house, planetList]) => {
            const planetNames = planetList.map(p => `${p.name} (${p.sign})`).join(', ')
            return `${language === 'fr' ? 'Maison' : language === 'es' ? 'Casa' : 'House'} ${house}: ${planetNames}`
          })
          .join('\n')

        // Also keep the simple list for reference
        const planetsSummary = Object.entries(planets)
          .map(([name, data]) => {
            const signTranslated = translateSign(data.sign, language)
            return `${name}: ${signTranslated}, ${language === 'fr' ? 'Maison' : language === 'es' ? 'Casa' : 'House'} ${data.house}`
          })
          .join('\n')

        const aspectsSummary = aspects
          .slice(0, 10)
          .map(
            (a) =>
              `${a.planet1} ${a.type} ${a.planet2}`,
          )
          .join('\n')

        // Always analyze all 12 houses (1..12), even if some are empty.
        // This avoids over-focusing on the (often crowded) 1st house and gives a balanced reading.
        const houses = Array.from({ length: 12 }, (_, i) => i + 1)
        const housesList = houses.join(', ')

        // Create explicit house-by-house analysis template for all houses (including empty ones)
        const houseAnalysisTemplate = houses.map(house => {
          const planetsInHouse = planetsByHouse[house] || []
          const planetNames = planetsInHouse.length
            ? planetsInHouse.map(p => `${p.name} (${p.sign})`).join(', ')
            : 'Aucune planète'
          return `### Maison ${house}\nPlanètes: ${planetNames}\n[Écris 4-5 phrases complètes. Si la maison est vide, explique ce que cela implique (domaine moins accentué / vécu autrement), SANS inventer le signe de cuspide.]`
        }).join('\n\n')

        const systemInstructions = settings.interpretationPrompt || `Tu es un interprète astrologique expert. Génère une interprétation narrative complète et fluide d'un thème natal. Utilise une approche symbolique et psychologique - pas de prédictions. Écris dans un style fluide et accessible aux débutants. 

STRUCTURE OBLIGATOIRE de ta réponse en 7 sections :
1) Portrait général (Soleil/Ascendant/Lune) - maximum 2-3 paragraphes, NE PAS détailler les maisons ici
2) Analyse des maisons astrologiques - C'EST LA SECTION LA PLUS IMPORTANTE. Tu DOIS analyser les 12 maisons (${housesList}) même si certaines sont vides. Tu DOIS suivre EXACTEMENT ce format :

${houseAnalysisTemplate}

Pour chaque maison, écris un paragraphe complet de 4-5 phrases minimum expliquant : quelles planètes s'y trouvent (ou "Aucune planète"), la signification de ce domaine de vie, et comment cela influence la personne. Analyse les maisons dans l'ordre numérique. Donne une attention STRICTEMENT ÉGALE à toutes les maisons. Si une maison est vide, tu dois quand même écrire 4-5 phrases (domaine moins accentué / vécu via d'autres facteurs), SANS inventer le signe de cuspide ou des placements absents.

3) Forces générales - aspects harmonieux et configurations positives
4) Défis potentiels - aspects difficiles et tensions
5) Dynamique émotionnelle - Lune et monde émotionnel
6) Relations - Maison 7 et Vénus principalement
7) Synthèse finale

RÈGLE ABSOLUE: Dans la section "Analyse des maisons astrologiques", tu DOIS écrire un paragraphe de 4-5 phrases pour CHAQUE maison (${housesList}), dans l'ordre numérique, avec un sous-titre ### Maison X. Ne saute aucune maison. Ne te limite pas aux maisons occupées.`

        const languageInstruction = language === 'fr' 
          ? 'Écris en français.' 
          : language === 'es' 
            ? 'Escribe en español.' 
            : 'Write in English.'

        // Build detailed house analysis request for all houses (including empty ones)
        const houseAnalysisRequest = houses.map(house => {
          const planetsInHouse = planetsByHouse[house] || []
          const planetNames = planetsInHouse.length
            ? planetsInHouse.map(p => `${p.name} (${p.sign})`).join(', ')
            : 'Aucune planète'
          const houseMeanings: Record<number, string> = {
            1: 'identité, personnalité, apparence',
            2: 'ressources, valeurs, possessions matérielles',
            3: 'communication, apprentissage, frères et sœurs',
            4: 'foyer, famille, racines, fondations',
            5: 'créativité, enfants, plaisir, expression personnelle',
            6: 'travail quotidien, santé, service, routines',
            7: 'partenariats, mariage, relations proches',
            8: 'transformation, sexualité, ressources partagées, mystères',
            9: 'philosophie, spiritualité, voyages lointains, enseignement supérieur',
            10: 'carrière, réputation publique, statut social, ambitions',
            11: 'amitiés, groupes, espoirs, idéaux collectifs',
            12: 'subconscient, karma, secrets, isolement, spiritualité cachée'
          }
          return `Maison ${house} (${houseMeanings[house] || 'domaine de vie'}): Planètes: ${planetNames}`
        }).join('\n')

        const prompt = `Génère une interprétation astrologique complète et narrative pour ce thème natal :

**Placements principaux :**
- Soleil : ${sunSignTranslated}
- Lune : ${moonSignTranslated}
- Ascendant : ${ascSignTranslated}

**ANALYSE DÉTAILLÉE PAR MAISON (OBLIGATOIRE - analyse CHAQUE maison) :**
${houseAnalysisRequest}

**Liste complète des planètes :**
${planetsSummary}

**Aspects principaux :**
${aspectsSummary || 'Aucun aspect majeur'}

        INSTRUCTIONS CRITIQUES POUR LA SECTION "ANALYSE DES MAISONS" :
        1. Tu DOIS créer une section "Analyse des maisons astrologiques" qui couvre les 12 maisons (${housesList})
        2. Pour CHAQUE maison (même vide), écris un paragraphe complet (minimum 4-5 phrases) avec un sous-titre ### Maison X
        3. Analyse les maisons dans l'ordre numérique (1, 2, 3, 4, etc.)
        4. Donne une attention ÉGALE à toutes les maisons
        5. Pour chaque maison, explique : quelles planètes s'y trouvent (ou "Aucune planète"), la signification de ce domaine de vie, et comment cela influence la personne
        6. Ne saute AUCUNE maison - toutes doivent être analysées avec la même profondeur
        7. Si une maison est vide, n'invente pas le signe de cuspide ni des placements; reste général et psychologique
        8. Structure ta réponse selon les 7 sections demandées dans les instructions système

Génère une interprétation narrative fluide et accessible. Utilise un ton symbolique et psychologique, sans prédictions. ${languageInstruction}`

        const response = await apiClient.ai.interpret(prompt, systemInstructions)

        if (response.error) {
          throw new Error(response.error)
        }

        if (response.data?.content) {
          setInterpretation(response.data.content)
        } else {
          throw new Error('No content received from AI')
        }
      } catch (err: any) {
        console.error('Error generating interpretation:', err)
        setError(err.message || t.interpretation.errorGeneric)
      } finally {
        setLoading(false)
      }
    }

    generateInterpretation()
  }, [planets, aspects, ascendant, sunSign, moonSign, settings.interpretationPrompt, language])

  if (error) {
    return (
      <div className="prose prose-neutral max-w-full leading-relaxed text-white/80">
        <p className="text-red-400">{error}</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="prose prose-neutral max-w-full leading-relaxed text-white/80">
        <p>Generating interpretation...</p>
      </div>
    )
  }

  if (!interpretation) {
    return null
  }

  // Convert markdown to HTML with better parsing
  const convertMarkdownToHTML = (text: string): string => {
    if (!text) return ''
    
    const html = text
    // Split by double newlines first to preserve paragraph structure
    const paragraphs = html.split(/\n\n+/)
    
    const processedParagraphs = paragraphs.map((para) => {
      para = para.trim()
      if (!para) return ''
      
      // Check if it's a header
      if (para.startsWith('### ')) {
        return `<h3>${para.substring(4).trim()}</h3>`
      }
      if (para.startsWith('## ')) {
        return `<h2>${para.substring(3).trim()}</h2>`
      }
      if (para.startsWith('# ')) {
        return `<h1>${para.substring(2).trim()}</h1>`
      }
      
      // Process inline markdown in paragraphs
      let processed = para
      // Convert bold (avoid conflicts with italic)
      processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert italic (single asterisk, not double)
      processed = processed.replace(/(?<!\*)\*([^*]+?)\*(?!\*)/g, '<em>$1</em>')
      // Convert line breaks within paragraph
      processed = processed.replace(/\n/g, '<br/>')
      
      return `<p>${processed}</p>`
    })
    
    return processedParagraphs.filter(p => p).join('')
  }

  return (
    <div className="max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar">
      <div className="prose prose-neutral max-w-full leading-relaxed prose-invert">
        <div
          className="text-white/90 [&>h2]:text-white [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:mt-6 [&>h2]:mb-4 [&>h2]:first:mt-0 [&>h3]:text-white [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:mt-4 [&>h3]:mb-3 [&>p]:text-white/80 [&>p]:mb-4 [&>p]:leading-relaxed [&>p:first-child]:mt-0 [&>ul]:text-white/80 [&>ul]:mb-4 [&>li]:mb-2 [&>strong]:text-white [&>em]:text-white/90"
          dangerouslySetInnerHTML={{
            __html: convertMarkdownToHTML(interpretation),
          }}
        />
      </div>
    </div>
  )
}

