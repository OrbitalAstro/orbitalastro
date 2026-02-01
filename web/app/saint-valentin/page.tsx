'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Heart, Sparkles } from 'lucide-react'
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
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { cleanText } from '@/lib/cleanText'
import Starfield from '@/components/Starfield'

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

  // Vérifier l'accès au chargement de la page
  useEffect(() => {
    const checkAccess = async () => {
      // Récupérer l'email depuis localStorage ou le formulaire
      const savedEmail = localStorage.getItem('last_email_valentine-2026')
      const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement
      const email = emailInput?.value || savedEmail || null

      const access = await checkAccessFromURL('valentine-2026')
      setHasAccess(access)
      setCheckingAccess(false)
      
      if (access) {
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
      if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`)

      setEmailStatus('sent')
    } catch (err) {
      console.error('[SaintValentin] Failed to email PDF:', err)
      setEmailStatus('error')
    }
  }

  const handleGenerate = async () => {
    // Vérifier l'accès avant de générer
    const email = you.email?.trim() || null
    if (!email) {
      alert(t.valentine.validationEmailRequired)
      return
    }

    // Sauvegarder l'email pour la vérification
    localStorage.setItem(`last_email_valentine-2026`, email)

    const access = await checkAccessFromURL('valentine-2026')
    if (!access) {
      // Rediriger vers la page de tarification
      router.push('/pricing?redirect=valentine-2026')
      return
    }

    setEmailStatus('idle')
    setLoading(true)
    try {
      const lang = (settings.language || 'fr') as 'en' | 'fr' | 'es'

      if (!you.birth_date || !you.birth_time || !partner.birth_date || !partner.birth_time) {
        alert(t.valentine.validationBirthDateTimeRequired)
        return
      }

      if (!you.latitude || !you.longitude || !partner.latitude || !partner.longitude) {
        alert(t.valentine.validationBirthPlaceRequired)
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
        <ValentinePdf
          content={content}
          language={lang}
          youName={you.firstName || undefined}
          partnerName={partner.firstName || undefined}
          relationshipContext={relationshipContext || undefined}
        />,
      ).toBlob()
      const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('PDF generation timeout')), 30000))

      const blob = (await Promise.race([pdfPromise, timeoutPromise])) as Blob
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const baseName = t.locale === 'fr' ? 'Synastrie-Saint-Valentin' : t.locale === 'es' ? 'Sinastria-San-Valentin' : 'Valentine-Synastry'
      const defaultName = t.locale === 'fr' ? 'lecture' : t.locale === 'es' ? 'lectura' : 'reading'
      link.download = `${baseName}-${you.firstName || defaultName}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err: any) {
      console.error('Error generating PDF', err)
      const errorMessage = err?.message || err?.toString() || 'Unknown error'
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

  const pdfSubtitle = (t.valentine.title || 'Synastrie Saint-Valentin')
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
            <Heart className="h-8 w-8 text-cosmic-gold" />
            <h1 className="text-3xl font-bold text-cosmic-gold">{t.valentine.title}</h1>
          </div>

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
        </motion.div>
      </div>
    </div>
  )
}

