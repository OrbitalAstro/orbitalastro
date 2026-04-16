'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, Calendar } from 'lucide-react'
import { useSettingsStore, useChartHistory } from '@/lib/store'
import { apiClient } from '@/lib/api'
import { useToast } from '@/lib/toast'
import BackButton from '@/components/BackButton'
import Starfield from '@/components/Starfield'

export default function TransitsPage() {
  const settings = useSettingsStore()
  const { history } = useChartHistory()
  const toast = useToast()
  const [loading, setLoading] = useState(false)
  const [transits, setTransits] = useState<any>(null)
  const [targetDate, setTargetDate] = useState(new Date().toISOString().split('T')[0])
  
  const latestChart = history && history.length > 0 ? history[history.length - 1] : null

  const lang = settings.language || 'fr'
  const translations = {
    en: {
      title: 'Transits',
      description: 'Track current and future planetary transits to your natal chart.',
      calculate: 'Calculate Transits',
      calculating: 'Calculating...',
      targetDate: 'Target Date',
      noChart: 'Please calculate your natal chart first in the Dashboard.',
      success: 'Transits calculated successfully!',
      error: 'Failed to calculate transits',
    },
    fr: {
      title: 'Transits',
      description: 'Suivez les transits planétaires actuels et futurs de votre thème natal.',
      calculate: 'Calculer les Transits',
      calculating: 'Calcul en cours...',
      targetDate: 'Date Cible',
      noChart: "Veuillez d'abord calculer votre thème natal dans le Tableau de bord.",
      success: 'Transits calculés avec succès!',
      error: 'Échec du calcul des transits',
    },
    es: {
      title: 'Tránsitos',
      description: 'Rastrea los tránsitos planetarios actuales y futuros a tu carta natal.',
      calculate: 'Calcular Tránsitos',
      calculating: 'Calculando...',
      targetDate: 'Fecha Objetivo',
      noChart: 'Por favor calcula tu carta natal primero en el Panel.',
      success: '¡Tránsitos calculados con éxito!',
      error: 'Error al calcular tránsitos',
    },
  }
  const t = translations[lang]

  const calculateTransits = async () => {
    if (!latestChart) {
      toast.error(t.noChart)
      return
    }

    setLoading(true)
    try {
      const natalPositions: Record<string, number> = {}
      
      if (latestChart.chart?.planets) {
        Object.entries(latestChart.chart.planets).forEach(([key, value]: [string, any]) => {
          if (value && typeof value.longitude === 'number') {
            natalPositions[key] = value.longitude
          }
        })
      }

      // Get birth location for transit chart
      const birthLat = latestChart.birthData?.latitude || latestChart.chart?.latitude || settings.defaultLatitude || 0
      const birthLon = latestChart.birthData?.longitude || latestChart.chart?.longitude || settings.defaultLongitude || 0

      const response = await apiClient.transits.calculate({
        natal_positions: natalPositions,
        natal_asc: latestChart.chart?.ascendant,
        natal_mc: latestChart.chart?.midheaven,
        target_date: targetDate,
        latitude: birthLat,
        longitude: birthLon,
        house_system: settings.houseSystem,
        include_angles: true,
        include_patterns: true,
      })

      setTransits(response.data)
      toast.success(t.success)
    } catch (error: any) {
      console.error('Error calculating transits:', error)
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
            <Zap className="h-8 w-8 mr-3 text-yellow-400" />
            {t.title}
          </h1>
          <p className="text-white/70 mb-8">{t.description}</p>

          {!latestChart && (
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-4 mb-6">
              <p className="text-yellow-400">{t.noChart}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-white/80 mb-2">
              <Calendar className="inline h-4 w-4 mr-1" />
              {t.targetDate}
            </label>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            onClick={calculateTransits}
            disabled={loading || !latestChart || !targetDate}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 mb-8"
          >
            {loading ? t.calculating : t.calculate}
          </button>

          {transits && (
            <div className="space-y-6">
              {/* Transit Results List */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 rounded-xl p-6 border border-white/10"
              >
                <h2 className="text-2xl font-bold text-white mb-4">
                  {lang === 'fr' ? 'Résultats des Transits' : lang === 'es' ? 'Resultados de Tránsitos' : 'Transit Results'}
                </h2>
                <div className="space-y-4">
                  {transits.transits && transits.transits.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {lang === 'fr' ? 'Transits Actifs' : lang === 'es' ? 'Tránsitos Activos' : 'Active Transits'}
                      </h3>
                      <ul className="space-y-2">
                        {transits.transits.slice(0, 10).map((transit: any, i: number) => (
                          <li key={i} className="text-white/80">
                            • {transit.transiting_body} {transit.aspect} {transit.natal_body} (orb: {transit.orb_deg?.toFixed(2)}°)
                            {transit.applying && (
                              <span className="text-yellow-400 text-sm ml-2">
                                {lang === 'fr' ? '(approchant)' : lang === 'es' ? '(acercándose)' : '(applying)'}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {transits.transits_to_angles && transits.transits_to_angles.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        {lang === 'fr' ? 'Transits aux Angles' : lang === 'es' ? 'Tránsitos a los Ángulos' : 'Transits to Angles'}
                      </h3>
                      <ul className="space-y-2">
                        {transits.transits_to_angles.slice(0, 10).map((transit: any, i: number) => (
                          <li key={i} className="text-white/80">
                            • {transit.transiting_body} {transit.aspect} {transit.angle} (orb: {transit.orb_deg?.toFixed(2)}°)
                            {transit.applying && (
                              <span className="text-yellow-400 text-sm ml-2">
                                {lang === 'fr' ? '(approchant)' : lang === 'es' ? '(acercándose)' : '(applying)'}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {(!transits.transits || transits.transits.length === 0) && 
                   (!transits.transits_to_angles || transits.transits_to_angles.length === 0) && (
                    <p className="text-white/60">
                      {lang === 'fr' 
                        ? 'Aucun transit majeur pour cette date.'
                        : lang === 'es'
                        ? 'No hay tránsitos mayores para esta fecha.'
                        : 'No major transits for this date.'}
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
