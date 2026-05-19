'use client'

export const dynamic = 'force-dynamic'

import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Sparkles, Loader2 } from 'lucide-react'
import { useSettingsStore } from '@/lib/store'
import { apiClient } from '@/lib/api'
import ReactMarkdown from 'react-markdown'
import LocationInput from '@/components/LocationInput'
import BackButton from '@/components/BackButton'
import Starfield from '@/components/Starfield'
import { formatBirthDateInput } from '@/lib/sanitizeBirthDateYear'
import { useTranslation } from '@/lib/useTranslation'
import {
  generateFamilyLineagePrompt,
  getFamilyLineageThemeGrid,
} from './generateFamilyLineagePrompt'
import { cleanText } from '@/lib/cleanText'
import { isDevTestBypass } from '@/lib/devTestMode'
import TextNarrationControls from '@/components/TextNarrationControls'

export default function ConstellationFamilialePage() {
  const settings = useSettingsStore()
  const t = useTranslation()
  const lang = (settings.language || 'fr') as 'en' | 'fr' | 'es'

  const [birthData, setBirthData] = useState({
    firstName: settings.defaultFirstName || '',
    birth_date: settings.defaultBirthDate || '',
    birth_time: settings.defaultBirthTime || '12:00',
    birth_place: '',
    latitude: settings.defaultLatitude || 0,
    longitude: settings.defaultLongitude || 0,
    timezone: settings.defaultTimezone || 'UTC',
  })

  const [content, setContent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const copy = {
    fr: {
      title: 'Constellation familiale',
      subtitle:
        'Tes deux fils transgénérationnels dominants, en dialogue planétaire — lecture astrologique symbolique du thème natal.',
      disclaimer:
        'Exploration symbolique (filiation, loyautés, transmission), pas une constellation thérapeutique ni une psychogénéalogie clinique. Texte original Orbital Astro : pas d’affiliation à une école ou un auteur tiers.',
      gridIntro:
        'Chaque planète éclaire un thème de lignée et une ressource possible. Le dialogue met en avant tes deux fils dominants.',
      colPlanet: 'Planète',
      colTheme: 'Thème transgénérationnel',
      colResource: 'Ressource',
      firstName: 'Prénom',
      birthDate: 'Date de naissance',
      birthTime: 'Heure de naissance',
      birthPlace: 'Lieu de naissance',
      generate: 'Générer le dialogue',
      generating: 'Génération en cours…',
      validationDate: "Veuillez remplir la date et l'heure de naissance.",
      validationPlace: 'Veuillez sélectionner le lieu de naissance dans la liste.',
      error: 'Erreur lors de la génération : {error}',
      devBanner:
        'Mode développement : génération sans paiement sur localhost. API astro attendue sur http://127.0.0.1:8000',
    },
    en: {
      title: 'Family constellation',
      subtitle:
        'Your two dominant transgenerational threads in a planetary dialogue — symbolic natal chart reading.',
      disclaimer:
        'Symbolic exploration (filiation, loyalties, transmission), not constellation therapy or clinical psychogenealogy. Original Orbital Astro text — not affiliated with any third-party school or author.',
      gridIntro:
        'Each planet highlights a lineage theme and a possible resource. The dialogue focuses on your two dominant threads.',
      colPlanet: 'Planet',
      colTheme: 'Transgenerational theme',
      colResource: 'Resource',
      firstName: 'First name',
      birthDate: 'Birth date',
      birthTime: 'Birth time',
      birthPlace: 'Birth place',
      generate: 'Generate dialogue',
      generating: 'Generating…',
      validationDate: 'Please fill in birth date and time.',
      validationPlace: 'Please select birth place from the dropdown.',
      error: 'Generation error: {error}',
      devBanner:
        'Development mode: no payment on localhost. Astro API expected at http://127.0.0.1:8000',
    },
    es: {
      title: 'Constelación familiar',
      subtitle:
        'Tus dos hilos transgeneracionales dominantes en diálogo planetario — lectura simbólica de la carta natal.',
      disclaimer:
        'Exploración simbólica (filiación, lealtades, transmisión), no terapia de constelación ni psicogenealogía clínica. Texto original Orbital Astro: sin afiliación a escuela o autor de terceros.',
      gridIntro:
        'Cada planeta ilumina un tema de linaje y un recurso posible. El diálogo destaca tus dos hilos dominantes.',
      colPlanet: 'Planeta',
      colTheme: 'Tema transgeneracional',
      colResource: 'Recurso',
      firstName: 'Nombre',
      birthDate: 'Fecha de nacimiento',
      birthTime: 'Hora de nacimiento',
      birthPlace: 'Lugar de nacimiento',
      generate: 'Generar diálogo',
      generating: 'Generando…',
      validationDate: 'Completa la fecha y hora de nacimiento.',
      validationPlace: 'Selecciona el lugar de nacimiento en la lista.',
      error: 'Error al generar: {error}',
      devBanner: 'Modo desarrollo: sin pago en localhost. API en http://127.0.0.1:8000',
    },
  }[lang]

  const lineageGrid = useMemo(() => getFamilyLineageThemeGrid(lang), [lang])

  const handleGenerate = async () => {
    setLoading(true)
    setContent(null)
    try {
      if (!birthData.birth_date || !birthData.birth_time) {
        alert(copy.validationDate)
        setLoading(false)
        return
      }
      const lat = Number(birthData.latitude)
      const lon = Number(birthData.longitude)
      if (
        !birthData.birth_place?.trim() ||
        !Number.isFinite(lat) ||
        !Number.isFinite(lon) ||
        (lat === 0 && lon === 0)
      ) {
        alert(copy.validationPlace)
        setLoading(false)
        return
      }

      const chartResponse = await apiClient.natal.calculate({
        birth_date: birthData.birth_date,
        birth_time: birthData.birth_time,
        birth_place: birthData.birth_place,
        latitude: birthData.latitude,
        longitude: birthData.longitude,
        timezone: birthData.timezone || 'UTC',
        birth_city: birthData.birth_place || undefined,
        house_system: settings.houseSystem || 'placidus',
        include_aspects: true,
        include_extra_objects: true,
      })

      if (chartResponse.error) throw new Error(chartResponse.error)
      const chart = chartResponse.data
      if (!chart?.planets) throw new Error('Chart response is empty')

      const { systemPrompt, userPrompt } = generateFamilyLineagePrompt({
        language: lang,
        firstName: birthData.firstName || undefined,
        chart: chart as Parameters<typeof generateFamilyLineagePrompt>[0]['chart'],
      })

      const response = await apiClient.ai.interpret(userPrompt, systemPrompt)
      if (response.error) throw new Error(response.error)

      const raw = (response.data?.content || '').trim()
      if (!raw) throw new Error('Empty response')

      setContent(cleanText(raw))
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[ConstellationFamiliale]', err)
      alert(copy.error.replace('{error}', msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-cosmic-purple via-magenta-purple to-cosmic-purple relative"
    >
      <Starfield />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <BackButton />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-cosmic-purple/60 to-magenta-purple/60 backdrop-blur-sm rounded-xl p-8 border border-cosmic-gold/20 overflow-visible"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Users className="h-8 w-8 text-cosmic-gold" />
            <h1 className="text-3xl font-bold text-cosmic-gold text-center">{copy.title}</h1>
          </div>

          <p className="text-white/85 text-center mb-3 max-w-2xl mx-auto">{copy.subtitle}</p>
          <p className="text-white/60 text-center text-xs mb-6 max-w-xl mx-auto">{copy.disclaimer}</p>

          {isDevTestBypass() && (
            <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
              <p className="text-yellow-200 text-sm text-center">{copy.devBanner}</p>
            </div>
          )}

          <div className="mb-6 rounded-lg border border-cosmic-gold/25 bg-cosmic-purple/40 p-4">
            <p className="text-white/80 text-sm text-center mb-3">{copy.gridIntro}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-white/90">
                <thead>
                  <tr className="border-b border-cosmic-gold/30 text-cosmic-gold">
                    <th className="py-2 pr-3 text-left font-medium">{copy.colPlanet}</th>
                    <th className="py-2 pr-3 text-left font-medium">{copy.colTheme}</th>
                    <th className="py-2 text-left font-medium">{copy.colResource}</th>
                  </tr>
                </thead>
                <tbody>
                  {lineageGrid.map((row) => (
                    <tr key={row.planet} className="border-b border-white/10 last:border-0">
                      <td className="py-2 pr-3 font-medium text-cosmic-gold/95">{row.planet}</td>
                      <td className="py-2 pr-3">{row.theme}</td>
                      <td className="py-2">{row.resource}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">{copy.firstName}</label>
              <input
                type="text"
                value={birthData.firstName}
                onChange={(e) => setBirthData({ ...birthData, firstName: e.target.value })}
                className="w-full px-4 py-2 bg-cosmic-purple/60 border border-cosmic-gold/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cosmic-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">{copy.birthDate}</label>
              <input
                type="text"
                placeholder="AAAA-MM-JJ"
                value={birthData.birth_date}
                onChange={(e) =>
                  setBirthData({
                    ...birthData,
                    birth_date: formatBirthDateInput(e.target.value),
                  })
                }
                className="w-full px-4 py-2 bg-cosmic-purple/60 border border-cosmic-gold/30 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cosmic-gold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/90 mb-2">{copy.birthTime}</label>
              <input
                type="time"
                value={birthData.birth_time}
                onChange={(e) => setBirthData({ ...birthData, birth_time: e.target.value })}
                className="w-full px-4 py-2 bg-cosmic-purple/60 border border-cosmic-gold/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cosmic-gold"
              />
            </div>
            <div className="md:col-span-2 relative z-30 overflow-visible">
              <LocationInput
                label={copy.birthPlace}
                value={birthData.birth_place}
                variant="gold"
                onChange={(value) => {
                  if (!value?.trim()) {
                    setBirthData({
                      ...birthData,
                      birth_place: '',
                      latitude: 0,
                      longitude: 0,
                      timezone: settings.defaultTimezone || 'UTC',
                    })
                  } else {
                    setBirthData({ ...birthData, birth_place: value })
                  }
                }}
                onLocationSelect={(location) => {
                  setBirthData({
                    ...birthData,
                    birth_place: location.name,
                    latitude: location.latitude,
                    longitude: location.longitude,
                    timezone: location.timezone || settings.defaultTimezone || 'UTC',
                  })
                }}
              />
            </div>
          </div>

          <div className="flex justify-center mb-8">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="px-8 py-3 bg-cosmic-gold text-cosmic-purple font-bold rounded-lg hover:bg-cosmic-gold/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {copy.generating}
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  {copy.generate}
                </>
              )}
            </button>
          </div>

          {content && (
            <>
              <div className="mb-6 flex justify-center">
                <TextNarrationControls
                  text={content}
                  language={lang}
                  labels={t.narration}
                  className="items-center text-center"
                />
              </div>
              <div className="pdf-scroll custom-scrollbar rounded-lg border border-cosmic-gold/25 bg-cosmic-purple/30 p-6">
                <ReactMarkdown
                  className="dialogue-prose pdf-body text-cosmic-gold/90"
                  components={{
                    h2: ({ children }) => (
                      <h2 className="dialogue-prose h2 text-cosmic-gold mt-8 mb-4">{children}</h2>
                    ),
                    p: ({ children }) => {
                      const raw =
                        typeof children === 'string'
                          ? children
                          : Array.isArray(children)
                            ? children.map((c) => (typeof c === 'string' ? c : '')).join('')
                            : String(children ?? '')
                      const m = raw.match(/^([^\n:]{2,40})\s*:\s*(.+)$/s)
                      if (m) {
                        return (
                          <p className="dialogue-prose mb-3">
                            <span className="font-semibold text-cosmic-gold">{m[1]} :</span>{' '}
                            <span>{m[2]}</span>
                          </p>
                        )
                      }
                      return <p className="dialogue-prose mb-3">{children}</p>
                    },
                  }}
                >
                  {content}
                </ReactMarkdown>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
