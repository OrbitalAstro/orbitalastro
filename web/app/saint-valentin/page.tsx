'use client'

export const dynamic = 'force-dynamic'

import { useState, createElement } from 'react'
import { motion } from 'framer-motion'
import { Users, Sparkles, Loader2, Gift, Check } from 'lucide-react'
import { useSettingsStore } from '@/lib/store'
import { apiClient } from '@/lib/api'
import ReactMarkdown from 'react-markdown'
import LocationInput from '@/components/LocationInput'
import BackButton from '@/components/BackButton'
import { formatBirthDateInput } from '@/lib/sanitizeBirthDateYear'
import { useTranslation } from '@/lib/useTranslation'
import { pdf } from '@react-pdf/renderer'

import { generateValentinePrompt } from './generateValentinePrompt'
import ValentinePdf from './ValentinePdf'
import { checkAccessFromURL, markProductAsPaid } from '@/lib/checkPayment'
import { isDevTestBypass } from '@/lib/devTestMode'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { cleanText } from '@/lib/cleanText'
import Starfield from '@/components/Starfield'
import Logo from '@/components/Logo'
import TextNarrationControls from '@/components/TextNarrationControls'

export default function SaintValentinPage() {
  const settings = useSettingsStore()
  const t = useTranslation()
  const router = useRouter()
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [checkingAccess, setCheckingAccess] = useState(true)

  const [you, setYou] = useState({
    firstName: settings.defaultFirstName || '',
    email: '',
    birth_date: settings.defaultBirthDate || '',
    birth_time: settings.defaultBirthTime || '12:00',
    birth_place: '',
    latitude: settings.defaultLatitude || 0,
    longitude: settings.defaultLongitude || 0,
    timezone: settings.defaultTimezone || 'UTC',
  })

  const [partner, setPartner] = useState({
    firstName: '',
    birth_date: '',
    birth_time: '12:00',
    birth_place: '',
    latitude: 0,
    longitude: 0,
    timezone: 'UTC',
  })

  const [relationshipContext, setRelationshipContext] = useState('')
  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [downloading, setDownloading] = useState(false)

  // Mode test : localhost (sauf ?test=false), ou ?test=true sur n’importe quel host — voir devTestMode
  const isTestMode = () =>
    isDevTestBypass() ||
    (typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('test') === 'true')

  // Vérifier l'accès au chargement de la page
  useEffect(() => {
    const checkAccess = async () => {
      // En mode test, on bypass la vérification
      if (isTestMode()) {
        setHasAccess(true)
        setCheckingAccess(false)
        return
      }

      // Récupérer l'email depuis localStorage ou le formulaire
      const savedEmail = localStorage.getItem('last_email_valentine-2026')
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement
      const email = emailInput?.value || savedEmail || null

      const access = await checkAccessFromURL('valentine-2026')
      setHasAccess(access.hasAccess)
      setCheckingAccess(false)
      
      if (access.hasAccess) {
        markProductAsPaid('valentine-2026')
        // Nettoyer l'URL
        const url = new URL(window.location.href)
        url.searchParams.delete('purchased')
        url.searchParams.delete('session_id')
        window.history.replaceState({}, '', url.toString())
      }
    }
    checkAccess()
  }, [])

  const resetForm = () => {
    setYou({
      firstName: settings.defaultFirstName || '',
      email: '',
      birth_date: settings.defaultBirthDate || '',
      birth_time: settings.defaultBirthTime || '12:00',
      birth_place: '',
      latitude: settings.defaultLatitude || 0,
      longitude: settings.defaultLongitude || 0,
      timezone: settings.defaultTimezone || 'UTC',
    })
    setPartner({
      firstName: '',
      birth_date: '',
      birth_time: '12:00',
      birth_place: '',
      latitude: 0,
      longitude: 0,
      timezone: 'UTC',
    })
    setRelationshipContext('')
    setContent(null)
    setEmailStatus('idle')
  }

  const sendPdfByEmail = async (text: string) => {
    const to = (you.email || '').trim()
    if (!to) return

    setEmailStatus('sending')
    try {
      const res = await fetch('/api/email-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: 'saint-valentin',
          to,
          language: (settings.language || 'fr') as 'en' | 'fr' | 'es',
          firstName: you.firstName || undefined,
          partnerName: partner.firstName || undefined,
          relationshipContext: relationshipContext || undefined,
          content: text,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        const errorMsg = json?.error || `HTTP ${res.status}`
        console.error('[SaintValentin] Email API error:', errorMsg, json)
        throw new Error(errorMsg)
      }

      setEmailStatus('sent')
    } catch (err) {
      console.error('[SaintValentin] Failed to email PDF:', err)
      setEmailStatus('error')
      if (err instanceof Error) {
        console.error('[SaintValentin] Error details:', err.message)
        console.error('[SaintValentin] Error stack:', err.stack)
        console.error('[SaintValentin] Request was:', {
          kind: 'saint-valentin',
          to: to.substring(0, 3) + '***',
          language: (settings.language || 'fr'),
          hasFirstName: !!you.firstName,
          hasPartnerName: !!partner.firstName,
          hasRelationshipContext: !!relationshipContext,
          contentLength: text.length,
        })
      }
    }
  }

  const handleGenerate = async () => {
    // En mode test, on bypass la vérification d'accès
    if (!isTestMode()) {
      // Vérifier l'accès avant de générer
      const email = you.email?.trim() || null
      if (!email) {
        alert(t.valentine.validationEmailRequired)
        return
      }

      // Sauvegarder l'email pour la vérification
      localStorage.setItem(`last_email_valentine-2026`, email)

      const access = await checkAccessFromURL('valentine-2026')
      if (!access.hasAccess) {
        // Rediriger vers la page de tarification
        router.push('/pricing?redirect=valentine-2026')
        return
      }
    } else {
      // En mode test, sauvegarder quand même l'email si fourni
      const email = you.email?.trim() || null
      if (email) {
        localStorage.setItem(`last_email_valentine-2026`, email)
      }
    }

    setEmailStatus('idle')
    setLoading(true)
    try {
      const lang = (settings.language || 'fr') as 'en' | 'fr' | 'es'

      if (!you.birth_date || !you.birth_time || !partner.birth_date || !partner.birth_time) {
        alert(t.valentine.validationBirthDateTimeRequired)
        return
      }

      // Vérifier les coordonnées avec un message plus spécifique
      console.log('[SaintValentin] Validation - You:', { latitude: you.latitude, longitude: you.longitude, place: you.birth_place })
      console.log('[SaintValentin] Validation - Partner:', { latitude: partner.latitude, longitude: partner.longitude, place: partner.birth_place })
      
      if (you.latitude === 0 || you.longitude === 0 || !you.latitude || !you.longitude) {
        console.error('[SaintValentin] Validation failed - You coordinates missing')
        alert(t.locale === 'fr' 
          ? 'Veuillez sélectionner votre lieu de naissance dans la liste déroulante'
          : t.locale === 'es'
          ? 'Por favor seleccione su lugar de nacimiento de la lista desplegable'
          : 'Please select your birth place from the dropdown list')
        setLoading(false)
        return
      }
      if (partner.latitude === 0 || partner.longitude === 0 || !partner.latitude || !partner.longitude) {
        console.error('[SaintValentin] Validation failed - Partner coordinates missing')
        alert(t.locale === 'fr' 
          ? 'Veuillez sélectionner le lieu de naissance du partenaire dans la liste déroulante'
          : t.locale === 'es'
          ? 'Por favor seleccione el lugar de nacimiento de la pareja de la lista desplegable'
          : 'Please select the partner\'s birth place from the dropdown list')
        setLoading(false)
        return
      }

      if (!you.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(you.email.trim())) {
        alert(t.valentine.validationEmailRequired)
        return
      }

      const chartYouResponse = await apiClient.natal.calculate({
        birth_date: you.birth_date,
        birth_time: you.birth_time,
        birth_place: you.birth_place,
        latitude: you.latitude,
        longitude: you.longitude,
        timezone: you.timezone || 'UTC',
        birth_city: you.birth_place || undefined,
        house_system: settings.houseSystem || 'placidus',
        include_aspects: true,
        include_extra_objects: settings.includeExtraObjects ?? true,
      })
      if (chartYouResponse.error) throw new Error(chartYouResponse.error)
      const chartYou = chartYouResponse.data
      if (!chartYou) throw new Error('Chart response is empty')

      const chartPartnerResponse = await apiClient.natal.calculate({
        birth_date: partner.birth_date,
        birth_time: partner.birth_time,
        birth_place: partner.birth_place,
        latitude: partner.latitude,
        longitude: partner.longitude,
        timezone: partner.timezone || 'UTC',
        birth_city: partner.birth_place || undefined,
        house_system: settings.houseSystem || 'placidus',
        include_aspects: true,
        include_extra_objects: settings.includeExtraObjects ?? true,
      })
      if (chartPartnerResponse.error) throw new Error(chartPartnerResponse.error)
      const chartPartner = chartPartnerResponse.data
      if (!chartPartner) throw new Error('Chart response is empty')

      const { systemPrompt, userPrompt } = generateValentinePrompt({
        language: lang,
        youName: you.firstName || undefined,
        partnerName: partner.firstName || undefined,
        relationshipContext: relationshipContext || undefined,
        chartYou: chartYou as any,
        chartPartner: chartPartner as any,
      })

      const response = await apiClient.ai.interpret(userPrompt, systemPrompt)
      if (response.error) throw new Error(response.error)

      const result = (response.data?.content || '').trim()
      if (!result) throw new Error('Empty response')

      const cleanedResult = cleanText(result)
      setContent(cleanedResult)
      await sendPdfByEmail(cleanedResult)
    } catch (err: any) {
      console.error('[SaintValentin] Error generating:', err)
      const errorMsg = err?.message || String(err)
      alert(t.valentine.errorGenerating.replace('{error}', errorMsg))
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadPdf = async () => {
    if (!content) return
    setDownloading(true)
    try {
      const lang = (settings.language || 'fr') as 'en' | 'fr' | 'es'
      const pdfPromise = pdf(
        createElement(ValentinePdf, {
          content,
          language: lang,
          youName: you.firstName || undefined,
          partnerName: partner.firstName || undefined,
          relationshipContext: relationshipContext || undefined,
        }),
      ).toBlob()
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('PDF generation timeout')), 30000))

      const blob = (await Promise.race([pdfPromise, timeoutPromise])) as Blob
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const baseName = t.locale === 'fr' ? 'Duo-relationnel' : t.locale === 'es' ? 'Duo-relacional' : 'Relational-Duo'
      const defaultName = t.locale === 'fr' ? 'lecture' : t.locale === 'es' ? 'lectura' : 'reading'
      link.download = `${baseName}-${you.firstName || defaultName}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('Error generating PDF', err)
      const errorMessage = err?.message || err?.toString() || 'Unknown error'
      let userMessage: string
      if (errorMessage.includes('timeout')) {
        if (t.locale === 'fr') {
          userMessage = 'La génération du PDF prend trop de temps. Veuillez réessayer.'
        } else if (t.locale === 'es') {
          userMessage = 'La generación del PDF tarda demasiado. Inténtalo de nuevo.'
        } else {
          userMessage = 'PDF generation is taking too long. Please try again.'
        }
      } else {
        if (t.locale === 'fr') {
          userMessage = `Échec de la génération du PDF: ${errorMessage}`
        } else if (t.locale === 'es') {
          userMessage = `Error al generar el PDF: ${errorMessage}`
        } else {
          userMessage = `Failed to generate PDF: ${errorMessage}`
        }
      }
      alert(userMessage)
    } finally {
      setDownloading(false)
    }
  }

  const pdfSubtitle = String(t.valentine.title || 'Duo relationnel').replace(/&/g, '-')

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
            <Users className="h-8 w-8 text-cosmic-gold" />
            <h1 className="text-3xl font-bold text-cosmic-gold">{t.valentine.title}</h1>
          </div>

          {isTestMode() || (hasAccess !== null && hasAccess) ? (
            // Afficher le formulaire en mode test ou si l'utilisateur a accès
            <div className="space-y-6">
              {isTestMode() && (
                <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
                  <p className="text-yellow-200 text-sm font-semibold">
                    🧪 MODE TEST ACTIVÉ - Vous pouvez tester la génération sans payer
                  </p>
                </div>
              )}
              
              {checkingAccess ? (
                <div className="text-center py-16">
                  <Loader2 className="h-12 w-12 text-cosmic-gold mx-auto animate-spin" />
                  <p className="text-white/85 mt-4">Vérification de l'accès...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {/* Formulaire pour "Vous" */}
                  <div className="bg-cosmic-purple/40 rounded-lg p-6 border border-cosmic-gold/20">
                    <h2 className="text-xl font-bold text-cosmic-gold mb-4">
                      {t.locale === 'fr' ? 'Vos informations' : t.locale === 'es' ? 'Tus datos' : 'Your information'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          {t.locale === 'fr' ? 'Prénom' : t.locale === 'es' ? 'Nombre' : 'First name'}
                        </label>
                        <input
                          type="text"
                          value={you.firstName}
                          onChange={(e) => setYou({ ...you, firstName: e.target.value })}
                          className="w-full px-4 py-2 bg-cosmic-purple/60 border border-cosmic-gold/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cosmic-gold"
                          placeholder={t.locale === 'fr' ? 'Votre prénom' : t.locale === 'es' ? 'Tu nombre' : 'Your first name'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          {t.locale === 'fr' ? 'Email' : 'Email'}
                        </label>
                        <input
                          type="email"
                          value={you.email}
                          onChange={(e) => setYou({ ...you, email: e.target.value })}
                          className="w-full px-4 py-2 bg-cosmic-purple/60 border border-cosmic-gold/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cosmic-gold"
                          placeholder="votre@email.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          {t.locale === 'fr' ? 'Date de naissance' : t.locale === 'es' ? 'Fecha de nacimiento' : 'Birth date'}
                        </label>
                        <input
                          type="date"
                          value={you.birth_date}
                          onChange={(e) => {
                            const value = e.target.value
                            // Limiter l'année à 4 chiffres
                            if (value) {
                              const parts = value.split('-')
                              if (parts[0] && parts[0].length > 4) {
                                parts[0] = parts[0].slice(0, 4)
                                setYou({ ...you, birth_date: parts.join('-') })
                                return
                              }
                            }
                            setYou({ ...you, birth_date: value })
                          }}
                          max="9999-12-31"
                          className="w-full px-4 py-2 bg-cosmic-purple/60 border border-cosmic-gold/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cosmic-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          {t.locale === 'fr' ? 'Heure de naissance' : t.locale === 'es' ? 'Hora de nacimiento' : 'Birth time'}
                        </label>
                        <input
                          type="time"
                          value={you.birth_time}
                          onChange={(e) => setYou({ ...you, birth_time: e.target.value })}
                          className="w-full px-4 py-2 bg-cosmic-purple/60 border border-cosmic-gold/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cosmic-gold"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <LocationInput
                          value={you.birth_place}
                          onChange={(place) => {
                            setYou({ ...you, birth_place: place })
                          }}
                          onLocationSelect={(location) => {
                            console.log('[SaintValentin] Your location selected:', location)
                            const lat = Number(location.latitude)
                            const lng = Number(location.longitude)
                            console.log('[SaintValentin] Your coordinates parsed:', { lat, lng, isValid: !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0 })
                            setYou({ 
                              ...you, 
                              birth_place: location.name, 
                              latitude: lat, 
                              longitude: lng, 
                              timezone: location.timezone || you.timezone 
                            })
                          }}
                          placeholder={t.locale === 'fr' ? 'Lieu de naissance' : t.locale === 'es' ? 'Lugar de nacimiento' : 'Birth place'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Formulaire pour "Partenaire" */}
                  <div className="bg-cosmic-purple/40 rounded-lg p-6 border border-cosmic-gold/20">
                    <h2 className="text-xl font-bold text-cosmic-gold mb-4">
                      {t.locale === 'fr' ? 'Informations du partenaire' : t.locale === 'es' ? 'Datos de la pareja' : 'Partner information'}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          {t.locale === 'fr' ? 'Prénom' : t.locale === 'es' ? 'Nombre' : 'First name'}
                        </label>
                        <input
                          type="text"
                          value={partner.firstName}
                          onChange={(e) => setPartner({ ...partner, firstName: e.target.value })}
                          className="w-full px-4 py-2 bg-cosmic-purple/60 border border-cosmic-gold/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cosmic-gold"
                          placeholder={t.locale === 'fr' ? 'Prénom du partenaire' : t.locale === 'es' ? 'Nombre de la pareja' : 'Partner first name'}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          {t.locale === 'fr' ? 'Date de naissance' : t.locale === 'es' ? 'Fecha de nacimiento' : 'Birth date'}
                        </label>
                        <input
                          type="date"
                          value={partner.birth_date}
                          onChange={(e) => {
                            const value = e.target.value
                            // Limiter l'année à 4 chiffres
                            if (value) {
                              const parts = value.split('-')
                              if (parts[0] && parts[0].length > 4) {
                                parts[0] = parts[0].slice(0, 4)
                                setPartner({ ...partner, birth_date: parts.join('-') })
                                return
                              }
                            }
                            setPartner({ ...partner, birth_date: value })
                          }}
                          max="9999-12-31"
                          className="w-full px-4 py-2 bg-cosmic-purple/60 border border-cosmic-gold/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cosmic-gold"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white/90 mb-2">
                          {t.locale === 'fr' ? 'Heure de naissance' : t.locale === 'es' ? 'Hora de nacimiento' : 'Birth time'}
                        </label>
                        <input
                          type="time"
                          value={partner.birth_time}
                          onChange={(e) => setPartner({ ...partner, birth_time: e.target.value })}
                          step="1"
                          className="w-full px-4 py-2 bg-cosmic-purple/60 border border-cosmic-gold/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cosmic-gold"
                          placeholder={t.locale === 'fr' ? 'HH:MM' : t.locale === 'es' ? 'HH:MM' : 'HH:MM (24h format)'}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <LocationInput
                          value={partner.birth_place}
                          onChange={(place) => {
                            setPartner({ ...partner, birth_place: place })
                          }}
                          onLocationSelect={(location) => {
                            console.log('[SaintValentin] Partner location selected:', location)
                            const lat = Number(location.latitude)
                            const lng = Number(location.longitude)
                            console.log('[SaintValentin] Partner coordinates parsed:', { lat, lng, isValid: !isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0 })
                            setPartner({ 
                              ...partner, 
                              birth_place: location.name, 
                              latitude: lat, 
                              longitude: lng, 
                              timezone: location.timezone || partner.timezone 
                            })
                          }}
                          placeholder={t.locale === 'fr' ? 'Lieu de naissance du partenaire' : t.locale === 'es' ? 'Lugar de nacimiento de la pareja' : 'Partner birth place'}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Contexte relationnel */}
                  <div className="bg-cosmic-purple/40 rounded-lg p-6 border border-cosmic-gold/20">
                    <label className="block text-sm font-medium text-white/90 mb-2">
                      {t.locale === 'fr' ? 'Contexte relationnel (optionnel)' : t.locale === 'es' ? 'Contexto de la relación (opcional)' : 'Relationship context (optional)'}
                    </label>
                    <textarea
                      value={relationshipContext}
                      onChange={(e) => setRelationshipContext(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 bg-cosmic-purple/60 border border-cosmic-gold/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cosmic-gold"
                      placeholder={t.locale === 'fr' ? 'Ex: Nous sommes ensemble depuis 2 ans...' : t.locale === 'es' ? 'Ej: Llevamos 2 años juntos...' : 'Ex: We have been together for 2 years...'}
                    />
                  </div>

                  {/* Boutons */}
                  <div className="flex gap-4 justify-center">
                    <button
                      onClick={handleGenerate}
                      disabled={loading}
                      className="px-8 py-3 bg-cosmic-gold text-cosmic-purple font-bold rounded-lg hover:bg-cosmic-gold/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          {t.locale === 'fr' ? 'Génération...' : t.locale === 'es' ? 'Generando...' : 'Generating...'}
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5" />
                          {t.locale === 'fr' ? 'Générer le dialogue' : t.locale === 'es' ? 'Generar diálogo' : 'Generate dialogue'}
                        </>
                      )}
                    </button>
                    {content && (
                      <button
                        onClick={handleDownloadPdf}
                        disabled={downloading}
                        className="px-8 py-3 bg-magenta-purple text-white font-bold rounded-lg hover:bg-magenta-purple/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {downloading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            {t.locale === 'fr' ? 'Téléchargement...' : t.locale === 'es' ? 'Descargando...' : 'Downloading...'}
                          </>
                        ) : (
                          <>
                            <Gift className="h-5 w-5" />
                            {t.locale === 'fr' ? 'Télécharger PDF' : t.locale === 'es' ? 'Descargar PDF' : 'Download PDF'}
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  {content && (
                    <div className="mt-6 flex justify-center px-2">
                      <TextNarrationControls
                        text={content}
                        language={(settings.language || 'fr') as 'en' | 'fr' | 'es'}
                        labels={t.narration}
                        className="items-center text-center sm:items-start sm:text-left"
                      />
                    </div>
                  )}

                  {/* Résultat */}
                  {content && (
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
                          hr: () => null, // Ne pas afficher les séparateurs horizontaux
                          h1: ({ node, ...props }) => {
                              const rawText = Array.isArray(props.children)
                                ? props.children.map((c: any) => (typeof c === 'string' ? c : '')).join('').trim()
                                : (props.children as any)?.toString().trim()
                              const cleaned = rawText.replace(/^\d+\.\d+\)\s+/, '').replace(/^\d+\)\s+/, '').trim()
                              return <h1 {...props} className="dialogue-prose h1">{cleaned}</h1>
                            },
                            h2: ({ node, ...props }) => {
                              const rawText = Array.isArray(props.children)
                                ? props.children.map((c: any) => (typeof c === 'string' ? c : '')).join('').trim()
                                : (props.children as any)?.toString().trim()
                              const cleaned = rawText.replace(/^\d+\.\d+\)\s+/, '').replace(/^\d+\)\s+/, '').trim()
                              return <h2 {...props} className="dialogue-prose h2">{cleaned}</h2>
                            },
                            h3: ({ node, ...props }) => {
                              const rawText = Array.isArray(props.children)
                                ? props.children.map((c: any) => (typeof c === 'string' ? c : '')).join('').trim()
                                : (props.children as any)?.toString().trim()
                              const cleaned = rawText.replace(/^\d+\.\d+\)\s+/, '').replace(/^\d+\)\s+/, '').trim()
                              return <h3 {...props} className="dialogue-prose h3">{cleaned}</h3>
                            },
                            p: ({ node, ...props }) => {
                              const rawText = Array.isArray(props.children)
                                ? props.children.map((c: any) => (typeof c === 'string' ? c : '')).join('').trim()
                                : (props.children as any)?.toString().trim()
                              
                              // Filtrer les lignes qui sont uniquement des traits
                              if (/^[-─—]+$/.test(rawText)) {
                                return null
                              }
                              
                              if (/^\d+\.\d+\)\s+/.test(rawText) || /^\d+\)\s+/.test(rawText)) {
                                const afterNumber = rawText.replace(/^\d+\.\d+\)\s+/, '').replace(/^\d+\)\s+/, '').trim()
                                if (afterNumber.length > 0 && afterNumber.length < 100 && /^\p{Lu}/u.test(afterNumber)) {
                                  return <h2 className="dialogue-prose h2">{afterNumber}</h2>
                                }
                              }
                              
                              // Séparer le texte en lignes et détecter si plusieurs dialogues sont présents
                              const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)
                              const dialogues: Array<{ speaker: string; text: string }> = []
                              
                              for (const line of lines) {
                                const lineSpeakerMatch = line.match(/^([^\n:]{2,80})\s*:\s*(.*)$/s)
                                if (lineSpeakerMatch) {
                                  const speaker = lineSpeakerMatch[1].trim()
                                  const text = lineSpeakerMatch[2].trim()
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
                                      const speakerName = dialogue.speaker
                                      const dialogueText = dialogue.text
                                      
                                      // Vérifier si c'est un dialogue valide
                                      const labelLower = speakerName.toLowerCase()
                                      const isAstro =
                                        labelLower === 'astrologie' ||
                                        labelLower === 'astrology' ||
                                        labelLower === 'astrología' ||
                                        labelLower === 'astrologia'
                                      const isPlanetInSign = /^(soleil|lune|mercure|venus|mars|jupiter|saturne|uranus|neptune|pluton|ascendant|midheaven|mc|asc|sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|ascendant|midheaven)\s+(de|d'|of|of')\s+[\p{L}'’-]+\s+en\s+(belier|bélier|taureau|gemeaux|gémeaux|cancer|lion|vierge|balance|scorpion|sagittaire|capricorne|verseau|poissons|poisson|aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces)/iu.test(speakerName)
                                      const excludedWords = ['naissance', 'atterrissage', 'birth', 'nascimiento', 'gestes', 'actions', 'acciones', 'résumé', 'summary', 'resumen', 'conclusion', 'mode', 'emploi', 'relationnel']
                                      const looksLikeFirstName = /^[\p{L}''\s-]+$/u.test(speakerName) && 
                                        speakerName.length <= 30 && 
                                        speakerName.length >= 2 &&
                                        !excludedWords.some(word => labelLower === word || labelLower.startsWith(word + ' ') || labelLower.endsWith(' ' + word))
                                      const isObservationPhrase = /^(tu\s+(pourrais|remarqueras|noteras|observeras|constateras)|vous\s+(pourriez|remarquerez|noterez|observerez|constaterez)|on\s+(pourrait|remarque|note|observe|constate))\s+/i.test(speakerName)
                                      const isSectionTitle = /^(ce qui marche|what works|lo que funciona|ce qui sécurise|what secures|lo que asegura|ce qui ne marche pas|what doesn't|lo que no funciona|frictions mignonnes|cute frictions|fricciones lindas|3 gestes|3 actions|3 acciones|en résumé|summary|resumen|conclusion)/i.test(labelLower)
                                      
                                      const isDialogue = !isSectionTitle && (isAstro || isPlanetInSign || looksLikeFirstName || isObservationPhrase)
                                      
                                      if (!isDialogue) {
                                        return <p key={idx} className="dialogue-paragraph text-white/95">{dialogueText}</p>
                                      }
                                      
                                      // Rendre la bulle pour ce dialogue (réutiliser la logique existante)
                                      const isAstroSpeaker = isAstro || isPlanetInSign
                                      const isAstrologie = isAstro
                                      const getSymbol = (name: string): string => {
                                        const normalize = (str: string) => str
                                          .toLowerCase()
                                          .normalize('NFD')
                                          .replace(/[\u0300-\u036f]/g, '')
                                          .trim()
                                        const nameNormalized = normalize(name)
                                        const symbols: { [key: string]: string } = {
                                          'saturne': '♄', 'saturn': '♄', 'jupiter': '♃', 'mars': '♂', 'venus': '♀',
                                          'mercure': '☿', 'mercury': '☿', 'soleil': '☉', 'sun': '☉', 'lune': '☽', 'moon': '☽',
                                          'uranus': '♅', 'neptune': '♆', 'pluton': '♇', 'pluto': '♇',
                                          'belier': '♈', 'bélier': '♈', 'aries': '♈', 'taureau': '♉', 'taurus': '♉',
                                          'gemeaux': '♊', 'gémeaux': '♊', 'gemini': '♊', 'cancer': '♋', 'lion': '♌', 'leo': '♌',
                                          'vierge': '♍', 'virgo': '♍', 'balance': '♎', 'libra': '♎', 'scorpion': '♏', 'scorpio': '♏',
                                          'sagittaire': '♐', 'sagittarius': '♐', 'capricorne': '♑', 'capricorn': '♑',
                                          'verseau': '♒', 'aquarius': '♒', 'poissons': '♓', 'poisson': '♓', 'pisces': '♓',
                                        }
                                        return symbols[nameNormalized] || ''
                                      }
                                      const symbol = isAstroSpeaker && !isAstrologie ? getSymbol(speakerName) : ''
                                      const isClient = !isAstroSpeaker
                                      
                                      // Déterminer la position de la bulle - RÈGLES STRICTES
                                      let bubblePositionClass = ''
                                      const youNameLower = (you.firstName || '').toLowerCase().trim()
                                      const partnerNameLower = (partner.firstName || '').toLowerCase().trim()
                                      const speakerNameLower = speakerName.toLowerCase().trim()
                                      
                                      // RÈGLE 1 : Astrologie = largeur complète
                                      if (isAstrologie) {
                                        bubblePositionClass = 'dialogue-bubble-full-width'
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
                                          bubblePositionClass = 'dialogue-bubble-left'
                                        } else if (isPartnerName || isPartnerPlacement) {
                                          bubblePositionClass = 'dialogue-bubble-right'
                                        } else {
                                          // Par défaut si on ne peut pas déterminer (ne devrait pas arriver avec les règles strictes)
                                          bubblePositionClass = 'dialogue-bubble-full-width'
                                        }
                                      }
                                      
                                      return (
                                        <div key={idx} className={`dialogue-bubble ${bubblePositionClass}`}>
                                          <div className="dialogue-bubble-speaker">
                                            {isAstroSpeaker && isAstrologie && (
                                              <Logo variant="symbol" size="sm" className="dialogue-bubble-speaker-symbol" style={{ opacity: 0.35, filter: 'brightness(1.8) contrast(0.85)' }} animated={false} asLink={false} />
                                            )}
                                            {isAstroSpeaker && !isAstrologie && symbol && (
                                              <span className="dialogue-bubble-speaker-symbol">{symbol}</span>
                                            )}
                                            <span className="font-bold">{speakerName}</span>
                                          </div>
                                          <div className="dialogue-bubble-content">
                                            <p className="dialogue-bubble-text">{dialogueText}</p>
                                          </div>
                                        </div>
                                      )
                                    })}
                                  </>
                                )
                              }
                              
                              // Si un seul dialogue ou aucun, utiliser la logique existante
                              const speakerMatch = (rawText || '').match(/^([^\n:]{2,80})\s*:\s*(.*)$/s)
                              
                              // Détecter "Mode d'emploi relationnel" comme titre
                              if (rawText && /^Mode d'emploi relationnel\s*:\s*$/i.test(rawText.trim())) {
                                return <h2 className="dialogue-prose h2 text-cosmic-gold font-bold text-xl mt-6 mb-4">Mode d'emploi relationnel</h2>
                              }
                              
                              // Détecter "naviguer vos orbites" comme sous-titre
                              if (rawText && /^naviguer vos orbites$/i.test(rawText.trim())) {
                                return <h3 className="dialogue-prose h3 text-cosmic-gold/90 font-semibold text-lg mt-4 mb-3">naviguer vos orbites</h3>
                              }
                              
                              // Détecter "Phrase-signature Orbital" et le remplacer par "Orbital" + phrase comme conclusion
                              const signatureMatch = rawText.match(/^Phrase-signature\s+Orbital\s*:\s*(.+)$/i)
                              if (signatureMatch) {
                                const phrase = signatureMatch[1].trim()
                                return (
                                  <div className="mt-8 pt-6 border-t border-cosmic-gold/30">
                                    <p className="text-cosmic-gold font-bold text-lg mb-2">Orbital</p>
                                    <p className="text-white/95 text-base italic leading-relaxed">{phrase}</p>
                                  </div>
                                )
                              }
                              
                              
                              // Détecter "3 gestes relationnels ultra concrets" et s'assurer que le texte suivant est clair
                              if (rawText && /^3\s+gestes\s+relationnels\s+ultra\s+concrets\s*:/i.test(rawText.trim())) {
                                return <h2 className="dialogue-prose h2 text-cosmic-gold font-bold text-xl mt-6 mb-4">3 gestes relationnels ultra concrets</h2>
                              }
                              
                              // Détecter et formater les 3 gestes relationnels ultra concrets (format simple)
                              // Chercher les patterns avec numérotation (1., 2., 3.)
                              if (rawText && !speakerMatch && /\d+\./.test(rawText)) {
                                // Séparer les gestes par numéros (1., 2., 3.)
                                const parts = rawText.split(/(?=^\d+\.)/m)
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
                                    <div className="mt-4 mb-6">
                                      {gestes.map((geste, idx) => (
                                        <div key={idx} className="mb-4">
                                          <p className="text-white/95 text-base leading-relaxed mb-2">
                                            <span className="font-bold">{geste.number}.</span>{' '}
                                            {geste.title ? (
                                              <span className="font-semibold">{geste.title} :</span>
                                            ) : null}{' '}
                                            {geste.description}
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  )
                                }
                              }
                              
                              // Détecter "Solution douce" et ne pas le mettre en bulle
                              if (rawText && /^Solution\s+douce\s*:/i.test(rawText.trim())) {
                                const match = rawText.match(/^Solution\s+douce\s*:\s*(.+)$/i)
                                if (match) {
                                  const solutionText = match[1].trim()
                                  return (
                                    <div className="mt-4 mb-4">
                                      <h3 className="dialogue-prose h3 text-cosmic-gold font-semibold text-lg mb-2">Solution douce</h3>
                                      <p className="text-white/95 text-base leading-relaxed">{solutionText}</p>
                                    </div>
                                  )
                                }
                                return <h3 className="dialogue-prose h3 text-cosmic-gold font-semibold text-lg mt-4 mb-3">Solution douce</h3>
                              }
                              
                              const isDialogue = (() => {
                                if (!speakerMatch) return false
                                const label = speakerMatch[1].trim()
                                const labelLower = label.toLowerCase()
                                const dialogueText = speakerMatch[2].trim()
                                
                                // Si pas de texte après les deux-points, ce n'est pas un dialogue
                                if (!dialogueText || dialogueText.length < 3) return false
                                
                                // Exclure "Mode d'emploi relationnel" des dialogues
                                if (labelLower === "mode d'emploi relationnel" || labelLower === "mode d'emploi relationnel") return false
                                
                                const isAstro =
                                  labelLower === 'astrologie' ||
                                  labelLower === 'astrology' ||
                                  labelLower === 'astrología' ||
                                  labelLower === 'astrologia'
                                // Détecter les planètes/signes qui parlent : "Vénus d'Isabelle en Balance", "Lune de OA en Lion", etc.
                                const isPlanetInSign = /^(soleil|lune|mercure|venus|mars|jupiter|saturne|uranus|neptune|pluton|ascendant|midheaven|mc|asc|sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|ascendant|midheaven)\s+(de|d'|of|of')\s+[\p{L}'’-]+\s+en\s+(belier|bélier|taureau|gemeaux|gémeaux|cancer|lion|vierge|balance|scorpion|sagittaire|capricorne|verseau|poissons|poisson|aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces)$/iu.test(label)
                                // Détecter les prénoms simples (plus permissif - accepter jusqu'à 30 caractères, avec espaces, tirets, apostrophes)
                                // Exclure les mots-clés qui ne sont pas des noms
                                const excludedWords = ['naissance', 'atterrissage', 'birth', 'nascimiento', 'gestes', 'actions', 'acciones', 'résumé', 'summary', 'resumen', 'conclusion', 'mode', 'emploi', 'relationnel']
                                const looksLikeFirstName = /^[\p{L}''\s-]+$/u.test(label) && 
                                  label.length <= 30 && 
                                  label.length >= 2 &&
                                  !excludedWords.some(word => labelLower === word || labelLower.startsWith(word + ' ') || labelLower.endsWith(' ' + word))
                                // Détecter les phrases d'observation
                                const isObservationPhrase = /^(tu\s+(pourrais|remarqueras|noteras|observeras|constateras)|vous\s+(pourriez|remarquerez|noterez|observerez|constaterez)|on\s+(pourrait|remarque|note|observe|constate))\s+/i.test(label)
                                
                                // Si c'est un titre de section connu, ce n'est pas un dialogue
                                const isSectionTitle = /^(ce qui marche|what works|lo que funciona|ce qui sécurise|what secures|lo que asegura|ce qui ne marche pas|what doesn't|lo que no funciona|frictions mignonnes|cute frictions|fricciones lindas|3 gestes|3 actions|3 acciones|en résumé|summary|resumen|conclusion)/i.test(labelLower)
                                
                                // Si ça ressemble à un dialogue (a des deux-points et du texte après), c'est probablement un dialogue
                                // Sauf si c'est clairement un titre de section
                                return !isSectionTitle && (isAstro || isPlanetInSign || looksLikeFirstName || isObservationPhrase)
                              })()
                              
                              const speakerName = speakerMatch ? speakerMatch[1].trim() : ''
                              const dialogueText = speakerMatch ? speakerMatch[2].trim() : ''
                              const isAstroSpeaker = (() => {
                                if (!speakerName) return false
                                const labelLower = speakerName.toLowerCase()
                                const isAstro = labelLower === 'astrologie' ||
                                  labelLower === 'astrology' ||
                                  labelLower === 'astrología' ||
                                  labelLower === 'astrologia'
                                // Les planètes/signes qui parlent sont aussi considérés comme "astro"
                                const isPlanetInSign = /^(soleil|lune|mercure|venus|mars|jupiter|saturne|uranus|neptune|pluton|ascendant|midheaven|mc|asc|sun|moon|mercury|venus|mars|jupiter|saturn|uranus|neptune|pluto|ascendant|midheaven)\s+(de|d'|of|of')\s+[\p{L}'’-]+\s+en\s+(belier|bélier|taureau|gemeaux|gémeaux|cancer|lion|vierge|balance|scorpion|sagittaire|capricorne|verseau|poissons|poisson|aries|taurus|gemini|cancer|leo|virgo|libra|scorpio|sagittarius|capricorn|aquarius|pisces)/iu.test(labelLower)
                                return isAstro || isPlanetInSign
                              })()
                              
                              if (isDialogue && speakerMatch && dialogueText) {
                                const getSymbol = (name: string): string => {
                                  const normalize = (str: string) => str
                                    .toLowerCase()
                                    .normalize('NFD')
                                    .replace(/[\u0300-\u036f]/g, '')
                                    .trim()
                                  
                                  const nameNormalized = normalize(name)
                                  const symbols: { [key: string]: string } = {
                                    'saturne': '♄', 'saturn': '♄', 'jupiter': '♃', 'mars': '♂', 'venus': '♀',
                                    'mercure': '☿', 'mercury': '☿', 'soleil': '☉', 'sun': '☉', 'lune': '☽', 'moon': '☽',
                                    'uranus': '♅', 'neptune': '♆', 'pluton': '♇', 'pluto': '♇',
                                    'belier': '♈', 'bélier': '♈', 'aries': '♈', 'taureau': '♉', 'taurus': '♉',
                                    'gemeaux': '♊', 'gémeaux': '♊', 'gemini': '♊', 'cancer': '♋', 'lion': '♌', 'leo': '♌',
                                    'vierge': '♍', 'virgo': '♍', 'balance': '♎', 'libra': '♎', 'scorpion': '♏', 'scorpio': '♏',
                                    'sagittaire': '♐', 'sagittarius': '♐', 'capricorne': '♑', 'capricorn': '♑',
                                    'verseau': '♒', 'aquarius': '♒', 'poissons': '♓', 'poisson': '♓', 'pisces': '♓',
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
                                
                                // Déterminer la position de la bulle pour Duo relationnel - RÈGLES STRICTES
                                let bubblePositionClass = ''
                                const youNameLower = (you.firstName || '').toLowerCase().trim()
                                const partnerNameLower = (partner.firstName || '').toLowerCase().trim()
                                const speakerNameLower = speakerName.toLowerCase().trim()
                                
                                // RÈGLE 1 : Astrologie = largeur complète
                                if (isAstrologie) {
                                  bubblePositionClass = 'dialogue-bubble-full-width'
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
                                    bubblePositionClass = 'dialogue-bubble-left'
                                  } else if (isPartnerName || isPartnerPlacement) {
                                    bubblePositionClass = 'dialogue-bubble-right'
                                  } else {
                                    // Par défaut si on ne peut pas déterminer (ne devrait pas arriver avec les règles strictes)
                                    bubblePositionClass = 'dialogue-bubble-full-width'
                                  }
                                }
                                
                                return (
                                  <div 
                                    key={props.key}
                                    className={`dialogue-bubble ${bubblePositionClass}`}
                                  >
                                    <div className="dialogue-bubble-speaker">
                                      {isAstroSpeaker && isAstrologie && (
                                        <Logo variant="symbol" size="sm" className="dialogue-bubble-speaker-symbol" style={{ opacity: 0.35, filter: 'brightness(1.8) contrast(0.85)' }} animated={false} asLink={false} />
                                      )}
                                      {isAstroSpeaker && !isAstrologie && symbol && (
                                        <span className="dialogue-bubble-speaker-symbol">{symbol}</span>
                                      )}
                                      <span className="font-bold">{speakerName}</span>
                                    </div>
                                    <div className="dialogue-bubble-content">
                                      <p className="dialogue-bubble-text">{dialogueText}</p>
                                    </div>
                                  </div>
                                )
                              }
                              
                              // Texte normal - s'assurer qu'il est lisible (blanc sur fond sombre)
                              // Forcer le texte à être blanc pour éviter tout texte foncé
                              return <p {...props} className="dialogue-paragraph text-white/95 !text-white/95" style={{ color: 'rgba(255, 255, 255, 0.95)' }} />
                            },
                          }}
                        >
                          {content}
                        </ReactMarkdown>
                      </div>

                      <div className="pdf-footnote">Orbital</div>
                    </div>
                  )}

                  {/* Phrase de divertissement */}
                  {content && (
                    <div className="mt-6 pt-4 border-t border-cosmic-gold/20 text-xs text-cosmic-gold/60 italic text-center footnote-small">
                      {t.valentine.disclaimer}
                    </div>
                  )}

                  {/* Statut email */}
                  {emailStatus === 'sent' && (
                    <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-4 flex items-center gap-2">
                      <Check className="h-5 w-5 text-green-400" />
                      <p className="text-green-200">
                        {t.locale === 'fr' ? 'PDF envoyé par email !' : t.locale === 'es' ? '¡PDF enviado por correo!' : 'PDF sent by email!'}
                      </p>
                    </div>
                  )}
                  {emailStatus === 'error' && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                      <p className="text-red-200">
                        {t.locale === 'fr' ? 'Erreur lors de l\'envoi de l\'email' : t.locale === 'es' ? 'Error al enviar el correo' : 'Error sending email'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="max-w-2xl mx-auto"
              >
                <Sparkles className="h-16 w-16 text-cosmic-gold mx-auto mb-6" />
                <h2 className="text-2xl sm:text-3xl font-bold text-cosmic-gold mb-4">
                  {t.locale === 'fr' 
                    ? 'Disponible très bientôt' 
                    : t.locale === 'es'
                    ? 'Disponible muy pronto'
                    : 'Coming very soon'}
                </h2>
                <p className="text-white/85 text-lg leading-relaxed">
                  {t.locale === 'fr'
                    ? 'Cette fonctionnalité sera disponible cette semaine. Reviens bientôt !'
                    : t.locale === 'es'
                    ? 'Esta funcionalidad estará disponible esta semana. ¡Vuelve pronto!'
                    : 'This feature will be available this week. Come back soon!'}
                </p>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

