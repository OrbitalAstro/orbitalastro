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

export default function Reading2026Page() {
  const settings = useSettingsStore()
  const [birthData, setBirthData] = useState({
    birth_date: settings.defaultBirthDate || '',
    birth_time: settings.defaultBirthTime || '12:00',
    birth_place: '',
    firstName: settings.defaultFirstName || '',
    latitude: settings.defaultLatitude || 0,
    longitude: settings.defaultLongitude || 0,
    timezone: settings.defaultTimezone || 'UTC',
  })

  const [reading, setReading] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
    setReading(null)
  }

  const handleGenerateReading = async () => {
    setLoading(true)
    try {
      // Validate required fields
      if (!birthData.birth_date || !birthData.birth_time) {
        alert('Date et heure de naissance requises')
        setLoading(false)
        return
      }

      if (!birthData.latitude || !birthData.longitude) {
        alert('Lieu de naissance requis')
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
      const { systemPrompt, userPrompt } = generateReadingPrompt(birthData, chart, transits)

      const response = await apiClient.ai.interpret(userPrompt, systemPrompt)

      if (response.error) {
        throw new Error(response.error)
      }

      const readingText = response.data?.content || ''

      setReading(readingText)
    } catch (error: any) {
      console.error('Error generating reading:', error)
      const errorMsg = error.message || 'Erreur inconnue'
      alert(`Erreur lors de la génération de la lecture: ${errorMsg}`)
    } finally {
      setLoading(false)
    }
  }

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
            <Calendar className="h-8 w-8 text-cosmic-gold" />
            <h1 className="text-3xl font-bold text-cosmic-gold">
              Lecture 2026
            </h1>
          </div>

          <p className="text-cosmic-gold/90 mb-6 text-center">
            Découvrez votre lecture astrologique annuelle pour l'année 2026 — Évolution personnelle et mission de vie
          </p>

          {!reading ? (
            <>
              {/* Input Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 relative z-40">
                <div>
                  <label className="block text-sm font-medium text-cosmic-gold mb-2">
                    Prénom ou surnom
                  </label>
                  <input
                    type="text"
                    value={birthData.firstName}
                    onChange={(e) => setBirthData({ ...birthData, firstName: e.target.value })}
                    placeholder="Votre prénom ou surnom"
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-cosmic-gold/30 text-cosmic-gold placeholder-cosmic-gold/50 focus:outline-none focus:border-cosmic-gold relative z-20"
                    suppressHydrationWarning
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-cosmic-gold mb-2">
                    Date de naissance
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
                    placeholder="AAAA-MM-JJ"
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-cosmic-gold/30 text-cosmic-gold placeholder-cosmic-gold/50 focus:outline-none focus:border-cosmic-gold relative z-20"
                    suppressHydrationWarning
                  />
                  <p className="mt-1 text-xs text-cosmic-gold/70">Format: AAAA-MM-JJ (ex: 1976-10-26)</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-cosmic-gold mb-2">
                    Heure de naissance
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
                    label="Lieu de naissance"
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
                    placeholder="Rechercher un lieu..."
                  />
                </div>
              </div>

              <div className="mt-12 mb-4">
                <button
                  onClick={handleGenerateReading}
                  disabled={loading || !birthData.birth_date}
                  className="w-full px-6 py-3 bg-gradient-to-r from-cosmic-gold via-rose-gold to-cosmic-gold text-cosmic-purple rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center relative z-20"
                >
                {loading ? (
                  <>
                    <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Calendar className="h-5 w-5 mr-2" />
                    Générer ma lecture 2026
                  </>
                )}
                </button>
                <div className="flex justify-end mt-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-sm text-cosmic-gold/80 hover:text-cosmic-gold underline"
                    disabled={loading}
                  >
                    Réinitialiser le formulaire
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
                className="bg-gradient-to-br from-cosmic-purple/40 to-magenta-purple/40 rounded-xl p-6 border border-cosmic-gold/20 relative z-10"
              >
                <div className="prose prose-invert max-w-none max-h-[70vh] overflow-y-auto pr-4 custom-scrollbar text-cosmic-gold/90">
                  <ReactMarkdown>{reading}</ReactMarkdown>
                </div>
                {/* Note de bas de page */}
                <div className="mt-6 pt-4 border-t border-cosmic-gold/20 text-sm text-cosmic-gold/70 italic text-center">
                  Ce dialogue est symbolique, un échange interprété pour le plaisir et la réflexion : il est offert à des fins de divertissement et d'inspiration, sans prétention de vérité absolue ni de certitude. - OrbitalAstro.ca
                </div>
              </motion.div>

              <button
                onClick={() => setReading(null)}
                className="mt-6 px-6 py-2 bg-cosmic-gold/20 text-cosmic-gold rounded-lg border border-cosmic-gold/40 hover:bg-cosmic-gold/30 transition"
              >
                Générer une nouvelle lecture
              </button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  )
}
