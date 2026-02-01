'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Calendar } from 'lucide-react'
import { useSettingsStore, useChartHistory } from '@/lib/store'
import { apiClient } from '@/lib/api'
import { useToast } from '@/lib/toast'
import BackButton from '@/components/BackButton'
import LocationInput from '@/components/LocationInput'
import ReactMarkdown from 'react-markdown'
import { formatBirthDateInput } from '@/lib/sanitizeBirthDateYear'
import Starfield from '@/components/Starfield'

export default function ProgressionsPage() {
  const settings = useSettingsStore()
  const { history } = useChartHistory()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [progressedChart, setProgressedChart] = useState<any>(null)
  
  const latestChart = history && history.length > 0 ? history[history.length - 1] : null
  const [progressedDate, setProgressedDate] = useState(new Date().toISOString().split('T')[0])
  const [birthDate, setBirthDate] = useState(
    settings.defaultBirthDate || latestChart?.birthData?.birth_date || ''
  )
  const [birthTime, setBirthTime] = useState(
    settings.defaultBirthTime || latestChart?.birthData?.birth_time || '12:00'
  )
  const [location, setLocation] = useState({
    place: latestChart?.birthData?.birth_place || '',
    latitude: settings.defaultLatitude || latestChart?.birthData?.latitude || 0,
    longitude: settings.defaultLongitude || latestChart?.birthData?.longitude || 0,
    timezone: settings.defaultTimezone || latestChart?.birthData?.timezone || 'UTC',
  })

  const lang = settings.language || 'fr'
  const translations = {
    en: {
      title: 'Progressions',
      description: 'Explore how your chart evolves over time through secondary progressions.',
      calculate: 'Calculate Progressions',
      calculating: 'Calculating...',
      progressedDate: 'Progressed Date',
      birthDate: 'Birth Date',
      birthTime: 'Birth Time',
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
      birthDate: 'Date de Naissance',
      birthTime: 'Heure de Naissance',
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
      birthDate: 'Fecha de Nacimiento',
      birthTime: 'Hora de Nacimiento',
      birthPlace: 'Lugar de Nacimiento',
      noChart: 'Por favor calcula tu carta natal primero en el Panel.',
      success: '¡Progresiones calculadas con éxito!',
      error: 'Error al calcular progresiones',
    },
  }
  const t = translations[lang]

  const calculateProgressions = async () => {
    if (!birthDate) {
      toast.error(lang === 'fr' ? 'Date de naissance requise' : lang === 'es' ? 'Fecha de nacimiento requerida' : 'Birth date is required')
      return
    }

    if (!birthTime) {
      toast.error(lang === 'fr' ? 'Heure de naissance requise' : lang === 'es' ? 'Hora de nacimiento requerida' : 'Birth time is required')
      return
    }

    if ((location.latitude === 0 && location.longitude === 0) || !location.place) {
      toast.error(lang === 'fr' ? 'Lieu de naissance requis' : lang === 'es' ? 'Lugar de nacimiento requerido' : 'Birth place is required')
      return
    }

    setLoading(true)
    try {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      <Starfield />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
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
            <div className="bg-blue-500/20 border border-blue-500/50 rounded-lg p-4 mb-6">
              <p className="text-blue-400">
                {lang === 'fr' 
                  ? '💡 Entrez vos informations de naissance ci-dessous pour calculer les progressions.'
                  : lang === 'es'
                  ? '💡 Ingresa tu información de nacimiento a continuación para calcular las progresiones.'
                  : '💡 Enter your birth information below to calculate progressions.'}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                {t.birthDate}
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\\d{4}-\\d{2}-\\d{2}"
                value={birthDate}
                onChange={(e) => setBirthDate(formatBirthDateInput(e.target.value))}
                placeholder={lang === 'fr' ? 'AAAA-MM-JJ' : 'YYYY-MM-DD'}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="mt-1 text-xs text-white/60">
                {lang === 'fr'
                  ? 'Format : AAAA-MM-JJ (ex : 1976-10-26)'
                  : lang === 'es'
                    ? 'Formato: AAAA-MM-DD (ej.: 1976-10-26)'
                    : 'Format: YYYY-MM-DD (e.g., 1976-10-26)'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                {t.birthTime}
              </label>
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
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
            disabled={loading || !birthDate || !birthTime || !progressedDate || (location.latitude === 0 && location.longitude === 0 && !location.place)}
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
