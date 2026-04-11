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
import Starfield from '@/components/Starfield'
import Logo from '@/components/Logo'
// Removed generateDialogue import
import { useTranslation } from '@/lib/useTranslation'
import { generateDialoguePrompt } from './generatePrompt'
import { formatBirthDateInput } from '@/lib/sanitizeBirthDateYear'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { pdf } from '@react-pdf/renderer'
import DialoguePdf from './DialoguePdf'
import TextNarrationControls from '@/components/TextNarrationControls'
import { checkAccessFromURL, markProductAsPaid, recordGeneration, checkProductAccess, type AccessResult } from '@/lib/checkPayment'
import { isDevTestBypass, DEV_TEST_ACCESS_RESULT } from '@/lib/devTestMode'
import { useRouter } from 'next/navigation'

const FEEDBACK_SURVEY_URL = 'https://forms.gle/eyPRR4Bicf32dCGg6'
const DIALOGUE_WORD_COUNT_TARGET = 1700

function normalizeGeneratedDialogue(
  raw: string,
  options: { firstName?: string; lang: 'en' | 'fr' | 'es'; age?: number; ascendantSign?: string }
): string {
  const firstName = (options.firstName || '').trim()
  const age = options.age
  const ascendantSign = (options.ascendantSign || '').trim()
  let text = (raw || '').trim()

  if (!text) return text

  if (firstName) {
    text = text.replace(/\[\s*(?:prénom|prenom|first\s*name|firstname|name|nombre)\s*\]/giu, firstName)
    text = text.replace(/\{\{\s*(?:prénom|prenom|first[_\s]*name|firstname|name|nombre)\s*\}\}/giu, firstName)
  }

  if (typeof age === 'number' && Number.isFinite(age) && age > 0) {
    text = text.replace(/\[\s*(?:ÂGE|AGE|EDAD)\s*\]/giu, String(age))
  }
  if (ascendantSign) {
    text = text.replace(/\[\s*(?:ASCENDANT_SIGNE|ASCENDANT_SIGN|SIGNO_ASCENDENTE)\s*\]/giu, ascendantSign)
  }

  const filteredLines = text
    .split(/\r?\n/)
    .filter((line) => {
      const t = line.trim()
      if (!t) return true
      if (t === '***') return true
      if (/^={10,}$/.test(t)) return false
      if (/^(?:INPUT|ENTRADA)\b/i.test(t)) return false
      if (/^(?:RAPPEL FINAL|FINAL REMINDER|RECORDATORIO FINAL)\b/i.test(t)) return false
      if (/^(?:word count|nombre de mots|número de palabras|numero de palabras|first name|prénom|prenom|nombre|birth|naissance|nacimiento)\s*:/i.test(t)) return false
      if (/\b(?:_Signe|_Maison|_Aspect|Talent\d_)\b/.test(t)) return false
      if (/^\[(?:RÔLE|ROLE|TON|RÈGLE|REGLE|VERBATIM|INPUT|RAPPEL|RULE|STRUCTURE)\b/i.test(t)) return false
      if (/^\[[^\]\n]{1,140}\]$/.test(t)) return false
      return true
    })

  text = filteredLines.join('\n')
  // Remove any remaining bracket placeholders to prevent prompt leakage
  text = text.replace(/\[[^\]\n]{1,100}\]/g, '')
  // Collapse only spaces/tabs (preserve newlines so paragraphs keep their formatting)
  text = text.replace(/[ \t]{2,}/g, ' ')

  // Ensure Markdown paragraphs: AI often uses single newlines, but Markdown requires a blank line.
  // Convert line breaks into paragraph breaks to avoid a single mega-paragraph (which can trigger global centering/styles).
  text = text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .join('\n\n')

  // Ensure the landing block starts on its own paragraph
  text = text.replace(/([^\n])\n*(Les énergies se rassemblent)/g, '$1\n\n$2')
  text = text.replace(/([^\n])\s+(Les énergies se rassemblent)/g, '$1\n\n$2')
  text = text.replace(/([^\n])\n*(The energies gather)/g, '$1\n\n$2')
  text = text.replace(/([^\n])\s+(The energies gather)/g, '$1\n\n$2')
  text = text.replace(/([^\n])\n*(Las energías se reúnen)/g, '$1\n\n$2')
  text = text.replace(/([^\n])\s+(Las energías se reúnen)/g, '$1\n\n$2')
  text = text.replace(/([^\n])\n*(Las energias se reunen)/g, '$1\n\n$2')
  text = text.replace(/([^\n])\s+(Las energias se reunen)/g, '$1\n\n$2')
  text = text.replace(/\n{3,}/g, '\n\n').trim()

  return text
}

