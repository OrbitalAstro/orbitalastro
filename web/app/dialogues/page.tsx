'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Sparkles } from 'lucide-react'
import { useSettingsStore } from '@/lib/store'
import { apiClient } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'

export default function Dialogues() {
  const settings = useSettingsStore()
  const [birthData, setBirthData] = useState({
    birth_date: '',
    birth_time: '12:00',
    latitude: settings.defaultLatitude || 0,
    longitude: settings.defaultLongitude || 0,
    timezone: settings.defaultTimezone,
  })

  const [dialogue, setDialogue] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const generateDialogue = async () => {
    setLoading(true)
    try {
      // Get natal chart first
      const chartResponse = await apiClient.natal.calculate({
        ...birthData,
        house_system: settings.houseSystem,
        include_aspects: true,
      })
      
      const chart = chartResponse.data
      
      // Generate pre-incarnation dialogue
      // In a real implementation, this would call your LLM API
      const dialogueText = `# Pre-Incarnation Dialogue

## Act I: The Chamber of Arrival

*The scene opens in a vast, star-filled chamber. The Sun and Moon stand as luminous figures.*

**Sun**: Welcome, soul. You are about to embark on a journey into the realm of ${chart.planets?.sun?.sign || 'mystery'}.

**Moon**: Your emotional nature will be shaped by ${chart.planets?.moon?.sign || 'the cosmos'}, in the ${chart.planets?.moon?.house || 'first'} house of your being.

**Ascendant** (as Threshold Guardian): I am the mask you will wear, the ${chart.planets ? Object.values(chart.planets)[0]?.sign : 'first'} face you show to the world.

## Act II: The Council of Themes

*Chiron enters, limping but radiant.*

**Chiron**: I bring you the wound that will become your greatest gift. In ${chart.planets?.chiron?.sign || 'mystery'}, you will learn to heal others through your own pain.

*The planets gather, each speaking their piece...*

## Act III-V: The Descent

*The dialogue continues, weaving together all the planetary themes into a mythopoetic narrative of your cosmic origins.*

---

*This is a generated pre-incarnation dialogue. For a full personalized version, integrate with your LLM service.*`
      
      setDialogue(dialogueText)
    } catch (error) {
      console.error('Error generating dialogue:', error)
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
            <MessageSquare className="h-8 w-8 mr-3 text-yellow-400" />
            Pre-Incarnation Dialogue
          </h1>

          <p className="text-white/70 mb-6">
            Generate a mythopoetic dialogue exploring your cosmic origins and the themes 
            that will shape your earthly journey.
          </p>

          {/* Input Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
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
            onClick={generateDialogue}
            disabled={loading || !birthData.birth_date}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 mb-8 flex items-center justify-center"
          >
            {loading ? (
              <>
                <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                Generating Dialogue...
              </>
            ) : (
              'Generate Pre-Incarnation Dialogue'
            )}
          </button>

          {/* Dialogue Display */}
          {dialogue && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-xl p-6 border border-white/10"
            >
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{dialogue}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

