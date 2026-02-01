'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Sparkles } from 'lucide-react'
import { useSettingsStore } from '@/lib/store'
import { apiClient } from '@/lib/api'
import ReactMarkdown from 'react-markdown'
import LocationInput from '@/components/LocationInput'
import BackButton from '@/components/BackButton'
import { generateReadingPrompt } from './generateReadingPrompt'
import { formatBirthDateInput } from '@/lib/sanitizeBirthDateYear'
import { useTranslation } from '@/lib/useTranslation'
import { pdf } from '@react-pdf/renderer'
import Reading2026Pdf from './Reading2026Pdf'
import { checkAccessFromURL, checkProductAccess, markProductAsPaid, recordGeneration, type AccessResult } from '@/lib/checkPayment'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { cleanText } from '@/lib/cleanText'
import Starfield from '@/components/Starfield'
import Logo from '@/components/Logo'

export default function Reading2026Page() {
  const settings = useSettingsStore()
  const t = useTranslation()
  const router = useRouter()
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

  const [reading, setReading] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [downloading, setDownloading] = useState(false)

  // Vérifier l'accès au chargement de la page
  useEffect(() => {
    const checkAccess = async () => {
      setCheckingAccess(true)
      
      // Récupérer l'email depuis localStorage ou le formulaire
      const savedEmail = localStorage.getItem('last_email_reading-2026')
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement
      const email = emailInput?.value || savedEmail || null

      console.log('[Reading2026] Vérification de l\'accès au chargement...', { email, savedEmail })
      
      const accessResult = await checkAccessFromURL('reading-2026')
      console.log('[Reading2026] Résultat de la vérification:', accessResult)
      
      setAccessInfo(accessResult)
      setHasAccess(accessResult.hasAccess)
      setCheckingAccess(false)
      
      if (accessResult.hasAccess) {
        markProductAsPaid('reading-2026')
        // Sauvegarder le session_id dans localStorage avant de nettoyer l'URL
        if (accessResult.sessionId) {
          localStorage.setItem('session_reading-2026', accessResult.sessionId)
        }
        // Sauvegarder aussi l'email si disponible
        if (email) {
          localStorage.setItem('last_email_reading-2026', email)
        }
        // Nettoyer l'URL après un court délai pour laisser le temps à la vérification
        setTimeout(() => {
          const url = new URL(window.location.href)
          url.searchParams.delete('purchased')
          url.searchParams.delete('session_id')
          window.history.replaceState({}, '', url.toString())
        }, 2000) // Augmenter le délai à 2 secondes
      } else {
        console.log('[Reading2026] Pas d\'accès trouvé. Détails:', {
          quantityPurchased: accessResult.quantityPurchased,
          quantityUsed: accessResult.quantityUsed,
          quantityRemaining: accessResult.quantityRemaining,
        })
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
    setReading(null)
    setEmailStatus('idle')
  }

  const sendReadingPdfByEmail = async (readingText: string) => {
    const to = (birthData.email || '').trim()
    if (!to) return

    setEmailStatus('sending')
    try {
      const res = await fetch('/api/email-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'reading-2026',
          to,
          language: (settings.language || 'fr') as 'en' | 'fr' | 'es',
          firstName: birthData.firstName || undefined,
          birthDate: birthData.birth_date,
          birthTime: birthData.birth_time,
          birthPlace: birthData.birth_place,
          content: readingText,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`)

      setEmailStatus('sent')
    } catch (err) {
      console.error('[Reading2026] Failed to email PDF:', err)
      setEmailStatus('error')
    }
  }

  const handleGenerateReading = async () => {
    // Vérifier d'abord les champs requis avant de vérifier l'accès
    const email = birthData.email?.trim() || null
    if (!email) {
      alert(t.reading2026.validationEmailRequired)
      return
    }

    if (!birthData.birth_date || !birthData.birth_time) {
      alert(t.reading2026.validationBirthDateTimeRequired)
      return
    }

    if (!birthData.latitude || !birthData.longitude) {
      alert(t.reading2026.validationBirthPlaceRequired)
      return
    }

    // Sauvegarder l'email pour la vérification
    localStorage.setItem(`last_email_reading-2026`, email)

    // Récupérer le session_id depuis localStorage ou l'URL
    const params = new URLSearchParams(window.location.search)
    const sessionIdFromUrl = params.get('session_id')
    const sessionIdFromStorage = localStorage.getItem('session_reading-2026')
    const sessionId = sessionIdFromUrl || sessionIdFromStorage || null

    console.log('[Reading2026] Vérification de l\'accès avant génération...', { email, sessionId })

    // Vérifier l'accès avec l'email et le session_id
    const accessResult = await checkProductAccess('reading-2026', email, sessionId)
    console.log('[Reading2026] Résultat de la vérification avant génération:', accessResult)
    
    setAccessInfo(accessResult)
    if (!accessResult.hasAccess) {
      // Rediriger vers la page de tarification
      if (accessResult.quantityRemaining === 0 && accessResult.quantityPurchased > 0) {
        alert('Vous avez déjà utilisé toutes vos générations. Veuillez commander à nouveau pour générer une autre lecture.')
      } else {
        alert('Accès non autorisé. Veuillez effectuer un paiement pour générer une lecture.')
      }
      router.push('/pricing?redirect=reading-2026')
      return
    }

    setEmailStatus('idle')
    setLoading(true)
    try {
      // Validation finale de l'email (déjà vérifié avant, mais on double-vérifie)
      if (!birthData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(birthData.email.trim())) {
        alert(t.reading2026.validationEmailRequired)
        setLoading(false)
        return
      }

      // Get natal chart first
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
        include_extra_objects: settings.includeExtraObjects ?? true,
      })

      if (chartResponse.error) {
        throw new Error(chartResponse.error)
      }

      const chart = chartResponse.data

      if (!chart) {
        throw new Error('Chart response is empty')
      }

      if (!chart.planets) {
        throw new Error('Chart response missing planets data')
      }

      // Calculate transits for 2026
      // Use mid-year date for representative transits
      const targetDate2026 = '2026-06-15T12:00:00Z'
      
      // Build natal positions dictionary
      // Note: The API expects natal positions WITHOUT the "natal_" prefix in the keys
      const natalPositions: { [key: string]: number } = {}
      if (chart.planets) {
        Object.entries(chart.planets).forEach(([key, planet]: [string, any]) => {
          if (planet && typeof planet.longitude === 'number') {
            natalPositions[key] = planet.longitude
          }
        })
      }

      // Get ascendant and midheaven for separate parameters
      const natalAsc = typeof chart.ascendant === 'number' 
        ? chart.ascendant 
        : (chart.ascendant as any)?.longitude || null
      const natalMc = chart.midheaven || null

      console.log('[Reading 2026] Calculating transits for:', {
        targetDate: targetDate2026,
        natalPositionsCount: Object.keys(natalPositions).length,
        natalAsc,
        natalMc,
      })

      const transitsResponse = await apiClient.transits.calculate({
        natal_positions: natalPositions,
        natal_asc: natalAsc,
        natal_mc: natalMc,
        target_date: targetDate2026,
        latitude: birthData.latitude,
        longitude: birthData.longitude,
        house_system: settings.houseSystem || 'placidus',
        include_angles: true,
      })

      if (transitsResponse.error) {
        throw new Error(transitsResponse.error)
      }

      const transitsData = transitsResponse.data
      if (!transitsData || !transitsData.transits) {
        throw new Error('Transits response missing data')
      }

      // Convert transits to the format expected by generateReadingPrompt
      const transits = [
        ...(transitsData.transits || []).map((t: any) => ({
          transiting_body: (t.transiting_body || t.transitingBody || '').toLowerCase(),
          natal_body: (t.natal_body || t.natalBody || '').toLowerCase(),
          aspect: t.aspect,
          orb_deg: t.orb_deg || t.orbDeg || 0,
          applying: t.applying,
          exact: t.exact,
        })),
        // Add transits to angles
        ...(transitsData.transits_to_angles || []).map((t: any) => {
          const angleName = (t.angle || '').toLowerCase()
          return {
            transiting_body: (t.transiting_body || t.transitingBody || '').toLowerCase(),
            natal_body: angleName === 'asc' ? 'ascendant' : 
                       angleName === 'mc' ? 'midheaven' : 
                       angleName === 'ic' ? 'ic' :
                       angleName === 'dsc' ? 'dsc' : angleName,
            aspect: t.aspect,
            orb_deg: t.orb_deg || t.orbDeg || 0,
            applying: t.applying,
            exact: t.exact,
          }
        }),
      ]
      
      console.log('[Reading 2026] Transits calculated:', {
        transitsCount: transits.length,
        sampleTransits: transits.slice(0, 3),
      })

      // Generate reading using backend AI endpoint
      const lang = (settings.language || 'fr') as 'en' | 'fr' | 'es'
      const { systemPrompt, userPrompt } = generateReadingPrompt(birthData, chart, transits, lang)

      const response = await apiClient.ai.interpret(userPrompt, systemPrompt)

      if (response.error) {
        throw new Error(response.error)
      }

      const readingText = response.data?.content || ''
      console.log('[Reading 2026] Texte reçu du backend (longueur):', readingText.length)
      console.log('[Reading 2026] Premiers 500 caractères:', readingText.substring(0, 500))
      console.log('[Reading 2026] Derniers 500 caractères:', readingText.substring(Math.max(0, readingText.length - 500)))
      
      // Vérifier si le texte semble coupé
      if (readingText.length > 100) {
        const lastChars = readingText.slice(-100).trim()
        const endsProperly = /[.!?:;\)\]\}]$/.test(lastChars) || readingText.endsWith('\n')
        if (!endsProperly && readingText.length > 15000) {
          console.warn('[Reading 2026] ⚠️ Texte pourrait être coupé - se termine avec:', lastChars)
        }
      }
      
      let cleanedText = cleanText(readingText)
      console.log('[Reading 2026] Texte nettoyé (longueur):', cleanedText.length)
      console.log('[Reading 2026] Différence après nettoyage:', readingText.length - cleanedText.length, 'caractères')
      
      // Vérifier que le nettoyage n'a pas supprimé trop de contenu
      const cleaningLoss = readingText.length - cleanedText.length
      if (cleaningLoss > readingText.length * 0.1) { // Plus de 10% de perte
        console.warn('[Reading 2026] ⚠️ Le nettoyage a supprimé beaucoup de contenu:', cleaningLoss, 'caractères')
      }
      
      // Remove the title line if it matches "FirstName - Plan de jeu astrologique 2026" pattern
      const lines = cleanedText.split('\n')
      if (lines.length > 0) {
        const firstLine = lines[0].trim()
        const titlePattern = /^[^-]+ - Plan de jeu astrologique 2026$/i
        if (titlePattern.test(firstLine)) {
          cleanedText = lines.slice(1).join('\n').trim()
          console.log('[Reading 2026] Titre retiré, longueur restante:', cleanedText.length)
        }
      }

      console.log('[Reading 2026] Texte final (longueur):', cleanedText.length)
      console.log('[Reading 2026] Derniers 500 caractères:', cleanedText.substring(Math.max(0, cleanedText.length - 500)))
      setReading(cleanedText)
      await sendReadingPdfByEmail(cleanedText)
      
      // Enregistrer la génération
      const sessionId = accessInfo?.sessionId || localStorage.getItem('session_reading-2026')
      await recordGeneration('reading-2026', email, sessionId || undefined)
      
      // Mettre à jour l'accès
      const newAccessResult = await checkAccessFromURL('reading-2026')
      setAccessInfo(newAccessResult)
      setHasAccess(newAccessResult.hasAccess)
    } catch (error: any) {
      console.error('Error generating reading:', error)
      const errorMsg = error.message || 'Erreur inconnue'
      alert(t.reading2026.errorGenerating.replace('{error}', errorMsg))
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!reading) return
    setDownloading(true)
    try {
      const lang = (settings.language || 'fr') as 'en' | 'fr' | 'es'
      const pdfPromise = pdf(
        <Reading2026Pdf
          reading={reading}
          language={lang}
          firstName={birthData.firstName || undefined}
          birthDate={birthData.birth_date || undefined}
          birthTime={birthData.birth_time || undefined}
          birthPlace={birthData.birth_place || undefined}
        />
      ).toBlob()
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('PDF generation timeout')), 30000))

      const blob = (await Promise.race([pdfPromise, timeoutPromise])) as Blob
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const baseName = t.locale === 'fr' ? 'Lecture-2026' : t.locale === 'es' ? 'Lectura-2026' : '2026-Reading'
      const defaultName = t.locale === 'fr' ? 'lecture' : t.locale === 'es' ? 'lectura' : 'reading'
      link.download = `${baseName}-${birthData.firstName || defaultName}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('Error generating PDF', err)
      const errorMessage = err?.message || err?.toString() || 'Erreur inconnue'
      const userMessage = errorMessage.includes('timeout')
        ? t.locale === 'fr'
          ? 'La génération du PDF prend trop de temps. Veuillez réessayer.'
          : t.locale === 'es'
            ? 'La generación del PDF tarda demasiado. Inténtalo de nuevo.'
            : 'PDF generation is taking too long. Please try again.'
        : t.locale === 'fr'
          ? `Échec de la génération du PDF: ${errorMessage}`
          : t.locale === 'es'
            ? `Error al generar el PDF: ${errorMessage}`
            : `Failed to generate PDF: ${errorMessage}`
      alert(userMessage)
    } finally {
      setDownloading(false)
    }
  }

  const pdfSubtitle = (t.reading2026.title || 'Lecture 2026')
    .replace(/&/g, '-')
    .replace(/[\u2010\u2011\u2012\u2013\u2014\u2212]/g, '-')

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-purple via-magenta-purple to-cosmic-purple relative">
      <Starfield />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <BackButton />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-cosmic-purple/60 to-magenta-purple/60 backdrop-blur-sm rounded-xl p-8 border border-cosmic-gold/20 relative z-10"
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <Calendar className="h-8 w-8 text-cosmic-gold" />
            <h1 className="text-3xl font-bold text-cosmic-gold">
              {t.reading2026.title}
            </h1>
          </div>

          <p className="text-cosmic-gold/90 mb-6 text-center">
            {t.reading2026.description}
          </p>

          {/* Message de paiement requis */}
          {checkingAccess ? (
            <div className="mb-6 p-4 bg-cosmic-gold/20 border border-cosmic-gold/50 rounded-lg">
              <p className="text-cosmic-gold text-center">Vérification de l'accès...</p>
            </div>
          ) : !hasAccess ? (
            <div className="mb-6 p-6 bg-gradient-to-br from-cosmic-purple/40 to-magenta-purple/40 border border-cosmic-gold/30 rounded-xl backdrop-blur-sm">
              <div className="text-center mb-4">
                <Calendar className="h-8 w-8 text-cosmic-gold mx-auto mb-3" />
                <h3 className="text-xl font-bold text-cosmic-gold mb-2">Explorez votre année 2026</h3>
                {accessInfo && accessInfo.quantityPurchased > 0 && accessInfo.quantityRemaining === 0 ? (
                  <>
                    <p className="text-cosmic-gold/90 mb-4">
                      Vous avez déjà utilisé toutes vos générations ({accessInfo.quantityUsed}/{accessInfo.quantityPurchased}).
                    </p>
                    <p className="text-cosmic-gold/90 mb-4">
                      Commandez à nouveau pour générer une autre lecture.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-cosmic-gold/90 mb-4">
                      Pour recevoir votre lecture astrologique personnalisée pour 2026, commandez votre accès ci-dessous.
                    </p>
                    <p className="text-sm text-cosmic-gold/70 mb-6">
                      Offre de lancement à 9,99$ CAD
                    </p>
                  </>
                )}
              </div>
              <button
                onClick={() => router.push('/pricing?redirect=reading-2026')}
                className="w-full px-6 py-3 bg-gradient-to-r from-cosmic-gold via-rose-gold to-cosmic-gold text-cosmic-purple rounded-lg font-semibold hover:shadow-lg hover:shadow-cosmic-gold/50 transition transform hover:scale-105"
              >
                {accessInfo && accessInfo.quantityPurchased > 0 ? 'Commander à nouveau - 9,99$ CAD' : 'Commander maintenant - 9,99$ CAD'}
              </button>
            </div>
          ) : accessInfo && accessInfo.quantityRemaining > 0 ? (
            <div className="mb-6 p-4 bg-green-500/20 border border-green-400/50 rounded-lg">
              <p className="text-green-300 text-center">
                Vous pouvez générer {accessInfo.quantityRemaining} lecture{accessInfo.quantityRemaining > 1 ? 's' : ''} ({accessInfo.quantityUsed}/{accessInfo.quantityPurchased} utilisé{accessInfo.quantityUsed > 1 ? 'es' : 'e'})
              </p>
            </div>
          ) : null}

          {!reading ? (
            <>
              {/* Input Form */}
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 relative z-40 ${!hasAccess ? 'opacity-50 pointer-events-none' : ''}`}>
                <div>
                  <label className="block text-sm font-medium text-cosmic-gold mb-2">
                    {t.reading2026.firstName}
                  </label>
                  <input
                    type="text"
                    value={birthData.firstName}
                    onChange={(e) => setBirthData({ ...birthData, firstName: e.target.value })}
                    placeholder={t.reading2026.firstNamePlaceholder}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-cosmic-gold/30 text-cosmic-gold placeholder-cosmic-gold/50 focus:outline-none focus:border-cosmic-gold relative z-20"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cosmic-gold mb-2">
                    {t.reading2026.email}
                  </label>
                  <input
                    type="email"
                    value={birthData.email}
                    onChange={(e) => setBirthData({ ...birthData, email: e.target.value })}
                    placeholder={t.reading2026.emailPlaceholder}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-cosmic-gold/30 text-cosmic-gold placeholder-cosmic-gold/50 focus:outline-none focus:border-cosmic-gold relative z-20"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cosmic-gold mb-2">
                    {t.reading2026.birthDate}
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
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-cosmic-gold/30 text-cosmic-gold placeholder-cosmic-gold/50 focus:outline-none focus:border-cosmic-gold relative z-20"
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
                    {t.reading2026.birthTime}
                  </label>
                  <input
                    type="time"
                    value={birthData.birth_time}
                    onChange={(e) => setBirthData({ ...birthData, birth_time: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-cosmic-gold/30 text-cosmic-gold focus:outline-none focus:border-cosmic-gold relative z-20"
                    suppressHydrationWarning
                  />
                </div>
                <div className="md:col-span-2">
                  <LocationInput
                    label={t.reading2026.birthPlace}
                    value={birthData.birth_place}
                    variant="gold"
                    onChange={(value) => setBirthData({ ...birthData, birth_place: value })}
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

              <div className="mt-12 mb-4">
                <button
                  onClick={handleGenerateReading}
                  disabled={loading || !birthData.birth_date || checkingAccess}
                  className="w-full px-6 py-3 bg-gradient-to-r from-cosmic-gold via-rose-gold to-cosmic-gold text-cosmic-purple rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center relative z-20"
                >
                {loading ? (
                  <>
                    <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                    {t.reading2026.generating}
                  </>
                ) : (
                  <>
                    <Calendar className="h-5 w-5 mr-2" />
                    {t.reading2026.generate}
                  </>
                )}
                </button>

                {emailStatus !== 'idle' ? (
                  <div className="mt-3 text-sm text-cosmic-gold/85">
                    {emailStatus === 'sending'
                      ? t.reading2026.emailSending
                      : emailStatus === 'sent'
                        ? t.reading2026.emailSent.replace('{email}', birthData.email)
                        : t.reading2026.emailFailed}
                  </div>
                ) : null}
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-sm text-cosmic-gold/80 hover:text-cosmic-gold underline"
                  disabled={loading}
                >
                  {t.reading2026.resetForm}
                </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Reading Display */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10"
              >
                <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-2 mb-4">
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    disabled={downloading}
                    className="w-full sm:w-auto px-4 py-2 bg-cosmic-gold/20 text-cosmic-gold rounded-lg border border-cosmic-gold/40 hover:bg-cosmic-gold/30 transition disabled:opacity-50"
                  >
                    {downloading ? t.reading2026.downloadingPdf : t.reading2026.downloadPdf}
                  </button>
                </div>

                <div className="pdf-card">
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
                    <ReactMarkdown 
                      className="dialogue-prose pdf-body pdf-panel"
                      components={{
                        h1: ({ node, ...props }) => {
                          const rawText = Array.isArray(props.children)
                            ? props.children.map((c: any) => (typeof c === 'string' ? c : '')).join('').trim()
                            : (props.children as any)?.toString().trim()
                          // Retirer les numéros des titres
                          const cleaned = rawText.replace(/^\d+\.\d+\)\s+/, '').replace(/^\d+\)\s+/, '').trim()
                          return <h1 {...props} className="dialogue-prose h1">{cleaned}</h1>
                        },
                        h2: ({ node, ...props }) => {
                          const rawText = Array.isArray(props.children)
                            ? props.children.map((c: any) => (typeof c === 'string' ? c : '')).join('').trim()
                            : (props.children as any)?.toString().trim()
                          // Retirer les numéros des titres
                          const cleaned = rawText.replace(/^\d+\.\d+\)\s+/, '').replace(/^\d+\)\s+/, '').trim()
                          return <h2 {...props} className="dialogue-prose h2">{cleaned}</h2>
                        },
                        h3: ({ node, ...props }) => {
                          const rawText = Array.isArray(props.children)
                            ? props.children.map((c: any) => (typeof c === 'string' ? c : '')).join('').trim()
                            : (props.children as any)?.toString().trim()
                          // Retirer les numéros des titres
                          const cleaned = rawText.replace(/^\d+\.\d+\)\s+/, '').replace(/^\d+\)\s+/, '').trim()
                          return <h3 {...props} className="dialogue-prose h3">{cleaned}</h3>
                        },
                        p: ({ node, ...props }) => {
                          const rawText = Array.isArray(props.children)
                            ? props.children.map((c: any) => (typeof c === 'string' ? c : '')).join('').trim()
                            : (props.children as any)?.toString().trim()
                          
                          // Les titres sont maintenant convertis en ## avant ReactMarkdown,
                          // donc on ne devrait plus avoir de titres ici. Mais on garde cette vérification
                          // au cas où un titre serait passé dans un paragraphe.
                          if (/^\d+\.\d+\)\s+/.test(rawText) || /^\d+\)\s+/.test(rawText)) {
                            const afterNumber = rawText.replace(/^\d+\.\d+\)\s+/, '').replace(/^\d+\)\s+/, '').trim()
                            if (afterNumber.length > 0 && afterNumber.length < 100 && /^\p{Lu}/u.test(afterNumber)) {
                              // C'est un titre, le rendre comme un h2
                              return <h2 className="dialogue-prose h2">{afterNumber}</h2>
                            }
                          }
                          
                          // Détecter le format "Nom : texte" avec support pour phrases comme "Tu pourrais remarquer : "
                          // Le texte peut contenir plusieurs lignes séparées par \n
                          const speakerMatch = (rawText || '').match(/^([^\n:]{2,50})\s*:\s*(.*)$/s)
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
                            // Détecter les phrases comme "Tu pourrais remarquer", "Tu remarqueras", etc.
                            const isObservationPhrase = /^(tu\s+(pourrais|remarqueras|noteras|observeras|constateras)|vous\s+(pourriez|remarquerez|noterez|observerez|constaterez)|on\s+(pourrait|remarque|note|observe|constate))\s+/i.test(label)
                            return isAstro || looksLikeFirstName || isObservationPhrase
                          })()
                          
                          const speakerName = speakerMatch ? speakerMatch[1].trim() : ''
                          // Le dialogueText peut contenir plusieurs lignes
                          const dialogueText = speakerMatch ? speakerMatch[2].trim() : ''
                          const isAstroSpeaker = (() => {
                            if (!speakerName) return false
                            const labelLower = speakerName.toLowerCase()
                            return labelLower === 'astrologie' ||
                              labelLower === 'astrology' ||
                              labelLower === 'astrología' ||
                              labelLower === 'astrologia'
                          })()
                          
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
                          
                          return <p {...props} className="dialogue-paragraph" />
                        },
                      }}
                    >
                      {(() => {
                        if (!reading) return ''
                        
                        // Remove the title line if it matches "FirstName - Plan de jeu astrologique 2026" pattern
                        let text = reading
                        const lines = text.split('\n')
                        if (lines.length > 0) {
                          const firstLine = lines[0].trim()
                          const titlePattern = /^[^-]+ - Plan de jeu astrologique 2026$/i
                          if (titlePattern.test(firstLine)) {
                            text = lines.slice(1).join('\n').trim()
                          }
                        }
                        
                        // Fonctions pour détecter et nettoyer les titres
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
                        ]
                        
                        const isSectionTitle = (line: string): boolean => {
                          const trimmed = line.trim()
                          if (!trimmed) return false
                          
                          // Vérifier si c'est un titre markdown
                          if (/^#{1,6}\s+/.test(trimmed)) return true
                          
                          // Vérifier si c'est un titre avec numéro au début
                          if (/^\d+\.\d+\)\s+/.test(trimmed) || /^\d+\)\s+/.test(trimmed)) {
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
                          
                          // Vérifier les patterns de titres génériques
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
                        
                        const cleanTitleText = (text: string): string => {
                          return text
                            .replace(/^#{1,6}\s+/, '') // Retirer les # markdown
                            .replace(/^\d+\.\d+\)\s+/, '') // "2.4) "
                            .replace(/^\d+\.\d+\.\s+/, '') // "2.4. "
                            .replace(/^\d+\)\s+/, '') // "2) "
                            .replace(/^\(\d+\.\d+\)\s+/, '') // "(2.4) "
                            .replace(/^\(\d+\)\s+/, '') // "(2) "
                            .trim()
                        }
                        
                        // Pré-traiter le texte pour :
                        // 1. Convertir les titres en markdown ##
                        // 2. Regrouper les lignes qui suivent "Tu pourrais remarquer :" dans le même bloc
                        const processedLines: string[] = []
                        const allLines = text.split('\n')
                        let i = 0
                        
                        while (i < allLines.length) {
                          const line = allLines[i]
                          const trimmedLine = line.trim()
                          
                          // D'abord, vérifier si c'est un titre (avant de vérifier "Tu pourrais remarquer")
                          if (isSectionTitle(trimmedLine)) {
                            // Convertir en markdown ## pour que ReactMarkdown le reconnaisse comme un titre
                            const cleanedTitle = cleanTitleText(trimmedLine)
                            processedLines.push(`## ${cleanedTitle}`)
                            i++
                            continue
                          }
                          
                          // Détecter si cette ligne commence par "Tu pourrais remarquer :" ou similaire
                          const observationMatch = trimmedLine.match(/^(tu\s+(pourrais|remarqueras|noteras|observeras|constateras)|vous\s+(pourriez|remarquerez|noterez|observerez|constaterez)|on\s+(pourrait|remarque|note|observe|constate))\s*:\s*(.*)$/i)
                          
                          if (observationMatch) {
                            // Commencer un nouveau bloc avec cette ligne (garder les retours à la ligne)
                            let combinedText = line
                            i++
                            
                            // Continuer à ajouter les lignes suivantes jusqu'à ce qu'on trouve :
                            // - Une ligne vide (fin de paragraphe)
                            // - Un nouveau dialogue (ligne avec "Nom :")
                            // - Un titre (ligne qui commence par #, numéro, ou qui est un titre connu)
                            while (i < allLines.length) {
                              const nextLine = allLines[i]
                              const trimmedNextLine = nextLine.trim()
                              
                              // Arrêter si ligne vide
                              if (!trimmedNextLine) {
                                break
                              }
                              
                              // Arrêter si c'est un nouveau dialogue
                              const dialogueMatch = trimmedNextLine.match(/^([^\n:]{2,24})\s*:\s*(.*)$/)
                              if (dialogueMatch) {
                                const label = dialogueMatch[1].trim().toLowerCase()
                                const isNewDialogue = 
                                  label === 'astrologie' || label === 'astrology' || label === 'astrología' || label === 'astrologia' ||
                                  /^[\p{L}'’-]+$/u.test(dialogueMatch[1].trim()) && dialogueMatch[1].trim().length <= 16
                                if (isNewDialogue) {
                                  break
                                }
                              }
                              
                              // Arrêter si c'est un titre
                              if (isSectionTitle(trimmedNextLine)) {
                                break
                              }
                              
                              // Ajouter cette ligne au bloc combiné (garder les retours à la ligne)
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
                        
                        // Joindre les lignes : utiliser \n\n pour séparer les blocs
                        // Pour les blocs combinés (comme "Tu pourrais remarquer :"), remplacer les \n par des espaces
                        // pour que ReactMarkdown les traite comme un seul paragraphe (une seule bulle)
                        return processedLines.map((line) => {
                          // Si cette ligne contient "Tu pourrais remarquer :" ou similaire, c'est un bloc combiné
                          const trimmed = line.trim()
                          const isCombinedBlock = /^(tu\s+(pourrais|remarqueras|noteras|observeras|constateras)|vous\s+(pourriez|remarquerez|noterez|observerez|constaterez)|on\s+(pourrait|remarque|note|observe|constate))\s*:\s*/i.test(trimmed)
                          if (isCombinedBlock) {
                            // Remplacer les \n par des espaces pour que tout soit dans le même paragraphe
                            // Garder les retours à la ligne seulement après les points-virgules pour la lisibilité
                            return line.replace(/\n/g, ' ').replace(/;\s+/g, '; ')
                          }
                          return line
                        }).join('\n\n')
                      })()}
                    </ReactMarkdown>
                  </div>

                  <div className="pdf-footnote">{pdfSubtitle}</div>
                </div>

                <div className="mt-6 pt-4 border-t border-cosmic-gold/20 text-xs text-cosmic-gold/60 italic text-center footnote-small">
                  {t.reading2026.disclaimer}
                </div>
              </motion.div>

              <button
                onClick={() => setReading(null)}
                className="mt-3 w-full px-6 py-2 bg-cosmic-gold/10 text-cosmic-gold/90 rounded-lg border border-cosmic-gold/30 hover:bg-cosmic-gold/20 transition"
              >
                {t.reading2026.generateAnother}
              </button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
