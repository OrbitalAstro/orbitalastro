'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Sparkles, Calendar } from 'lucide-react'
import { useSettingsStore } from '@/lib/store'
import { apiClient } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'

export default function Stories() {
  const settings = useSettingsStore()
  const [birthData, setBirthData] = useState({
    birth_date: '',
    birth_time: '12:00',
    latitude: settings.defaultLatitude || 0,
    longitude: settings.defaultLongitude || 0,
    timezone: settings.defaultTimezone,
  })

  const { data: natalChart } = useQuery({
    queryKey: ['natal-for-story', birthData],
    queryFn: async () => {
      const response = await apiClient.natal.calculate({
        ...birthData,
        house_system: settings.houseSystem,
        include_aspects: true,
      })
      return response.data
    },
    enabled: false,
  })

  const [story, setStory] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const generateStory = async () => {
    if (!natalChart) return
    
    setLoading(true)
    try {
      // In a real implementation, you'd call an LLM API here
      // For now, we'll generate a placeholder story
      const storyText = `# Your Cosmic Story

## The ${natalChart.planets?.sun?.sign || 'Unknown'} Sun

Your Sun in ${natalChart.planets?.sun?.sign || 'Unknown'} illuminates your core essence. This ${settings.narrativeTone} placement suggests...

## The ${natalChart.planets?.moon?.sign || 'Unknown'} Moon

Your Moon in ${natalChart.planets?.moon?.sign || 'Unknown'} reflects your emotional nature...

## The Journey Ahead

With your Ascendant in ${natalChart.planets ? Object.values(natalChart.planets)[0]?.sign : 'Unknown'}, you approach life with...

*This is a generated interpretation. For a full personalized reading, please use the interpretation panel.*`
      
      setStory(storyText)
    } catch (error) {
      console.error('Error generating story:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20"
        >
          <h1 className="text-3xl font-bold text-white mb-8 flex items-center">
            <BookOpen className="h-8 w-8 mr-3 text-yellow-400" />
            Your Astrological Story
          </h1>

          {/* Input Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
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
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Latitude
              </label>
              <input
                type="number"
                value={birthData.latitude}
                onChange={(e) => setBirthData({ ...birthData, latitude: parseFloat(e.target.value) })}
                step="0.0001"
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                Longitude
              </label>
              <input
                type="number"
                value={birthData.longitude}
                onChange={(e) => setBirthData({ ...birthData, longitude: parseFloat(e.target.value) })}
                step="0.0001"
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>

          <button
            onClick={async () => {
              if (birthData.birth_date) {
                // First get the chart
                const chartResponse = await apiClient.natal.calculate({
                  ...birthData,
                  house_system: settings.houseSystem,
                  include_aspects: true,
                })
                // Then generate story
                await generateStory()
              }
            }}
            disabled={loading || !birthData.birth_date}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 mb-8"
          >
            {loading ? 'Generating Story...' : 'Generate Your Story'}
          </button>

          {/* Story Display */}
          {story && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-xl p-6 border border-white/10"
            >
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{story}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

