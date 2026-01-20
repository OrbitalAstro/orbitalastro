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

export default function SaintValentinPage() {
  const settings = useSettingsStore()
  const t = useTranslation()

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

      setContent(result)
      await sendPdfByEmail(result)
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

          <p className="text-cosmic-gold/90 mb-6 text-center">{t.valentine.description}</p>

          {!content ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 relative z-40">
                <div className="md:col-span-2">
                  <h2 className="text-cosmic-gold font-semibold mb-2">{t.valentine.sectionYou}</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cosmic-gold mb-2">{t.valentine.youName}</label>
                  <input
                    type="text"
                    value={you.firstName}
                    onChange={(e) => setYou({ ...you, firstName: e.target.value })}
                    placeholder={t.valentine.youNamePlaceholder}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-cosmic-gold/30 text-cosmic-gold placeholder-cosmic-gold/50 focus:outline-none focus:border-cosmic-gold relative z-20"
                    suppressHydrationWarning
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cosmic-gold mb-2">{t.valentine.email}</label>
                  <input
                    type="email"
                    value={you.email}
                    onChange={(e) => setYou({ ...you, email: e.target.value })}
                    placeholder={t.valentine.emailPlaceholder}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-cosmic-gold/30 text-cosmic-gold placeholder-cosmic-gold/50 focus:outline-none focus:border-cosmic-gold relative z-20"
                    suppressHydrationWarning
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cosmic-gold mb-2">{t.valentine.birthDate}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={you.birth_date}
                    onChange={(e) => setYou({ ...you, birth_date: formatBirthDateInput(e.target.value) })}
                    placeholder={t.valentine.birthDatePlaceholder}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-cosmic-gold/30 text-cosmic-gold placeholder-cosmic-gold/50 focus:outline-none focus:border-cosmic-gold relative z-20"
                    suppressHydrationWarning
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cosmic-gold mb-2">{t.valentine.birthTime}</label>
                  <input
                    type="time"
                    value={you.birth_time}
                    onChange={(e) => setYou({ ...you, birth_time: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-cosmic-gold/30 text-cosmic-gold focus:outline-none focus:border-cosmic-gold relative z-20"
                    suppressHydrationWarning
                  />
                </div>

                <div className="md:col-span-2 relative z-50">
                  <LocationInput
                    value={you.birth_place}
                    onChange={(value) => setYou({ ...you, birth_place: value })}
                    onLocationSelect={(loc) =>
                      setYou({
                        ...you,
                        birth_place: loc.name,
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                        timezone: loc.timezone || 'UTC',
                      })
                    }
                    label={t.valentine.birthPlace}
                    variant="gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 relative z-30">
                <div className="md:col-span-2">
                  <h2 className="text-cosmic-gold font-semibold mb-2">{t.valentine.sectionPartner}</h2>
                </div>

                <div>
                  <label className="block text-sm font-medium text-cosmic-gold mb-2">{t.valentine.partnerName}</label>
                  <input
                    type="text"
                    value={partner.firstName}
                    onChange={(e) => setPartner({ ...partner, firstName: e.target.value })}
                    placeholder={t.valentine.partnerNamePlaceholder}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-cosmic-gold/30 text-cosmic-gold placeholder-cosmic-gold/50 focus:outline-none focus:border-cosmic-gold relative z-20"
                    suppressHydrationWarning
                  />
                </div>

                <div />

                <div>
                  <label className="block text-sm font-medium text-cosmic-gold mb-2">{t.valentine.birthDatePartner}</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={partner.birth_date}
                    onChange={(e) => setPartner({ ...partner, birth_date: formatBirthDateInput(e.target.value) })}
                    placeholder={t.valentine.birthDatePlaceholder}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-cosmic-gold/30 text-cosmic-gold placeholder-cosmic-gold/50 focus:outline-none focus:border-cosmic-gold relative z-20"
                    suppressHydrationWarning
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-cosmic-gold mb-2">{t.valentine.birthTimePartner}</label>
                  <input
                    type="time"
                    value={partner.birth_time}
                    onChange={(e) => setPartner({ ...partner, birth_time: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-cosmic-gold/30 text-cosmic-gold focus:outline-none focus:border-cosmic-gold relative z-20"
                    suppressHydrationWarning
                  />
                </div>

                <div className="md:col-span-2 relative z-40">
                  <LocationInput
                    value={partner.birth_place}
                    onChange={(value) => setPartner({ ...partner, birth_place: value })}
                    onLocationSelect={(loc) =>
                      setPartner({
                        ...partner,
                        birth_place: loc.name,
                        latitude: loc.latitude,
                        longitude: loc.longitude,
                        timezone: loc.timezone || 'UTC',
                      })
                    }
                    label={t.valentine.birthPlacePartner}
                    variant="gold"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-cosmic-gold mb-2">{t.valentine.relationshipContext}</label>
                  <textarea
                    value={relationshipContext}
                    onChange={(e) => setRelationshipContext(e.target.value)}
                    placeholder={t.valentine.relationshipContextPlaceholder}
                    rows={3}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-cosmic-gold/30 text-cosmic-gold placeholder-cosmic-gold/50 focus:outline-none focus:border-cosmic-gold"
                    suppressHydrationWarning
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleGenerate}
                disabled={loading}
                className="w-full bg-gradient-to-r from-cosmic-gold to-yellow-500 text-black font-semibold py-4 px-6 rounded-lg flex items-center justify-center gap-2 hover:from-cosmic-gold/90 hover:to-yellow-500/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                {loading ? (
                  <>
                    <Sparkles className="h-5 w-5 animate-spin" />
                    {t.valentine.generating}
                  </>
                ) : (
                  <>
                    <Heart className="h-5 w-5" />
                    {t.valentine.generate}
                  </>
                )}
              </motion.button>

              <div className="text-center mb-6">
                {emailStatus === 'sending' ? (
                  <p className="text-cosmic-gold/80 text-sm">{t.valentine.emailSending}</p>
                ) : emailStatus === 'sent' ? (
                  <p className="text-green-400 text-sm">{t.valentine.emailSent.replace('{email}', you.email)}</p>
                ) : emailStatus === 'error' ? (
                  <p className="text-red-400 text-sm">{t.valentine.emailFailed}</p>
                ) : null}
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetForm}
                className="w-full bg-white/10 text-cosmic-gold font-medium py-3 px-6 rounded-lg hover:bg-white/20 transition-all"
              >
                {t.valentine.resetForm}
              </motion.button>

              <p className="text-cosmic-gold/70 text-sm mt-6 text-center">{t.valentine.disclaimer}</p>
            </>
          ) : (
            <>
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
                    {downloading ? t.valentine.downloadingPdf : t.valentine.downloadPdf}
                  </button>
                </div>

                <div className="pdf-card max-w-3xl mx-auto">
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
                    <ReactMarkdown className="dialogue-prose px-6 py-4 pdf-body pdf-panel">{content}</ReactMarkdown>
                  </div>

                  <div className="pdf-footnote">{pdfSubtitle}</div>
                </div>

                <div className="mt-6 pt-4 border-t border-cosmic-gold/20 text-xs text-cosmic-gold/60 italic text-center footnote-small">
                  {t.valentine.disclaimer}
                </div>
              </motion.div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={resetForm}
                className="w-full bg-white/10 text-cosmic-gold font-medium py-3 px-6 rounded-lg hover:bg-white/20 transition-all"
              >
                {t.valentine.generateAnother}
              </motion.button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}

