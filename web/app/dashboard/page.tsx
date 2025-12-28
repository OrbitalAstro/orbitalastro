'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Clock, TrendingUp, BookOpen } from 'lucide-react'
import { useSettingsStore } from '@/lib/store'
import { apiClient } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import InterpretationPanel from '@/components/InterpretationPanel'
import AstrologyInterpretation from '@/components/astrology/AstrologyInterpretation'
import TransitsTimeline from '@/components/TransitsTimeline'
import { InterpretationSkeleton, TransitSkeleton } from '@/components/Skeleton'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useToast } from '@/lib/toast'
import FormField from '@/components/FormField'
import LocationInput from '@/components/LocationInput'
import BackButton from '@/components/BackButton'
import { signFromLongitude } from '@/components/astrology/signTranslations'
import { useTranslation } from '@/lib/useTranslation'
import { formatBirthDateInput } from '@/lib/sanitizeBirthDateYear'

export default function Dashboard() {
  const settings = useSettingsStore()
  const toast = useToast()
  const t = useTranslation()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [birthData, setBirthData] = useState({
    birth_date: settings.defaultBirthDate || '',
    birth_time: settings.defaultBirthTime || '12:00',
    birth_place: '',
    latitude: settings.defaultLatitude || 0,
    longitude: settings.defaultLongitude || 0,
    timezone: settings.defaultTimezone || 'UTC',
  })

  const { data: natalChart, isLoading, error, refetch } = useQuery({
    queryKey: ['natal', birthData],
    queryFn: async () => {
      try {
        const requestBody = {
          ...birthData,
          birth_city: birthData.birth_place || undefined,
          house_system: settings.houseSystem,
          include_extra_objects: settings.includeExtraObjects,
          use_topocentric_moon: settings.useTopocentricMoon,
          include_aspects: settings.includeAspects,
          narrative: {
            tone: settings.narrativeTone as "mythic" | "psychological" | "coaching" | "cinematic" | "soft_therapeutic" | undefined,
            depth: settings.narrativeDepth as "short" | "standard" | "long" | "comprehensive" | undefined,
            focus: settings.narrativeFocus as ("career" | "relationships" | "family" | "spirituality" | "creativity" | "healing")[] | undefined,
          },
        };
        console.log('[Dashboard] Sending request:', requestBody);
        const response = await apiClient.natal.calculate(requestBody);
        console.log('[Dashboard] Received response:', response);
        
        if (response.error) {
          const errorMsg = response.error.includes('fetch') || response.error.includes('Failed to fetch')
            ? 'Cannot connect to backend API. Make sure the backend is running on http://localhost:8000'
            : response.error;
          throw new Error(errorMsg);
        }
        
        if (!response.data) {
          throw new Error(t.dashboard.errorMessage)
        }
        
        toast.success(t.dashboard.success)
        return response.data
      } catch (err: any) {
        console.error('[Dashboard] Error calculating chart:', err);
        throw err;
      }
    },
    enabled: false,
    retry: false,
    onError: (err: Error) => {
      console.error('[Dashboard] Query error:', err);
      const errorMessage = err.message || t.dashboard.errorMessage;
      toast.error(t.dashboard.error, errorMessage);
    },
  })

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    if (!birthData.birth_date) {
      errors.birth_date = 'Birth date is required'
    } else {
      const date = new Date(birthData.birth_date)
      if (date > new Date()) {
        errors.birth_date = 'Birth date cannot be in the future'
      }
    }
    
    if (!birthData.birth_time) {
      errors.birth_time = 'Birth time is required'
    }
    
    if (!birthData.birth_place && (birthData.latitude === 0 || birthData.longitude === 0)) {
      errors.birth_place = 'Birth place is required'
    }
    
    if (birthData.latitude < -90 || birthData.latitude > 90) {
      errors.latitude = 'Latitude must be between -90 and 90'
    }
    
    if (birthData.longitude < -180 || birthData.longitude > 180) {
      errors.longitude = 'Longitude must be between -180 and 180'
    }
    
    if (!birthData.timezone) {
      errors.timezone = 'Timezone is required'
    }
    
    return errors
  }

  const handleCalculate = () => {
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      toast.error('Please fix the form errors')
      return
    }
    setErrors({})
    refetch()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8" aria-labelledby="main-heading">
        <BackButton href="/" />
        <h1 className="text-4xl font-heading font-bold text-white mb-8" id="main-heading">Astrological Dashboard</h1>

        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/20"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label={t.dashboard.birthDate}
              name="birth_date"
              value={birthData.birth_date}
              onChange={(value) => {
                const sanitized = formatBirthDateInput(value)
                setBirthData({ ...birthData, birth_date: sanitized })
                if (errors.birth_date) {
                  setErrors({ ...errors, birth_date: '' })
                }
              }}
              type="text"
              inputMode="numeric"
              pattern="\\d{4}-\\d{2}-\\d{2}"
              required
              error={errors.birth_date}
              success={!!birthData.birth_date && !errors.birth_date}
              icon={Calendar}
              tooltip={t.tooltips.birthDate}
            />
            <FormField
              label={t.dashboard.birthTime}
              name="birth_time"
              value={birthData.birth_time}
              onChange={(value) => {
                setBirthData({ ...birthData, birth_time: value })
                if (errors.birth_time) {
                  setErrors({ ...errors, birth_time: '' })
                }
              }}
              type="time"
              required
              error={errors.birth_time}
              success={!!birthData.birth_time && !errors.birth_time}
              icon={Clock}
              tooltip={t.tooltips.birthTime}
            />
            <LocationInput
              label={t.dashboard.birthPlace}
              value={birthData.birth_place}
              onChange={(value) => {
                setBirthData({ ...birthData, birth_place: value })
                if (errors.birth_place) {
                  setErrors({ ...errors, birth_place: '' })
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
                if (errors.birth_place || errors.timezone) {
                  setErrors({ ...errors, birth_place: '', timezone: '' })
                }
              }}
              placeholder={t.tooltips.locationSearch}
              required
              error={errors.birth_place}
              success={!!birthData.birth_place && !errors.birth_place}
              tooltip={t.tooltips.birthPlace}
            />
            <div className="flex items-end">
              <button
                onClick={handleCalculate}
                disabled={isLoading}
                className="w-full px-6 py-2 bg-gradient-to-r from-cosmic-pink to-cosmic-purple text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cosmic-gold"
                aria-label={t.dashboard.calculateChart}
              >
                {isLoading ? t.dashboard.calculating : t.dashboard.calculateButton}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <BookOpen className="h-6 w-6 mr-2 text-horizon-blue" />
                Interpretation
              </h2>
              <InterpretationSkeleton />
            </div>
            <div className="lg:col-span-2 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <TrendingUp className="h-6 w-6 mr-2 text-aurora-teal" />
                Transits Timeline
              </h2>
              <TransitSkeleton />
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-eclipse-red/20 border border-eclipse-red/50 rounded-xl p-6 text-center">
            <p className="text-white">{t.dashboard.errorMessage}</p>
          </div>
        )}

        {/* Results */}
        {natalChart && !isLoading && (
          <ErrorBoundary>
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Interpretation */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 overflow-hidden relative isolate"
                >
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <BookOpen className="h-6 w-6 mr-2 text-horizon-blue" />
                    Interpretation
                  </h2>
                  <InterpretationPanel chart={natalChart} />
                </motion.div>

                {/* Astrology Interpretation */}
                {natalChart.planets && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 overflow-hidden relative isolate"
                  >
                    <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                      <BookOpen className="h-6 w-6 mr-2 text-cosmic-gold" />
                      {t.interpretation.title}
                    </h2>
                    <AstrologyInterpretation
                      planets={Object.fromEntries(
                        Object.entries(natalChart.planets || {}).map(([key, planet]: [string, any]) => [
                          key,
                          { sign: planet.sign || '', house: planet.house || 0 },
                        ])
                      )}
                      aspects={(natalChart.aspects || []).map((aspect: any) => ({
                        planet1: aspect.body1 || aspect.planet1 || '',
                        planet2: aspect.body2 || aspect.planet2 || '',
                        type: aspect.aspect || aspect.type || '',
                      }))}
                      ascendant={signFromLongitude(natalChart.ascendant || 0)}
                      sunSign={natalChart.planets?.sun?.sign || ''}
                      moonSign={natalChart.planets?.moon?.sign || ''}
                    />
                  </motion.div>
                )}
              </div>

              {/* Transits Timeline */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
              >
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <TrendingUp className="h-6 w-6 mr-2 text-aurora-teal" />
                  Transits Timeline
                </h2>
                <TransitsTimeline natalChart={natalChart} />
              </motion.div>
            </div>
          </ErrorBoundary>
        )}
      </main>
    </div>
  )
}
