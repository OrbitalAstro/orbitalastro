'use client'

import { useState, useEffect } from 'react'
import { useSettingsStore } from '@/lib/store'
import { callGemini } from '@/lib/gemini'
import { signFromLongitude, translateSign } from './signTranslations'
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
      if (!settings.geminiApiKey?.trim()) {
        setError(t.interpretation.apiKeyRequired)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Translate signs to target language
        const sunSignTranslated = translateSign(sunSign, language)
        const moonSignTranslated = translateSign(moonSign, language)
        const ascSignTranslated = translateSign(ascendant, language)

        // Build chart summary
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

        const systemInstructions = settings.interpretationPrompt || "Tu es un interprète astrologique expert. Génère une interprétation narrative complète et fluide d'un thème natal. Utilise une approche symbolique et psychologique - pas de prédictions. Écris dans un style fluide et accessible aux débutants. Structure ta réponse en 6 sections : 1) Portrait général (Soleil/Ascendant/Lune), 2) Forces générales, 3) Défis potentiels, 4) Dynamique émotionnelle, 5) Relations (sans romantisme explicite), 6) Synthèse finale. Utilise des titres de section clairs avec ##."

        const languageInstruction = language === 'fr' 
          ? 'Écris en français.' 
          : language === 'es' 
            ? 'Escribe en español.' 
            : 'Write in English.'

        const prompt = `Génère une interprétation astrologique complète et narrative pour ce thème natal :

**Placements principaux :**
- Soleil : ${sunSignTranslated}
- Lune : ${moonSignTranslated}
- Ascendant : ${ascSignTranslated}

**Planètes et maisons :**
${planetsSummary}

**Aspects principaux :**
${aspectsSummary || 'Aucun aspect majeur'}

Génère une interprétation narrative fluide et accessible, structurée en 6 sections comme demandé. Utilise un ton symbolique et psychologique, sans prédictions. ${languageInstruction}`

        const interpretationText = await callGemini(
          settings.geminiApiKey,
          prompt,
          systemInstructions,
          language,
        )

        setInterpretation(interpretationText)
      } catch (err: any) {
        console.error('Error generating interpretation:', err)
        setError(err.message || t.interpretation.errorGeneric)
      } finally {
        setLoading(false)
      }
    }

    generateInterpretation()
  }, [planets, aspects, ascendant, sunSign, moonSign, settings.geminiApiKey, settings.interpretationPrompt, language])

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
        <p>{t.interpretation.generating}</p>
      </div>
    )
  }

  if (!interpretation) {
    return null
  }

  // Convert markdown to HTML with better parsing
  const convertMarkdownToHTML = (text: string): string => {
    if (!text) return ''
    
    let html = text
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

