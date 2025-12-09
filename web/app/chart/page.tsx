'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { useSettingsStore } from '@/lib/store'
import { apiClient } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import ChartVisualization from '@/components/ChartVisualization'
import BackButton from '@/components/BackButton'

export default function ChartPage() {
  const settings = useSettingsStore()
  const [birthData, setBirthData] = useState({
    birth_date: '',
    birth_time: '12:00',
    latitude: settings.defaultLatitude || 0,
    longitude: settings.defaultLongitude || 0,
    timezone: settings.defaultTimezone,
  })

  const { data: natalChart, isLoading, refetch } = useQuery({
    queryKey: ['natal-chart', birthData],
    queryFn: async () => {
      const response = await apiClient.natal.calculate({
        ...birthData,
        house_system: settings.houseSystem,
        include_extra_objects: settings.includeExtraObjects,
        use_topocentric_moon: settings.useTopocentricMoon,
        include_aspects: settings.includeAspects,
      })
      return response.data
    },
    enabled: false,
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton href="/" />
        <h1 className="text-4xl font-bold text-white mb-8 flex items-center">
          <Sparkles className="h-10 w-10 mr-3 text-yellow-400" />
          Chart Visualization
        </h1>

        {/* Input Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/20"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Birth Date
              </label>
              <input
                type="date"
                value={birthData.birth_date}
                onChange={(e) => setBirthData({ ...birthData, birth_date: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Birth Time
              </label>
              <input
                type="time"
                value={birthData.birth_time}
                onChange={(e) => setBirthData({ ...birthData, birth_time: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => refetch()}
                disabled={isLoading || !birthData.birth_date}
                className="w-full px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
              >
                {isLoading ? 'Loading...' : 'Generate Chart'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Chart Display */}
        {natalChart && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20"
          >
            <ChartVisualization chart={natalChart} />
          </motion.div>
        )}
      </div>
    </div>
  )
}

