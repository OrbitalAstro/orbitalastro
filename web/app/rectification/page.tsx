'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Wand2, Calendar, Plus, X } from 'lucide-react'
import { useSettingsStore, useChartHistory } from '@/lib/store'
import { apiClient } from '@/lib/api'
import { useToast } from '@/lib/toast'
import BackButton from '@/components/BackButton'
import LocationInput from '@/components/LocationInput'
import ReactMarkdown from 'react-markdown'
import { useTranslation } from '@/lib/useTranslation'
import { formatBirthDateInput } from '@/lib/sanitizeBirthDateYear'

interface RectificationEvent {
  type: string
  datetime_local: string
  weight: number
}

export default function RectificationPage() {
  const settings = useSettingsStore()
  const t = useTranslation()
  const { history } = useChartHistory()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  
  const latestChart = history && history.length > 0 ? history[history.length - 1] : null
  const [birthDate, setBirthDate] = useState(latestChart?.birthData?.birth_date || settings.defaultBirthDate || '')
  const [approxTime, setApproxTime] = useState(latestChart?.birthData?.birth_time || settings.defaultBirthTime || '12:00')
  const [timeWindow, setTimeWindow] = useState(4.0)
  const [events, setEvents] = useState<RectificationEvent[]>([
    { type: '', datetime_local: '', weight: 1.0 },
  ])
  const [location, setLocation] = useState({
    place: latestChart?.birthData?.birth_place || '',
    latitude: latestChart?.birthData?.latitude || settings.defaultLatitude || 0,
    longitude: latestChart?.birthData?.longitude || settings.defaultLongitude || 0,
    timezone: latestChart?.birthData?.timezone || settings.defaultTimezone || 'UTC',
  })


  const addEvent = () => {
    setEvents([...events, { type: '', datetime_local: '', weight: 1.0 }])
  }

  const removeEvent = (index: number) => {
    setEvents(events.filter((_, i) => i !== index))
  }

  const updateEvent = (index: number, field: keyof RectificationEvent, value: string | number) => {
    const newEvents = [...events]
    newEvents[index] = { ...newEvents[index], [field]: value }
    setEvents(newEvents)
  }

  const calculateRectification = async () => {
    if (!birthDate || !approxTime) {
      toast.error(t.rectification.fillAllFields)
      return
    }

    // Validate events - must have type and complete datetime (YYYY-MM-DDTHH:MM format)
    const validEvents = events.filter(e => {
      if (!e.type || !e.datetime_local) return false
      // Check if datetime_local is in valid format (YYYY-MM-DDTHH:MM or YYYY-MM-DDTHH:MM:SS)
      const datetimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/
      return datetimePattern.test(e.datetime_local)
    })
    
    if (validEvents.length === 0) {
      const invalidCount = events.filter(e => e.type || e.datetime_local).length
      if (invalidCount > 0) {
        toast.error(t.rectification.completeEventFields)
      } else {
        toast.error(t.rectification.addValidEvent)
      }
      return
    }

    setLoading(true)
    try {
      const response = await apiClient.rectification.calculate({
        birth_date: birthDate,
        approx_time: approxTime,
        timezone: location.timezone,
        latitude_deg: location.latitude,
        longitude_deg: location.longitude,
        time_window_hours: timeWindow,
        events: validEvents.map(e => ({
          type: e.type,
          datetime_local: e.datetime_local,
          weight: e.weight,
        })),
        top_n: 3,
        step_minutes: 5,
      })

      setResult(response.data)
      toast.success(t.rectification.success)
    } catch (error: any) {
      console.error('Error calculating rectification:', error)
      toast.error(t.rectification.error, error?.response?.data?.detail || t.rectification.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton href="/" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20"
        >
          <h1 className="text-3xl font-bold text-white mb-4 flex items-center">
            <Wand2 className="h-8 w-8 mr-3 text-cosmic-gold" />
            {t.rectification.title}
          </h1>
          <p className="text-white/70 mb-8">{t.rectification.description}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                {t.rectification.birthDate}
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\\d{4}-\\d{2}-\\d{2}"
                value={birthDate}
                onChange={(e) => setBirthDate(formatBirthDateInput(e.target.value))}
                placeholder="AAAA-MM-JJ"
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                {t.rectification.approxTime}
              </label>
              <input
                type="time"
                value={approxTime}
                onChange={(e) => setApproxTime(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                {t.rectification.timeWindow}
              </label>
              <input
                type="number"
                step="0.5"
                min="1"
                max="24"
                value={timeWindow}
                onChange={(e) => setTimeWindow(parseFloat(e.target.value))}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="md:col-span-2">
              <LocationInput
                label={t.rectification.birthPlace}
                value={location.place}
                onChange={(value) => setLocation({ ...location, place: value })}
                onLocationSelect={(loc) => {
                  setLocation({
                    place: loc.name,
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                    timezone: loc.timezone || settings.defaultTimezone || 'UTC',
                  })
                }}
              />
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">{t.rectification.events}</h2>
              <button
                onClick={addEvent}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                {t.rectification.addEvent}
              </button>
            </div>
            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        {t.rectification.eventType}
                      </label>
                      <input
                        type="text"
                        value={event.type}
                        onChange={(e) => updateEvent(index, 'type', e.target.value)}
                        placeholder={t.rectification.eventTypePlaceholder}
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        {t.rectification.eventDate}
                      </label>
                      <input
                        type="datetime-local"
                        value={event.datetime_local}
                        onChange={(e) => updateEvent(index, 'datetime_local', e.target.value)}
                        className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        suppressHydrationWarning
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-white/80 mb-2">
                          {t.rectification.eventWeight}
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0.1"
                          max="5"
                          value={event.weight}
                          onChange={(e) => updateEvent(index, 'weight', parseFloat(e.target.value))}
                          className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                      {events.length > 1 && (
                        <button
                          onClick={() => removeEvent(index)}
                          className="p-2 bg-eclipse-red/20 hover:bg-eclipse-red/30 text-eclipse-red rounded-lg transition"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={calculateRectification}
            disabled={loading || !birthDate || !approxTime}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 mb-8"
          >
            {loading ? t.rectification.calculating : t.rectification.calculate}
          </button>

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-xl p-6 border border-white/10"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                {t.rectification.results}
              </h2>
              {result.summary && (
                <p className="text-white/80 mb-4">{result.summary}</p>
              )}
              {result.narrative_summary && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-white mb-2">
                    {t.rectification.narrativeSummary}
                  </h3>
                  <ReactMarkdown className="text-white/80 prose prose-invert max-w-none">
                    {result.narrative_summary}
                  </ReactMarkdown>
                </div>
              )}
              {result.candidates && result.candidates.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xl font-semibold text-white mb-4">
                    {t.rectification.topCandidates}
                  </h3>
                  <div className="space-y-4">
                    {result.candidates.map((candidate: any, i: number) => (
                      <div key={i} className="bg-white/5 rounded-lg p-4 border border-white/10">
                        <p className="text-white font-semibold mb-2">
                          #{i + 1}: {candidate.birth_time} (Score: {candidate.score?.toFixed(2)})
                        </p>
                        <p className="text-white/70 text-sm">
                          ASC: {candidate.ascendant?.toFixed(2)}° | MC: {candidate.midheaven?.toFixed(2)}°
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
