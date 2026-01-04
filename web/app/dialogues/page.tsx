'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Sparkles } from 'lucide-react'
import { useSettingsStore } from '@/lib/store'
import { apiClient } from '@/lib/api'
import ReactMarkdown from 'react-markdown'
import { Fragment } from 'react'
import LocationInput from '@/components/LocationInput'
import BackButton from '@/components/BackButton'
// Removed generateDialogue import
import { useTranslation } from '@/lib/useTranslation'
import { generateDialoguePrompt } from './generatePrompt'
import { formatBirthDateInput } from '@/lib/sanitizeBirthDateYear'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { pdf } from '@react-pdf/renderer'
import DialoguePdf from './DialoguePdf'

const FEEDBACK_SURVEY_URL = 'https://forms.gle/eyPRR4Bicf32dCGg6'

export default function Dialogues() {
  const settings = useSettingsStore()
  const t = useTranslation()
  const exportRef = useRef<HTMLDivElement>(null)
  const [birthData, setBirthData] = useState({
    birth_date: settings.defaultBirthDate || '',
    birth_time: settings.defaultBirthTime || '12:00',
    birth_place: '',
    firstName: settings.defaultFirstName || '',
    latitude: settings.defaultLatitude || 0,
    longitude: settings.defaultLongitude || 0,
    timezone: settings.defaultTimezone || 'UTC',
  })

  const [dialogue, setDialogue] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const resetForm = () => {
    setBirthData({
      birth_date: settings.defaultBirthDate || '',
      birth_time: settings.defaultBirthTime || '12:00',
      birth_place: '',
      firstName: settings.defaultFirstName || '',
      latitude: settings.defaultLatitude || 0,
      longitude: settings.defaultLongitude || 0,
      timezone: settings.defaultTimezone || 'UTC',
    })
    setDialogue(null)
  }

  const handleDownloadPdf = async () => {
    if (!dialogue) return
    setDownloading(true)
    try {
      // Précharger la police Great Vibes avant de générer le PDF
      const { Font } = await import('@react-pdf/renderer')
      const fontUrl = `${window.location.origin}/fonts/GreatVibes-Regular.ttf`
      
      // Vérifier que la police est accessible avant de l'enregistrer
      try {
        const fontResponse = await fetch(fontUrl, { method: 'HEAD' })
        if (fontResponse.ok) {
          Font.register({
            family: 'GreatVibes',
            src: fontUrl,
          })
          console.log('Great Vibes font registered successfully')
        } else {
          console.warn('Font file not accessible, using fallback')
        }
      } catch (fontError) {
        console.warn('Font registration failed, using fallback:', fontError)
        // Continue sans la police personnalisée, le PDF utilisera une police par défaut
      }
      
      // Générer le PDF avec un timeout pour éviter les blocages
      const lang = (settings.language || 'fr') as 'en' | 'fr' | 'es'
      const pdfPromise = pdf(
        <DialoguePdf dialogue={dialogue} language={lang} feedbackSurveyUrl={FEEDBACK_SURVEY_URL} />
      ).toBlob()
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('PDF generation timeout')), 30000)
      )
      
      const blob = await Promise.race([pdfPromise, timeoutPromise]) as Blob
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const baseName =
        t.locale === 'fr'
          ? 'dialogue-pre-incarnation'
          : t.locale === 'es'
            ? 'dialogo-pre-encarnacion'
            : 'pre-incarnation-dialogue'
      const defaultName = t.locale === 'fr' ? 'lecture' : t.locale === 'es' ? 'lectura' : 'reading'
      link.download = `${baseName}-${birthData.firstName || defaultName}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('Error generating PDF', err)
      const errorMessage = err?.message || err?.toString() || 'Erreur inconnue'
      // Message d'erreur plus informatif
      const userMessage = errorMessage.includes('timeout') 
        ? (t.locale === 'fr'
            ? 'La génération du PDF prend trop de temps. Veuillez réessayer.'
            : t.locale === 'es'
              ? 'La generación del PDF tarda demasiado. Inténtalo de nuevo.'
              : 'PDF generation is taking too long. Please try again.')
        : errorMessage.includes('fetch') || errorMessage.includes('Failed to fetch')
        ? (t.locale === 'fr'
            ? 'Impossible de charger les ressources nécessaires. Vérifiez votre connexion et réessayez.'
            : t.locale === 'es'
              ? 'No se pudieron cargar los recursos necesarios. Verifica tu conexión e inténtalo de nuevo.'
              : 'Unable to load required resources. Please check your connection and try again.')
        : (t.locale === 'fr'
            ? `Échec de la génération du PDF: ${errorMessage}`
            : t.locale === 'es'
              ? `Error al generar el PDF: ${errorMessage}`
              : `Failed to generate PDF: ${errorMessage}`)
      alert(userMessage)
    } finally {
      setDownloading(false)
    }
  }

  const handleGenerateDialogue = async () => {
    // API key check moved to backend

    setLoading(true)
    try {
      // Validate required fields
      if (!birthData.birth_date || !birthData.birth_time) {
        alert(t.dialogues.validationBirthDateTimeRequired)
        setLoading(false)
        return
      }

      if (!birthData.latitude || !birthData.longitude) {
        alert(t.dialogues.validationBirthPlaceRequired)
        setLoading(false)
        return
      }

      // Get natal chart first
      console.log('Requesting natal chart...', {
        birth_date: birthData.birth_date,
        birth_time: birthData.birth_time,
        latitude: birthData.latitude,
        longitude: birthData.longitude,
        timezone: birthData.timezone,
      })

      const chartResponse = await apiClient.natal.calculate({
        birth_date: birthData.birth_date,
        birth_time: birthData.birth_time,
        birth_place: birthData.birth_place,
        latitude: birthData.latitude,
        longitude: birthData.longitude,
        timezone: birthData.timezone || 'UTC',
        birth_city: birthData.birth_place || undefined,
        house_system: settings.houseSystem || 'placidus',
        include_aspects: true,
        // Required for "Chance" (Fortune + Vertex). Force it on for dialogues.
        include_extra_objects: true,
      })
      
      if (chartResponse.error) {
        throw new Error(chartResponse.error)
      }
      
      const chart = chartResponse.data
      
      if (!chart) {
        throw new Error('Chart response is empty')
      }

      const hasFortune = typeof chart?.extra_objects?.part_of_fortune === 'number'
      const hasVertex = typeof chart?.extra_objects?.vertex === 'number'
      const hasHouses = !!chart?.houses && typeof chart.houses === 'object'

      if (!hasFortune || !hasVertex || !hasHouses) {
        console.error('Chart missing required data for Chance (Fortune/Vertex):', {
          hasFortune,
          hasVertex,
          hasHouses,
          extra_objects: chart?.extra_objects,
          housesKeys: chart?.houses ? Object.keys(chart.houses) : null,
        })
        throw new Error('Fortune/Vertex manquants dans la réponse du backend. Vérifie include_extra_objects et la connexion à l’API.')
      }
       
      console.log('Chart received:', {
        hasPlanets: !!chart?.planets,
        hasAspects: !!chart?.aspects,
        planetCount: chart?.planets ? Object.keys(chart.planets).length : 0,
        aspectCount: chart?.aspects ? chart.aspects.length : 0,
      })

      if (!chart.planets) {
        throw new Error('Chart response missing planets data')
      }
      
      // Generate pre-incarnation dialogue using backend AI endpoint
      console.log('Generating dialogue with AI...')
      
      // Generate the structured prompts with all rules
      const lang = (settings.language || 'fr') as 'en' | 'fr' | 'es'
      const { systemPrompt, userPrompt } = generateDialoguePrompt(birthData, chart, undefined, lang)
      
      const response = await apiClient.ai.interpret(userPrompt, systemPrompt)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      const dialogueText = response.data?.content || ''
      
      console.log('Dialogue generated successfully')
      setDialogue(dialogueText)
    } catch (error: any) {
      console.error('Error generating dialogue:', error)
      const errorMsg = error.message || 'Erreur inconnue'
      const userFriendlyMsg = errorMsg.includes('Rate limit') || errorMsg.includes('429')
        ? t.dialogues.rateLimitError
        : t.dialogues.errorGenerating.replace('{error}', errorMsg)
      alert(userFriendlyMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-purple via-magenta-purple to-cosmic-purple relative">
      <Starfield />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <BackButton />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-cosmic-purple to-magenta-purple rounded-xl p-8 border border-cosmic-gold/35 shadow-[0_28px_70px_rgba(0,0,0,0.55)] relative z-10"
        >
          <h1 className="text-3xl font-bold text-cosmic-gold mb-8 flex items-center">
            <MessageSquare className="h-8 w-8 mr-3 text-cosmic-gold" />
            {t.dialogues.title}
          </h1>

          <p className="text-cosmic-gold/90 mb-6">{t.dialogues.description}</p>

          {/* Input Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 relative z-20">
            <div>
              <label className="block text-sm font-medium text-cosmic-gold mb-2">
                {t.dialogues.firstName}
              </label>
              <input
                type="text"
                value={birthData.firstName}
                onChange={(e) => setBirthData({ ...birthData, firstName: e.target.value })}
                placeholder={t.dialogues.firstNamePlaceholder}
                className="w-full px-4 py-2 rounded-lg bg-white/15 border border-cosmic-gold/20 text-cosmic-gold placeholder-cosmic-gold/60 focus:outline-none focus:border-cosmic-gold/70 relative z-20"
                suppressHydrationWarning
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-cosmic-gold mb-2">
                {t.dialogues.birthDate}
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\\d{4}-\\d{2}-\\d{2}"
                value={birthData.birth_date}
                onChange={(e) => {
                  const value = formatBirthDateInput(e.target.value)
                  setBirthData({ ...birthData, birth_date: value })
                }}
                placeholder={t.locale === 'fr' ? 'AAAA-MM-JJ' : 'YYYY-MM-DD'}
                className="w-full px-4 py-2 rounded-lg bg-white/15 border border-cosmic-gold/20 text-cosmic-gold placeholder-cosmic-gold/60 focus:outline-none focus:border-cosmic-gold/70 relative z-20"
                suppressHydrationWarning
              />
              <p className="mt-1 text-xs text-cosmic-gold/70">
                {t.locale === 'fr'
                  ? 'Format : AAAA-MM-JJ (ex : 1976-10-26)'
                  : t.locale === 'es'
                    ? 'Formato: AAAA-MM-DD (ej.: 1976-10-26)'
                    : 'Format: YYYY-MM-DD (e.g., 1976-10-26)'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-cosmic-gold mb-2">
                {t.dialogues.birthTime}
              </label>
              <input
                type="time"
                value={birthData.birth_time}
                onChange={(e) => setBirthData({ ...birthData, birth_time: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/15 border border-cosmic-gold/20 text-cosmic-gold focus:outline-none focus:border-cosmic-gold/70 relative z-20"
                suppressHydrationWarning
              />
            </div>
            <div className="md:col-span-2">
              <LocationInput
                label={t.dialogues.birthPlace}
                value={birthData.birth_place}
                variant="gold"
                onChange={(value) => {
                  // Si la valeur est vide, réinitialiser aussi les coordonnées
                  if (!value || value.trim() === '') {
                    setBirthData({
                      ...birthData,
                      birth_place: '',
                      latitude: 0,
                      longitude: 0,
                      timezone: settings.defaultTimezone || '',
                    })
                  } else {
                    setBirthData({ ...birthData, birth_place: value })
                  }
                }}
                onLocationSelect={(location) => {
                  setBirthData({
                    ...birthData,
                    birth_place: location.name,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    timezone: location.timezone || settings.defaultTimezone || '',
                  })
                }}
                placeholder={t.tooltips.locationSearch}
              />
            </div>
          </div>

          <button
            onClick={handleGenerateDialogue}
            disabled={loading || !birthData.birth_date}
            className="w-full px-6 py-3 bg-gradient-to-r from-cosmic-gold via-rose-gold to-cosmic-gold text-cosmic-purple rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 mb-8 flex items-center justify-center"
          >
            {loading ? (
              <>
                <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                {t.dialogues.generating}
              </>
            ) : (
              <>
                <MessageSquare className="h-5 w-5 mr-2" />
                {t.dialogues.generate}
              </>
            )}
          </button>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="text-sm text-cosmic-gold/80 hover:text-cosmic-gold underline"
              disabled={loading}
            >
              {t.dialogues.resetForm}
            </button>
          </div>

          {/* Dialogue Display */}
          {dialogue && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-cosmic-purple/40 to-magenta-purple/40 rounded-xl p-6 border border-cosmic-gold/20"
            >
              <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-2 mb-4">
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                  className="w-full sm:w-auto px-4 py-2 bg-cosmic-gold/20 text-cosmic-gold rounded-lg border border-cosmic-gold/40 hover:bg-cosmic-gold/30 transition disabled:opacity-50"
                >
                  {downloading ? t.dialogues.downloadingPdf : t.dialogues.downloadPdf}
                </button>
              </div>
              <div className="pdf-card max-w-3xl mx-auto" ref={exportRef}>
                <div className="pdf-header">
                  <img
                    src="/orbital-astro-logo.png"
                    alt="Orbital Astro"
                    className="pdf-logo"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      if (target) target.style.display = 'none'
                    }}
                  />
                  <div className="pdf-brand">
                    <span className="brand-script">Orbital</span>
                    <span className="brand-sans">Astro</span>
                  </div>
                  <div className="pdf-subtitle">{t.dialogues.pdfSubtitle}</div>
                </div>
                <div className="pdf-scroll custom-scrollbar text-cosmic-gold/90">
                  <div className="dialogue-prose px-6 py-4 pdf-body pdf-panel">
                    <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => {
                        const rawText = Array.isArray(props.children)
                          ? props.children.map((c: any) => (typeof c === 'string' ? c : '')).join('').trim()
                          : (props.children as any)?.toString().trim()
                        const lower = (rawText || '').toLowerCase()
                        
                        // Détecter les astérisques (***)
                        const isAsterisks = rawText === '***' || rawText === '* * *' || /^\s*\*{3,}\s*$/.test(rawText || '')
                        
                        // Détecter "ICI ET MAINTENANT" ou "ICI et MAINTENANT" (peut être suivi de texte)
                        const isIciMaintenant = 
                          lower === 'ici et maintenant' ||
                          lower.startsWith('ici et maintenant') ||
                          /^ici\s+et\s+maintenant/i.test(rawText || '') ||
                          (lower.includes('ici et maintenant') && rawText && rawText.length < 200 && /ici\s+et\s+maintenant/i.test(rawText || ''))
                        
                        const isCountdown = /\d\s*[–-]\s*\d/.test(rawText || '')
                        const isDate = /\d{1,2}\s+\w+\s+\d{2,4}/i.test(rawText || '')
                        const isPlace = (rawText || '').includes(',') && (rawText || '').length < 80
                        const isLandingPhrase = lower.includes('les énergies se rassemblent')
                        const center = (rawText || '').length < 120 && (isCountdown || isDate || isPlace || isLandingPhrase)
                        const isLanding = isLandingPhrase || lower.includes('atterrissage')
                        const isFootnote = lower.startsWith('ce dialogue est symbolique')
                        
                        // Si c'est ICI et MAINTENANT suivi de texte, on doit le séparer
                        if (isIciMaintenant && rawText && rawText.length > 20) {
                          const iciMatch = rawText.match(/^(.*?ici\s+et\s+maintenant[^\s]*)/i)
                          if (iciMatch) {
                            const iciText = iciMatch[1].trim()
                            const restText = rawText.substring(iciMatch[0].length).trim()
                            return (
                              <Fragment key={props.key}>
                                <p className="ici-maintenant" style={{ marginBottom: '0.5em' }}>
                                  {iciText}
                                </p>
                                {restText && (
                                  <p className="dialogue-paragraph" style={{ marginTop: '0.5em' }}>
                                    {restText}
                                  </p>
                                )}
                              </Fragment>
                            )
                          }
                        }
                        
                        const cls = [
                          'dialogue-paragraph',
                          (center || isAsterisks || isIciMaintenant) ? 'dialogue-center' : '',
                          isLanding ? 'landing-block' : '',
                          isFootnote ? 'footnote-small' : '',
                          isIciMaintenant ? 'ici-maintenant' : '',
                          isAsterisks ? 'asterisks' : ''
                        ].filter(Boolean).join(' ')
                        return <p {...props} className={cls} />
                      },
                        strong: ({ node, ...props }) => <strong {...props} className="dialogue-strong" />,
                        em: ({ node, ...props }) => <em {...props} className="dialogue-em" />,
                        hr: () => null,
                      }}
                    >
                      {dialogue}
                    </ReactMarkdown>
                  </div>
                </div>
                <div className="pdf-footnote">{t.dialogues.pdfSubtitle}</div>
              </div>
              {/* Note de bas de page */}
              <div className="mt-6 pt-4 border-t border-cosmic-gold/20 text-xs text-cosmic-gold/60 italic text-center footnote-small">
                {t.dialogues.disclaimer}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

function Starfield() {
  const [stars, setStars] = useState<Array<{
    id: number
    x: number
    y: number
    size: number
    duration: number
  }>>([])

  useEffect(() => {
    setStars(
      Array.from({ length: 100 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        duration: Math.random() * 3 + 2,
      }))
    )
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}
