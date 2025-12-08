'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, MapPin, Clock, Sparkles, TrendingUp, BookOpen } from 'lucide-react'
import { useSettingsStore } from '@/lib/store'
import { apiClient } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import ChartVisualization from '@/components/ChartVisualization'
import InterpretationPanel from '@/components/InterpretationPanel'
import TransitsTimeline from '@/components/TransitsTimeline'
import { ChartSkeleton, InterpretationSkeleton, TransitSkeleton } from '@/components/Skeleton'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { useToast } from '@/lib/toast'
import ChartHistory from '@/components/ChartHistory'
import { useChartHistory } from '@/lib/store'
import FormField from '@/components/FormField'

export default function Dashboard() {
  const settings = useSettingsStore()
  const toast = useToast()
  const { addToHistory } = useChartHistory()
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [birthData, setBirthData] = useState({
    birth_date: '',
    birth_time: '12:00',
    latitude: settings.defaultLatitude || 0,
    longitude: settings.defaultLongitude || 0,
    timezone: settings.defaultTimezone,
  })

  const { data: natalChart, isLoading, error, refetch } = useQuery({
    queryKey: ['natal', birthData],
    queryFn: async () => {
      try {
        const response = await apiClient.natal.calculate({
          ...birthData,
          house_system: settings.houseSystem,
          include_extra_objects: settings.includeExtraObjects,
          use_topocentric_moon: settings.useTopocentricMoon,
          include_aspects: settings.includeAspects,
          narrative: {
            tone: settings.narrativeTone,
            depth: settings.narrativeDepth,
            focus: settings.narrativeFocus,
          },
        })
        const chartData = response.data
        addToHistory(chartData, birthData)
        toast.success('Chart calculated successfully!')
        return chartData
      } catch (err: any) {
        toast.error('Failed to calculate chart', err?.response?.data?.detail || 'Please check your input and try again')
        throw err
      }
    },
    enabled: false,
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
        <h1 className="text-4xl font-heading font-bold text-white mb-8" id="main-heading">Astrological Dashboard</h1>

        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/20"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              label="Birth Date"
              name="birth_date"
              value={birthData.birth_date}
              onChange={(value) => {
                setBirthData({ ...birthData, birth_date: value })
                if (errors.birth_date) {
                  setErrors({ ...errors, birth_date: '' })
                }
              }}
              type="date"
              required
              error={errors.birth_date}
              success={!!birthData.birth_date && !errors.birth_date}
              icon={Calendar}
              tooltip="The date of birth in local time"
            />
            <FormField
              label="Birth Time"
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
              tooltip="The time of birth in local time (24-hour format)"
            />
            <FormField
              label="Timezone"
              name="timezone"
              value={birthData.timezone}
              onChange={(value) => {
                setBirthData({ ...birthData, timezone: value })
                if (errors.timezone) {
                  setErrors({ ...errors, timezone: '' })
                }
              }}
              placeholder="America/New_York"
              required
              error={errors.timezone}
              success={!!birthData.timezone && !errors.timezone}
              icon={MapPin}
              tooltip="IANA timezone identifier (e.g., America/New_York, Europe/London)"
            />
            <FormField
              label="Latitude"
              name="latitude"
              value={birthData.latitude}
              onChange={(value) => {
                setBirthData({ ...birthData, latitude: value })
                if (errors.latitude) {
                  setErrors({ ...errors, latitude: '' })
                }
              }}
              type="number"
              step="0.0001"
              min={-90}
              max={90}
              required
              error={errors.latitude}
              success={birthData.latitude !== 0 && !errors.latitude}
              tooltip="Latitude in decimal degrees (-90 to 90)"
            />
            <FormField
              label="Longitude"
              name="longitude"
              value={birthData.longitude}
              onChange={(value) => {
                setBirthData({ ...birthData, longitude: value })
                if (errors.longitude) {
                  setErrors({ ...errors, longitude: '' })
                }
              }}
              type="number"
              step="0.0001"
              min={-180}
              max={180}
              required
              error={errors.longitude}
              success={birthData.longitude !== 0 && !errors.longitude}
              tooltip="Longitude in decimal degrees (-180 to 180)"
            />
            <div className="flex items-end">
              <button
                onClick={handleCalculate}
                disabled={isLoading}
                className="w-full px-6 py-2 bg-gradient-to-r from-cosmic-pink to-cosmic-purple text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-cosmic-gold"
                aria-label="Calculate natal chart"
              >
                {isLoading ? 'Calculating...' : 'Calculate Chart'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                <Sparkles className="h-6 w-6 mr-2 text-cosmic-gold" />
                Natal Chart
              </h2>
              <ChartSkeleton />
            </div>
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
            <p className="text-white">Failed to calculate chart. Please check your input and try again.</p>
          </div>
        )}

        {/* Results */}
        {natalChart && !isLoading && (
          <ErrorBoundary>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Chart Visualization */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
              >
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Sparkles className="h-6 w-6 mr-2 text-cosmic-gold" />
                  Natal Chart
                </h2>
                <ChartVisualization chart={natalChart} />
              </motion.div>

              {/* Interpretation */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
              >
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <BookOpen className="h-6 w-6 mr-2 text-horizon-blue" />
                  Interpretation
                </h2>
                <InterpretationPanel chart={natalChart} />
              </motion.div>

              {/* Transits Timeline */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="lg:col-span-2 bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
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
      <ChartHistory onLoadChart={(chart) => {
        // This would need to be handled by parent state management
        // For now, we'll just show a toast
        toast.info('Chart loaded from history. Recalculate to view.')
      }} />
    </div>
  )
}

