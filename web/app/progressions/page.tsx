'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Calendar, MapPin } from 'lucide-react'
import { useSettingsStore, useChartHistory } from '@/lib/store'
import { apiClient } from '@/lib/api'
import { useToast } from '@/lib/toast'
import BackButton from '@/components/BackButton'
import LocationInput from '@/components/LocationInput'
import ReactMarkdown from 'react-markdown'

export default function ProgressionsPage() {
  const settings = useSettingsStore()
  const { history } = useChartHistory()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [progressedChart, setProgressedChart] = useState<any>(null)
  
  const latestChart = history && history.length > 0 ? history[history.length - 1] : null
  const [progressedDate, setProgressedDate] = useState(new Date().toISOString().split('T')[0])
  const [location, setLocation] = useState({
    place: latestChart?.birthData?.birth_place || '',
    latitude: latestChart?.birthData?.latitude || settings.defaultLatitude || 0,
    longitude: latestChart?.birthData?.longitude || settings.defaultLongitude || 0,
    timezone: latestChart?.birthData?.timezone || settings.defaultTimezone || 'UTC',
  })

  const lang = settings.language || 'en'
  const translations = {
    en: {
      title: 'Progressions',
      description: 'Explore how your chart evolves over time through secondary progressions.',
      calculate: 'Calculate Progressions',
      calculating: 'Calculating...',
      progressedDate: 'Progressed Date',
      birthPlace: 'Birth Place',
      noChart: 'Please calculate your natal chart first in the Dashboard.',
      success: 'Progressions calculated successfully!',
      error: 'Failed to calculate progressions',
    },
    fr: {
      title: 'Progressions',
      description: 'Explorez comment votre thème évolue dans le temps grâce aux progressions secondaires.',
      calculate: 'Calculer les Progressions',
      calculating: 'Calcul en cours...',
      progressedDate: 'Date Progressée',
      birthPlace: 'Lieu de Naissance',
      noChart: "Veuillez d'abord calculer votre thème natal dans le Tableau de bord.",
      success: 'Progressions calculées avec succès!',
      error: 'Échec du calcul des progressions',
    },
    es: {
      title: 'Progresiones',
      description: 'Explora cómo evoluciona tu carta a lo largo del tiempo a través de progresiones secundarias.',
      calculate: 'Calcular Progresiones',
      calculating: 'Calculando...',
      progressedDate: 'Fecha Progresada',
      birthPlace: 'Lugar de Nacimiento',
      noChart: 'Por favor calcula tu carta natal primero en el Panel.',
      success: '¡Progresiones calculadas con éxito!',
      error: 'Error al calcular progresiones',
    },
  }
  const t = translations[lang]

  const calculateProgressions = async () => {
    if (!latestChart) {
      toast.error(t.noChart)
      return
    }

    if (!latestChart.birthData) {
      toast.error(t.noChart)
      return
    }

    setLoading(true)
    try {
      const birthDate = latestChart.birthData.birth_date
      const birthTime = latestChart.birthData.birth_time || '12:00'
      // Ensure timezone is included (UTC)
      const birthDatetime = `${birthDate}T${birthTime}:00Z`

      const response = await apiClient.progressions.calculate({
        birth_datetime: birthDatetime,
        progressed_date: progressedDate,
        latitude: location.latitude,
        longitude: location.longitude,
        house_system: settings.houseSystem,
        include_aspects: true,
      })

      setProgressedChart(response.data)
      toast.success(t.success)
    } catch (error: any) {
      console.error('Error calculating progressions:', error)
      toast.error(t.error, error?.response?.data?.detail || 'Please check your input and try again')
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
            <TrendingUp className="h-8 w-8 mr-3 text-aurora-teal" />
            {t.title}
          </h1>
          <p className="text-white/70 mb-8">{t.description}</p>

          {!latestChart && (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
              <p className="text-yellow-400">{t.noChart}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                {t.progressedDate}
              </label>
              <input
                type="date"
                value={progressedDate}
                onChange={(e) => setProgressedDate(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <div className="md:col-span-2">
              <LocationInput
                label={t.birthPlace}
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

          <button
            onClick={calculateProgressions}
            disabled={loading || !latestChart || !progressedDate}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 mb-8"
          >
            {loading ? t.calculating : t.calculate}
          </button>

          {progressedChart && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 rounded-xl p-6 border border-white/10"
            >
              <h2 className="text-2xl font-bold text-white mb-4">
                {lang === 'fr' ? 'Résultats des Progressions' : lang === 'es' ? 'Resultados de Progresiones' : 'Progression Results'}
              </h2>
              <div className="prose prose-invert max-w-none">
                <div className="bg-white/5 rounded-lg p-4 mb-4 border border-white/10">
                  <p className="text-white/80 mb-2">
                    <strong>{lang === 'fr' ? 'Date Progressée:' : lang === 'es' ? 'Fecha Progresada:' : 'Progressed Date:'}</strong>{' '}
                    {new Date(progressedChart.progressed_datetime_utc).toLocaleDateString()}
                  </p>
                  <p className="text-white/80 mb-2">
                    <strong>{lang === 'fr' ? 'Âge:' : lang === 'es' ? 'Edad:' : 'Age:'}</strong> {progressedChart.age_years.toFixed(2)} {lang === 'fr' ? 'ans' : lang === 'es' ? 'años' : 'years'}
                  </p>
                  <p className="text-sm text-white/60 mt-3 italic">
                    {lang === 'fr' 
                      ? '💫 En progressions secondaires, 1 jour après la naissance = 1 an de vie. Cette date symbolique représente où en sont vos planètes progressées à cet âge.'
                      : lang === 'es'
                      ? '💫 En progresiones secundarias, 1 día después del nacimiento = 1 año de vida. Esta fecha simbólica representa dónde están tus planetas progresadas a esta edad.'
                      : '💫 In secondary progressions, 1 day after birth = 1 year of life. This symbolic date represents where your progressed planets are at this age.'}
                  </p>
                </div>
                {progressedChart.narrative_seed && (
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {lang === 'fr' ? 'Interprétation' : lang === 'es' ? 'Interpretación' : 'Interpretation'}
                    </h3>
                    <ReactMarkdown className="text-white/80">{progressedChart.narrative_seed}</ReactMarkdown>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

