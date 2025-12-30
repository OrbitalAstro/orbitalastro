'use client'

export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Calendar } from 'lucide-react'
import { useSettingsStore } from '@/lib/store'
import { apiClient } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import ReactMarkdown from 'react-markdown'
import LocationInput from '@/components/LocationInput'
import { useToast } from '@/lib/toast'
import BackButton from '@/components/BackButton'
import { useTranslation } from '@/lib/useTranslation'
import { formatBirthDateInput } from '@/lib/sanitizeBirthDateYear'

export default function Stories() {
  const settings = useSettingsStore()
  const toast = useToast()
  const t = useTranslation()
  const [birthData, setBirthData] = useState({
    birth_date: settings.defaultBirthDate || '',
    birth_time: settings.defaultBirthTime || '12:00',
    birth_place: '',
    latitude: settings.defaultLatitude || 0,
    longitude: settings.defaultLongitude || 0,
    timezone: settings.defaultTimezone || 'UTC',
  })

  const { data: _natalChart } = useQuery({
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

  const generateStory = async (chart: any) => {
    if (!chart) return
    
    setLoading(true)
    try {
      // Translation dictionaries
      const translations = {
        en: {
          title: 'Your Cosmic Story',
          sunTitle: (sign: string) => `The ${sign} Sun`,
          sunText: (sign: string, tone: string) => `Your Sun in ${sign} illuminates your core essence. This ${tone} placement suggests a deep connection to ${sign.toLowerCase()} energy, shaping your fundamental identity and life purpose.`,
          moonTitle: (sign: string) => `The ${sign} Moon`,
          moonText: (sign: string) => `Your Moon in ${sign} reflects your emotional nature and inner world. This placement influences how you process feelings and find emotional security.`,
          journeyTitle: 'The Journey Ahead',
          journeyText: (sign: string) => `With your Ascendant in ${sign}, you approach life with the qualities of ${sign.toLowerCase()}. This rising sign colors how others perceive you and how you interact with the world.`,
          footer: 'This is a generated interpretation. For a full personalized reading, please use the interpretation panel.',
        },
        fr: {
          title: 'Votre Histoire Cosmique',
          sunTitle: (sign: string) => `Le Soleil en ${sign}`,
          sunText: (sign: string, tone: string) => `Votre Soleil en ${sign} illumine votre essence fondamentale. Ce placement ${tone} suggère une connexion profonde avec l'énergie ${sign.toLowerCase()}, façonnant votre identité fondamentale et votre but dans la vie.`,
          moonTitle: (sign: string) => `La Lune en ${sign}`,
          moonText: (sign: string) => `Votre Lune en ${sign} reflète votre nature émotionnelle et votre monde intérieur. Ce placement influence la façon dont vous traitez les sentiments et trouvez la sécurité émotionnelle.`,
          journeyTitle: 'Le Voyage à Venir',
          journeyText: (sign: string) => `Avec votre Ascendant en ${sign}, vous abordez la vie avec les qualités du ${sign.toLowerCase()}. Ce signe ascendant colore la façon dont les autres vous perçoivent et la façon dont vous interagissez avec le monde.`,
          footer: "Ceci est une interprétation générée. Pour une lecture personnalisée complète, veuillez utiliser le panneau d'interprétation.",
        },
        es: {
          title: 'Tu Historia Cósmica',
          sunTitle: (sign: string) => `El Sol en ${sign}`,
          sunText: (sign: string, tone: string) => `Tu Sol en ${sign} ilumina tu esencia fundamental. Esta colocación ${tone} sugiere una conexión profunda con la energía ${sign.toLowerCase()}, moldeando tu identidad fundamental y tu propósito en la vida.`,
          moonTitle: (sign: string) => `La Luna en ${sign}`,
          moonText: (sign: string) => `Tu Luna en ${sign} refleja tu naturaleza emocional y tu mundo interior. Esta colocación influye en cómo procesas los sentimientos y encuentras seguridad emocional.`,
          journeyTitle: 'El Viaje por Delante',
          journeyText: (sign: string) => `Con tu Ascendente en ${sign}, te acercas a la vida con las cualidades del ${sign.toLowerCase()}. Este signo ascendente colorea cómo otros te perciben y cómo interactúas con el mundo.`,
          footer: 'Esta es una interpretación generada. Para una lectura personalizada completa, por favor usa el panel de interpretación.',
        },
      }

      // Zodiac sign translations
      const signTranslations: Record<string, Record<string, string>> = {
        en: {
          Aries: 'Aries', Taurus: 'Taurus', Gemini: 'Gemini', Cancer: 'Cancer',
          Leo: 'Leo', Virgo: 'Virgo', Libra: 'Libra', Scorpio: 'Scorpio',
          Sagittarius: 'Sagittarius', Capricorn: 'Capricorn', Aquarius: 'Aquarius', Pisces: 'Pisces',
        },
        fr: {
          Aries: 'Bélier', Taurus: 'Taureau', Gemini: 'Gémeaux', Cancer: 'Cancer',
          Leo: 'Lion', Virgo: 'Vierge', Libra: 'Balance', Scorpio: 'Scorpion',
          Sagittarius: 'Sagittaire', Capricorn: 'Capricorne', Aquarius: 'Verseau', Pisces: 'Poissons',
        },
        es: {
          Aries: 'Aries', Taurus: 'Tauro', Gemini: 'Géminis', Cancer: 'Cáncer',
          Leo: 'Leo', Virgo: 'Virgo', Libra: 'Libra', Scorpio: 'Escorpio',
          Sagittarius: 'Sagitario', Capricorn: 'Capricornio', Aquarius: 'Acuario', Pisces: 'Piscis',
        },
      }

      const lang = settings.language || 'en'
      const t = translations[lang]
      const signs = signTranslations[lang]

      // Get sign names in the selected language
      const sunSignEn = chart.planets?.sun?.sign || 'Unknown'
      const moonSignEn = chart.planets?.moon?.sign || 'Unknown'
      const ascendant = chart.ascendant || 0
      const ascSignIndex = Math.floor(ascendant / 30) % 12
      const signNamesEn = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']
      const ascSignEn = signNamesEn[ascSignIndex] || 'Unknown'

      const sunSign = signs[sunSignEn] || sunSignEn
      const moonSign = signs[moonSignEn] || moonSignEn
      const ascSign = signs[ascSignEn] || ascSignEn
      
      const storyText = `# ${t.title}

## ${t.sunTitle(sunSign)}

${t.sunText(sunSign, settings.narrativeTone)}

## ${t.moonTitle(moonSign)}

${t.moonText(moonSign)}

## ${t.journeyTitle}

${t.journeyText(ascSign)}

*${t.footer}*`
      
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
        <BackButton href="/" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20"
        >
          <h1 className="text-3xl font-bold text-white mb-8 flex items-center">
            <BookOpen className="h-8 w-8 mr-3 text-yellow-400" />
            {settings.language === 'fr' ? 'Votre Histoire Astrologique' 
             : settings.language === 'es' ? 'Tu Historia Astrológica'
             : 'Your Astrological Story'}
          </h1>

          {/* Input Form */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                {settings.language === 'fr' ? 'Date de naissance' 
                 : settings.language === 'es' ? 'Fecha de nacimiento'
                 : 'Birth Date'}
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="\\d{4}-\\d{2}-\\d{2}"
                value={birthData.birth_date}
                onChange={(e) => {
                  const value = formatBirthDateInput(e.target.value)
                  setBirthData({ ...birthData, birth_date: value })
                }}
                placeholder="AAAA-MM-JJ"
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="mt-1 text-xs text-white/60">Format: AAAA-MM-JJ (ex: 1976-10-26)</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-white/80 mb-2">
                {settings.language === 'fr' ? 'Heure de naissance' 
                 : settings.language === 'es' ? 'Hora de nacimiento'
                 : 'Birth Time'}
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
                label={settings.language === 'fr' ? 'Lieu de naissance' 
                       : settings.language === 'es' ? 'Lugar de nacimiento'
                       : 'Birth Place'}
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
                placeholder={t.tooltips.locationSearch}
              />
            </div>
          </div>

          <button
            onClick={async () => {
              if (!birthData.birth_date) {
                toast.error(settings.language === 'fr' ? 'Veuillez entrer une date de naissance'
                           : settings.language === 'es' ? 'Por favor ingresa una fecha de nacimiento'
                           : 'Please enter a birth date')
                return
              }
              if (!birthData.birth_place && (birthData.latitude === 0 || birthData.longitude === 0)) {
                toast.error(settings.language === 'fr' ? 'Veuillez entrer un lieu de naissance'
                           : settings.language === 'es' ? 'Por favor ingresa un lugar de nacimiento'
                           : 'Please enter a birth place')
                return
              }
              
              setLoading(true)
              try {
                // First get the chart
                const chartResponse = await apiClient.natal.calculate({
                  ...birthData,
                  birth_city: birthData.birth_place || undefined,
                  house_system: settings.houseSystem,
                  include_aspects: true,
                })
                // Then generate story with the chart data
                await generateStory(chartResponse.data)
                toast.success(settings.language === 'fr' ? 'Histoire générée avec succès!'
                             : settings.language === 'es' ? '¡Historia generada con éxito!'
                             : 'Story generated successfully!')
              } catch (error: any) {
                console.error('Error calculating chart:', error)
                toast.error('Failed to generate story', error?.response?.data?.detail || 'Please check your input and try again')
                setLoading(false)
              }
            }}
            disabled={loading || !birthData.birth_date}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 mb-8"
          >
            {loading 
              ? (settings.language === 'fr' ? "Génération de l'histoire..." 
                 : settings.language === 'es' ? 'Generando historia...' 
                 : 'Generating Story...')
              : (settings.language === 'fr' ? 'Générer votre histoire'
                 : settings.language === 'es' ? 'Generar tu historia'
                 : 'Generate Your Story')}
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