export default function Dialogues() {
  const settings = useSettingsStore()
  const t = useTranslation()
  const router = useRouter()
  const exportRef = useRef<HTMLDivElement>(null)
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [checkingAccess, setCheckingAccess] = useState(true)
  const [accessInfo, setAccessInfo] = useState<AccessResult | null>(null)
  const [birthData, setBirthData] = useState({
    birth_date: settings.defaultBirthDate || '',
    birth_time: settings.defaultBirthTime || '12:00',
    birth_place: '',
    firstName: settings.defaultFirstName || '',
    email: '',
    latitude: settings.defaultLatitude || 0,
    longitude: settings.defaultLongitude || 0,
    timezone: settings.defaultTimezone || 'UTC',
  })

  const [dialogue, setDialogue] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const pdfSubtitle = t.dialogues.pdfSubtitle
    .replace(/&/g, '-')
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-')

  // Clés pour localStorage
  const STORAGE_KEY = 'orbitalastro_dialogue'
  const STORAGE_EXPIRY_HOURS = 24 // Conserver pendant 24 heures

  // Restaurer le dialogue depuis localStorage au chargement
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const { text, timestamp } = JSON.parse(saved)
        const now = Date.now()
        const expiry = STORAGE_EXPIRY_HOURS * 60 * 60 * 1000 // Convertir en millisecondes
        
        // Vérifier si le texte n'est pas expiré
        if (now - timestamp < expiry && text) {
          console.log('[Dialogues] Restoring dialogue from localStorage')
          setDialogue(text)
        } else {
          // Supprimer si expiré
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch (error) {
      console.error('[Dialogues] Error restoring dialogue from localStorage:', error)
    }
  }, [])

  // Sauvegarder le dialogue dans localStorage quand il change
  useEffect(() => {
    if (dialogue) {
      try {
        const data = {
          text: dialogue,
          timestamp: Date.now(),
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
        console.log('[Dialogues] Dialogue saved to localStorage')
      } catch (error) {
        console.error('[Dialogues] Error saving dialogue to localStorage:', error)
      }
    } else {
      // Supprimer si le dialogue est effacé
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [dialogue])

  // Vérifier l'accès au chargement de la page
  useEffect(() => {
    const checkAccess = async () => {
      if (isDevTestBypass()) {
        setAccessInfo(DEV_TEST_ACCESS_RESULT)
        setHasAccess(true)
        setCheckingAccess(false)
        console.log('[Dialogues] Mode dev local : accès sans paiement')
        return
      }

      // Récupérer l'email depuis localStorage ou le formulaire
      const savedEmail = localStorage.getItem('last_email_dialogue')
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement
      const email = emailInput?.value || savedEmail || null

      const accessResult = await checkAccessFromURL('dialogue')
      setAccessInfo(accessResult)
      setHasAccess(accessResult.hasAccess)
      setCheckingAccess(false)
      
      // S'assurer que le sessionId est stocké dans localStorage pour utilisation ultérieure
      if (accessResult.sessionId) {
        localStorage.setItem('session_dialogue', accessResult.sessionId)
      }
      
      if (accessResult.hasAccess) {
        markProductAsPaid('dialogue')
        // Nettoyer l'URL après un court délai pour permettre le traitement
        setTimeout(() => {
          const url = new URL(window.location.href)
          url.searchParams.delete('purchased')
          const sessionIdParam = url.searchParams.get('session_id')
          if (sessionIdParam) {
            // Stocker le sessionId avant de le retirer de l'URL
            localStorage.setItem('session_dialogue', sessionIdParam)
          }
          url.searchParams.delete('session_id')
          window.history.replaceState({}, '', url.toString())
        }, 500)
      }
    }
    checkAccess()
  }, [])

  const resetForm = () => {
    setBirthData({
      birth_date: settings.defaultBirthDate || '',
      birth_time: settings.defaultBirthTime || '12:00',
      birth_place: '',
      firstName: settings.defaultFirstName || '',
      email: '',
      latitude: settings.defaultLatitude || 0,
      longitude: settings.defaultLongitude || 0,
      timezone: settings.defaultTimezone || 'UTC',
    })
    setDialogue(null)
    setEmailStatus('idle')
    // Supprimer aussi de localStorage lors du reset
    localStorage.removeItem(STORAGE_KEY)
  }

  const sendDialoguePdfByEmail = async (dialogueText: string) => {
    const to = (birthData.email || '').trim()
    if (!to) return

    setEmailStatus('sending')
    try {
      const res = await fetch('/api/email-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'dialogue',
          to,
          language: (settings.language || 'fr') as 'en' | 'fr' | 'es',
          firstName: birthData.firstName || undefined,
          content: dialogueText,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`)

      setEmailStatus('sent')
    } catch (err) {
      console.error('[Dialogues] Failed to email PDF:', err)
      setEmailStatus('error')
    }
  }

  const handleDownloadPdf = async () => {
    if (!dialogue) {
      console.error('[Dialogues] handleDownloadPdf: dialogue is null or empty')
      alert('Aucun dialogue à télécharger. Veuillez générer un dialogue d\'abord.')
      return
    }
    
    console.log('[Dialogues] handleDownloadPdf: Starting PDF generation', {
      dialogueLength: dialogue.length,
      firstChars: dialogue.substring(0, 100),
    })
    
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
      console.log('[Dialogues] Creating PDF component with dialogue length:', dialogue.length)
      const pdfPromise = pdf(
        <DialoguePdf
          dialogue={dialogue}
          language={lang}
          feedbackSurveyUrl={FEEDBACK_SURVEY_URL}
          firstName={birthData.firstName || undefined}
        />
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
          ? 'Dialogue-Avant-atterrissage'
          : t.locale === 'es'
            ? 'Dialogo-Antes-aterrizaje'
            : 'Dialogue-Before-landing'
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
    // Vérifier l'accès avant de générer
    const email = birthData.email?.trim() || null
    if (!email) {
      alert(t.dialogues.validationEmailRequired)
      return
    }

    // Sauvegarder l'email pour la vérification
    localStorage.setItem(`last_email_dialogue`, email)

    const sessionId = accessInfo?.sessionId || localStorage.getItem('session_dialogue') || undefined

    if (!isDevTestBypass()) {
      const accessResult = await checkProductAccess('dialogue', email, sessionId)

      if (!accessResult.hasAccess) {
        if (accessResult.quantityRemaining === 0 && accessResult.quantityPurchased > 0) {
          alert('Vous avez déjà utilisé toutes vos générations. Veuillez commander à nouveau pour générer un autre dialogue.')
        } else {
          alert('Accès non autorisé. Veuillez commander votre accès.')
        }
        router.push('/pricing?redirect=dialogue')
        return
      }

      setAccessInfo(accessResult)
      setHasAccess(accessResult.hasAccess)
    }

    // API key check moved to backend

    setLoading(true)
    setEmailStatus('idle')
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

      if (!birthData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(birthData.email.trim())) {
        alert(t.dialogues.validationEmailRequired)
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
      const { systemPrompt, userPrompt } = generateDialoguePrompt(birthData, chart, DIALOGUE_WORD_COUNT_TARGET, lang)

      const extractedAge = Number(userPrompt.match(/^AGE\s*:\s*(\d+)/m)?.[1] || NaN)
      const extractedAscendantSign = userPrompt.match(/^Ascendant_Signe\s*:\s*(.+)$/m)?.[1]?.trim()
      
      const response = await apiClient.ai.interpret(userPrompt, systemPrompt)
      
      if (response.error) {
        throw new Error(response.error)
      }
      
      const dialogueText = normalizeGeneratedDialogue(response.data?.content || '', {
        firstName: birthData.firstName,
        lang,
        age: Number.isFinite(extractedAge) ? extractedAge : undefined,
        ascendantSign: extractedAscendantSign || undefined,
      })
      
      console.log('Dialogue generated successfully', {
        originalLength: response.data?.content?.length || 0,
        normalizedLength: dialogueText.length,
        firstChars: dialogueText.substring(0, 200),
        lastChars: dialogueText.substring(Math.max(0, dialogueText.length - 200)),
      })
      
      if (!dialogueText || dialogueText.trim().length === 0) {
        throw new Error('Le dialogue généré est vide. Veuillez réessayer.')
      }
      
      console.log('[Dialogues] Setting dialogue state, length:', dialogueText.length)
      setDialogue(dialogueText)
      
      // Vérifier que le dialogue est bien stocké
      setTimeout(() => {
        console.log('[Dialogues] Dialogue state after setState:', dialogue ? dialogue.length : 'null')
      }, 100)
      
      // Envoyer l'email en arrière-plan (ne pas bloquer si ça échoue)
      try {
        await sendDialoguePdfByEmail(dialogueText)
      } catch (emailError) {
        console.error('[Dialogues] Erreur lors de l\'envoi de l\'email (non bloquant):', emailError)
        // Ne pas bloquer le processus si l'email échoue
      }
      
      if (!isDevTestBypass()) {
        try {
          const sid = accessInfo?.sessionId || localStorage.getItem('session_dialogue')
          await recordGeneration('dialogue', email, sid || undefined)
        } catch (recordError) {
          console.error('[Dialogues] Erreur lors de l\'enregistrement de la génération (non bloquant):', recordError)
        }

        try {
          const sid = accessInfo?.sessionId || localStorage.getItem('session_dialogue')
          const updatedAccessResult = await checkProductAccess('dialogue', email, sid || undefined)
          setAccessInfo(updatedAccessResult)
          setHasAccess(updatedAccessResult.hasAccess)
        } catch (accessError) {
          console.error('[Dialogues] Erreur lors de la mise à jour de l\'accès (non bloquant):', accessError)
        }
      } else {
        setAccessInfo(DEV_TEST_ACCESS_RESULT)
        setHasAccess(true)
      }
    } catch (error: any) {
      console.error('Error generating dialogue:', error)
      console.error('Error stack:', error.stack)
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        response: error.response,
        data: error.data,
      })
      
      const errorMsg = error.message || error.toString() || 'Erreur inconnue'
      
      // Messages d'erreur plus spécifiques
      let userFriendlyMsg = ''
      if (errorMsg.includes('Rate limit') || errorMsg.includes('429')) {
        userFriendlyMsg = t.dialogues.rateLimitError
      } else if (errorMsg.includes('timeout') || errorMsg.includes('Timeout')) {
        userFriendlyMsg = 'La génération prend trop de temps. Veuillez réessayer.'
      } else if (errorMsg.includes('network') || errorMsg.includes('fetch')) {
        userFriendlyMsg = 'Erreur de connexion. Vérifiez votre connexion internet et réessayez.'
      } else if (errorMsg.includes('vide') || errorMsg.includes('empty')) {
        userFriendlyMsg = 'Le dialogue généré est vide. Veuillez réessayer.'
      } else {
        userFriendlyMsg = t.dialogues.errorGenerating.replace('{error}', errorMsg)
      }
      
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
          <h1 className="text-3xl font-bold text-cosmic-gold mb-8 flex items-center gap-3">
            <MessageSquare className="h-8 w-8 shrink-0 text-cosmic-gold" />
            <span className="flex flex-col leading-tight">
              <span>{t.dialogues.titleLine1}</span>
              {t.dialogues.titleLine2 ? <span>{t.dialogues.titleLine2}</span> : null}
            </span>
          </h1>

          <p className="text-cosmic-gold/90 mb-6">{t.dialogues.description}</p>

          {isDevTestBypass() && (
            <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
              <p className="text-yellow-200 text-sm font-semibold text-center">
                Mode développement : génération sans paiement sur localhost. Ajoute{' '}
                <code className="text-yellow-100">?test=false</code> à l’URL pour tester le flux avec paiement.
              </p>
            </div>
          )}

          {/* Message de paiement requis */}
          {checkingAccess ? (
            <div className="mb-6 p-4 bg-cosmic-gold/20 border border-cosmic-gold/50 rounded-lg">
              <p className="text-cosmic-gold text-center">Vérification de l'accès...</p>
            </div>
          ) : !hasAccess ? (
            <div className="mb-6 p-6 bg-gradient-to-br from-cosmic-purple/40 to-magenta-purple/40 border border-cosmic-gold/30 rounded-xl backdrop-blur-sm">
              <div className="text-center mb-4">
                <Sparkles className="h-8 w-8 text-cosmic-gold mx-auto mb-3" />
                <h3 className="text-xl font-bold text-cosmic-gold mb-2">{t.dialogues.accessHeading}</h3>
                {accessInfo && accessInfo.quantityPurchased > 0 && accessInfo.quantityRemaining === 0 ? (
                  <>
                    <p className="text-cosmic-gold/90 mb-4">
                      Vous avez déjà utilisé toutes vos générations ({accessInfo.quantityUsed}/{accessInfo.quantityPurchased}).
                    </p>
                    <p className="text-cosmic-gold/90 mb-4">
                      Commandez à nouveau pour générer un autre dialogue.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-cosmic-gold/90 mb-4">
                      Pour générer un dialogue symbolique unique, commandez ci-dessous.
                    </p>
                    <p className="text-sm text-cosmic-gold/70 mb-6">
                      Offre de lancement à 9,99$ CAD
                    </p>
                  </>
                )}
              </div>
              <button
                onClick={() => router.push('/pricing?redirect=dialogue')}
                className="w-full px-6 py-3 bg-gradient-to-r from-cosmic-gold via-rose-gold to-cosmic-gold text-cosmic-purple rounded-lg font-semibold hover:shadow-lg hover:shadow-cosmic-gold/50 transition transform hover:scale-105"
              >
                {accessInfo && accessInfo.quantityPurchased > 0 ? 'Commander à nouveau - 9,99$ CAD' : 'Commander maintenant - 9,99$ CAD'}
              </button>
            </div>
          ) : accessInfo && accessInfo.quantityRemaining > 0 ? (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-400/50 rounded-lg">
              <p className="text-green-300 text-center">
                Vous pouvez générer {accessInfo.quantityRemaining} dialogue{accessInfo.quantityRemaining > 1 ? 's' : ''} ({accessInfo.quantityUsed}/{accessInfo.quantityPurchased} utilisé{accessInfo.quantityUsed > 1 ? 's' : ''})
              </p>
            </div>
          ) : null}

          {/* Input Form */}
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 relative z-20 ${!hasAccess ? 'opacity-50 pointer-events-none' : ''}`}>
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
                {t.dialogues.email}
              </label>
              <input
                type="email"
                value={birthData.email}
                onChange={(e) => setBirthData({ ...birthData, email: e.target.value })}
                placeholder={t.dialogues.emailPlaceholder}
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
            disabled={loading || !birthData.birth_date || !hasAccess || checkingAccess}
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

          {emailStatus !== 'idle' ? (
            <div className="mb-6 text-sm text-cosmic-gold/85">
              {emailStatus === 'sending'
                ? t.dialogues.emailSending
                : emailStatus === 'sent'
                  ? t.dialogues.emailSent.replace('{email}', birthData.email)
                  : t.dialogues.emailFailed}
            </div>
          ) : null}
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
              className=""
            >
              <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:flex-wrap sm:justify-end sm:items-start">
                <TextNarrationControls
                  text={dialogue}
                  language={(settings.language || 'fr') as 'en' | 'fr' | 'es'}
                  labels={t.narration}
                  className="w-full sm:max-w-md sm:mr-auto"
                />
                <button
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={downloading}
                  className="w-full sm:w-auto px-4 py-2 bg-cosmic-gold/20 text-cosmic-gold rounded-lg border border-cosmic-gold/40 hover:bg-cosmic-gold/30 transition disabled:opacity-50 shrink-0"
                >
                  {downloading ? t.dialogues.downloadingPdf : t.dialogues.downloadPdf}
                </button>
              </div>
              <div className="pdf-card" ref={exportRef}>
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
                  <div className="pdf-subtitle">{pdfSubtitle}</div>
                </div>
                <div className="pdf-scroll custom-scrollbar text-cosmic-gold/90">
                  <div className="dialogue-prose pdf-body pdf-panel">
                    <ReactMarkdown
                    components={{
                      p: ({ node, ...props }) => {
                        const rawText = Array.isArray(props.children)
                          ? props.children.map((c: any) => (typeof c === 'string' ? c : '')).join('').trim()
                          : (props.children as any)?.toString().trim()
                        const lower = (rawText || '').toLowerCase()
                        
                        // Détecter les astérisques (***)
                        const isAsterisks = rawText === '***' || rawText === '* * *' || /^\s*\*{3,}\s*$/.test(rawText || '')
                        
                        // Détecter "ICI ET MAINTENANT" / "HERE AND NOW" / "AQUÍ Y AHORA" (peut être suivi de texte)
                        const isIciMaintenant = 
                          lower === 'ici et maintenant' ||
                          lower.startsWith('ici et maintenant') ||
                          /^ici\s+et\s+maintenant/i.test(rawText || '') ||
                          lower === 'here and now' ||
                          lower.startsWith('here and now') ||
                          /^here\s+and\s+now/i.test(rawText || '') ||
                          lower === 'aquí y ahora' ||
                          lower === 'aqui y ahora' ||
                          lower.startsWith('aquí y ahora') ||
                          lower.startsWith('aqui y ahora') ||
                          /^aqu[ií]\s+y\s+ahora/i.test(rawText || '') ||
                          (lower.includes('ici et maintenant') && rawText && rawText.length < 200 && /ici\s+et\s+maintenant/i.test(rawText || '')) ||
                          (lower.includes('here and now') && rawText && rawText.length < 200 && /here\s+and\s+now/i.test(rawText || '')) ||
                          ((lower.includes('aquí y ahora') || lower.includes('aqui y ahora')) && rawText && rawText.length < 200 && /aqu[ií]\s+y\s+ahora/i.test(rawText || ''))

                        const speakerMatch = (rawText || '').match(/^([^\n:]{2,24})\s*:\s*(.*)$/s)
                        const isDialogue = (() => {
                          if (!speakerMatch) return false
                          const label = speakerMatch[1].trim()
                          const labelLower = label.toLowerCase()
                          const isAstro =
                            labelLower === 'astrologie' ||
                            labelLower === 'astrology' ||
                            labelLower === 'astrología' ||
                            labelLower === 'astrologia'
                          const looksLikeFirstName = /^[\p{L}'’-]+$/u.test(label) && label.length <= 16
                          return isAstro || looksLikeFirstName
                        })()
                        
                        const speakerName = speakerMatch ? speakerMatch[1].trim() : ''
                        const dialogueText = speakerMatch ? speakerMatch[2].trim() : ''
                        const isAstroSpeaker = (() => {
                          if (!speakerName) return false
                          const labelLower = speakerName.toLowerCase()
                          return labelLower === 'astrologie' ||
                            labelLower === 'astrology' ||
                            labelLower === 'astrología' ||
                            labelLower === 'astrologia'
                        })()
                        
                        const isCountdown =
                          /\b5\s*[–-]\s*4\s*[–-]\s*3\s*[–-]\s*2\s*[–-]\s*1\b/.test(rawText || '')
                        const isDate = /\d{1,2}\s+\w+\s+\d{2,4}/i.test(rawText || '')
                        const isPlace = (() => {
                          const text = rawText || ''
                          if (!text || text.length > 80) return false
                          if (/[0-9]/.test(text)) return false
                          const match = text.match(
                            /^([\p{L}][\p{L}'’.\- ]{0,40}),\s*([\p{L}][\p{L}'’.\- ]{0,40}),\s*([\p{L}][\p{L}'’.\- ]{0,40})$/u
                          )
                          if (!match) return false
                          const startsUpper = (value: string) => /^\p{Lu}/u.test(value.trim())
                          return startsUpper(match[1]) && startsUpper(match[2]) && startsUpper(match[3])
                        })()
                        const isLandingPhrase =
                          lower.includes('les énergies se rassemblent') ||
                          lower.includes('the energies gather') ||
                          lower.includes('las energías se reúnen') ||
                          lower.includes('las energias se reunen')
                        const center = !isDialogue && (rawText || '').length < 120 && (isCountdown || isDate || isPlace || isLandingPhrase)
                        const isLandingLabel = /\b(?:atterrissage|landing|aterrizaje)\s*:/i.test(rawText || '')
                        const isLanding = isLandingPhrase || isCountdown || isLandingLabel || isPlace
                        const isFootnote = lower.startsWith('ce dialogue est symbolique')
                        
                        // Si c'est ICI et MAINTENANT suivi de texte, on doit le séparer
                        if (isIciMaintenant && rawText && rawText.length > 20) {
                          const iciMatch = rawText.match(/^(.*?(ici\s+et\s+maintenant|here\s+and\s+now|aqui\s+y\s+ahora|aquí\s+y\s+ahora)[^\s]*)/i)
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
                        
                        // Si c'est un dialogue, rendre comme une bulle
                        if (isDialogue && speakerMatch && dialogueText) {
                          // Fonction pour obtenir le symbole astrologique
                          const getSymbol = (name: string): string => {
                            // Normaliser le nom : enlever accents, espaces, mettre en minuscule
                            const normalize = (str: string) => str
                              .toLowerCase()
                              .normalize('NFD')
                              .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
                              .trim()
                            
                            const nameNormalized = normalize(name)
                            const symbols: { [key: string]: string } = {
                              // Planètes
                              'saturne': '♄',
                              'saturn': '♄',
                              'jupiter': '♃',
                              'mars': '♂',
                              'venus': '♀',
                              'mercure': '☿',
                              'mercury': '☿',
                              'soleil': '☉',
                              'sun': '☉',
                              'lune': '☽',
                              'moon': '☽',
                              'uranus': '♅',
                              'neptune': '♆',
                              'pluton': '♇',
                              'pluto': '♇',
                              // Signes astrologiques - toutes les variantes
                              'belier': '♈',
                              'bélier': '♈',
                              'aries': '♈',
                              'taureau': '♉',
                              'taurus': '♉',
                              'gemeaux': '♊',
                              'gémeaux': '♊',
                              'gemini': '♊',
                              'cancer': '♋',
                              'lion': '♌',
                              'leo': '♌',
                              'vierge': '♍',
                              'virgo': '♍',
                              'balance': '♎',
                              'libra': '♎',
                              'scorpion': '♏',
                              'scorpio': '♏',
                              'sagittaire': '♐',
                              'sagittarius': '♐',
                              'capricorne': '♑',
                              'capricorn': '♑',
                              'verseau': '♒',
                              'aquarius': '♒',
                              'poissons': '♓',
                              'poisson': '♓',
                              'pisces': '♓',
                            }
                            return symbols[nameNormalized] || ''
                          }
                          
                          const isAstrologie = (() => {
                            const labelLower = speakerName.toLowerCase()
                            return labelLower === 'astrologie' ||
                              labelLower === 'astrology' ||
                              labelLower === 'astrología' ||
                              labelLower === 'astrologia'
                          })()
                          
                          const symbol = isAstroSpeaker && !isAstrologie ? getSymbol(speakerName) : ''
                          const isClient = !isAstroSpeaker
                          
                          return (
                            <div 
                              key={props.key}
                              className={`dialogue-bubble ${isAstroSpeaker ? 'dialogue-bubble-astro' : 'dialogue-bubble-user'}`}
                            >
                              <div className="dialogue-bubble-speaker">
                                {isAstroSpeaker && isAstrologie && (
                                  <Logo variant="symbol" size="sm" className="dialogue-bubble-speaker-symbol" animated={false} asLink={false} />
                                )}
                                {isAstroSpeaker && !isAstrologie && symbol && (
                                  <span className="dialogue-bubble-speaker-symbol">{symbol}</span>
                                )}
                                {isClient ? (
                                  <span className="dialogue-bubble-speaker-name">
                                    {speakerName.charAt(0).toUpperCase()}
                                  </span>
                                ) : null}
                                <span>{speakerName}</span>
                              </div>
                              <div className="dialogue-bubble-content">
                                <p className="dialogue-bubble-text">{dialogueText}</p>
                              </div>
                            </div>
                          )
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
                <div className="pdf-footnote">{pdfSubtitle}</div>
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
