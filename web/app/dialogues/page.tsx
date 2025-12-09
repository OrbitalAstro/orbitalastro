'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Sparkles } from 'lucide-react'
import { useSettingsStore } from '@/lib/store'
import { apiClient } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import LocationInput from '@/components/LocationInput'
import BackButton from '@/components/BackButton'
import { generateDialogue } from '@/lib/gemini'
import { useTranslation } from '@/lib/useTranslation'

export default function Dialogues() {
  const settings = useSettingsStore()
  const t = useTranslation()
  const [birthData, setBirthData] = useState({
    birth_date: '',
    birth_time: '12:00',
    birth_place: '',
    firstName: '',
    latitude: settings.defaultLatitude || 0,
    longitude: settings.defaultLongitude || 0,
    timezone: settings.defaultTimezone,
  })

  const [dialogue, setDialogue] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleGenerateDialogue = async () => {
    if (!settings.geminiApiKey?.trim()) {
      alert(t.dialogues.apiKeyRequired)
      return
    }

    setLoading(true)
    try {
      // Get natal chart first
      const chartResponse = await apiClient.natal.calculate({
        birth_date: birthData.birth_date,
        birth_time: birthData.birth_time,
        birth_place: birthData.birth_place,
        latitude: birthData.latitude,
        longitude: birthData.longitude,
        timezone: birthData.timezone,
        birth_city: birthData.birth_place || undefined,
        house_system: settings.houseSystem,
        include_aspects: true,
        include_extra_objects: settings.includeExtraObjects,
      })
      
      const chart = chartResponse.data
      
      // Generate pre-incarnation dialogue using Gemini
      const dialogueText = await generateDialogue(
        settings.geminiApiKey,
        chart,
        {
          birth_date: birthData.birth_date,
          birth_time: birthData.birth_time,
          birth_place: birthData.birth_place,
          firstName: birthData.firstName,
        },
        settings.language || 'fr'
      )
      
      setDialogue(dialogueText)
    } catch (error: any) {
      console.error('Error generating dialogue:', error)
      alert(`Erreur lors de la génération du dialogue: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton href="/" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20"
        >
          <h1 className="text-3xl font-bold text-white mb-8 flex items-center">
            <MessageSquare className="h-8 w-8 mr-3 text-yellow-400" />
            {t.dialogues.title}
          </h1>

          <p className="text-white/70 mb-6">
            {t.dialogues.description}
          </p>

          {/* Input Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                {t.dialogues.firstName}
              </label>
              <input
                type="text"
                value={birthData.firstName}
                onChange={(e) => setBirthData({ ...birthData, firstName: e.target.value })}
                placeholder={t.dialogues.firstNamePlaceholder}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                {t.dialogues.birthDate}
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
                {t.dialogues.birthTime}
              </label>
              <input
                type="time"
                value={birthData.birth_time}
                onChange={(e) => setBirthData({ ...birthData, birth_time: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="md:col-span-2">
              <LocationInput
                label={t.dialogues.birthPlace}
                value={birthData.birth_place}
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
                placeholder="Recherchez une ville ou un lieu (ex: 'Hôpital Sainte-Croix Drummondville')..."
              />
            </div>
          </div>

          {!settings.geminiApiKey?.trim() && (
            <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
              <p className="text-sm text-yellow-400">
                {t.dialogues.apiKeyRequired}
              </p>
            </div>
          )}

          <button
            onClick={handleGenerateDialogue}
            disabled={loading || !birthData.birth_date || !settings.geminiApiKey?.trim()}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 mb-8 flex items-center justify-center"
          >
            {loading ? (
              <>
                <Sparkles className="h-5 w-5 mr-2 animate-spin" />
                {t.dialogues.generating}
              </>
            ) : (
              t.dialogues.generate
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

