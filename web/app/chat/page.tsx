'use client'

export const dynamic = 'force-dynamic'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, Sparkles, User, Bot, Key, Settings } from 'lucide-react'
import { useSettingsStore, useChartHistory } from '@/lib/store'
import { apiClient } from '@/lib/api'
import { useToast } from '@/lib/toast'
import BackButton from '@/components/BackButton'
import Link from 'next/link'
// Removed generateAstrologicalResponse import

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const settings = useSettingsStore()
  const { history } = useChartHistory()
  const toast = useToast()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Get the most recent chart from history
  const latestChart = history && history.length > 0 ? history[history.length - 1] : null

  // Translations
  const translations: Record<
    import('@/lib/i18n').Language,
    {
      title: string
      placeholder: string
      noChart: string
      thinking: string
      send: string
      exampleQuestions: string[]
    }
  > = {
    en: {
      title: 'Astrological Chat',
      placeholder: 'Ask about your chart, current transits, or future...',
      noChart: 'Please calculate your natal chart first in the Dashboard.',
      thinking: 'Analyzing your chart...',
      send: 'Send',
      exampleQuestions: [
        'What are my current transits?',
        'What does my Sun sign mean?',
        'What can I expect in the next month?',
        'Tell me about my Moon placement',
      ],
    },
    fr: {
      title: 'Chat Astrologique',
      placeholder: "Posez des questions sur votre thème, les transits actuels ou l'avenir...",
      noChart: "Veuillez d'abord calculer votre thème natal dans le Tableau de bord.",
      thinking: 'Analyse de votre thème...',
      send: 'Envoyer',
      exampleQuestions: [
        'Quels sont mes transits actuels?',
        'Que signifie mon signe solaire?',
        'Que puis-je attendre le mois prochain?',
        'Parlez-moi de ma Lune',
      ],
    },
    es: {
      title: 'Chat Astrológico',
      placeholder: 'Haz preguntas sobre tu carta, tránsitos actuales o el futuro...',
      noChart: 'Por favor calcula tu carta natal primero en el Panel.',
      thinking: 'Analizando tu carta...',
      send: 'Enviar',
      exampleQuestions: [
        '¿Cuáles son mis tránsitos actuales?',
        '¿Qué significa mi signo solar?',
        '¿Qué puedo esperar el próximo mes?',
        'Háblame de mi Luna',
      ],
    },
  }

  const lang = settings.language || 'en'
  const t = translations[lang as keyof typeof translations] || translations.en
  const hasApiKey = true // API key is now managed in backend

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Initialize with welcome message
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: hasApiKey
          ? (lang === 'fr'
              ? "Bonjour! Je suis votre assistant astrologique. Je peux répondre à vos questions sur votre thème natal, les transits actuels, et ce que l'avenir pourrait réserver. Posez-moi une question!"
              : lang === 'es'
              ? '¡Hola! Soy tu asistente astrológico. Puedo responder preguntas sobre tu carta natal, tránsitos actuales y lo que el futuro podría deparar. ¡Hazme una pregunta!'
              : "Hello! I'm your astrological assistant. I can answer questions about your natal chart, current transits, and what the future might hold. Ask me anything!")
          : t.apiKeyRequired,
        timestamp: new Date(),
      }
      setMessages([welcomeMessage])
    }
  }, [settings.language, hasApiKey])

  const handleSend = async () => {
    if (!input.trim() || loading) return

    if (!latestChart) {
      toast.error(t.noChart)
      return
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // Add thinking message
    const thinkingMessage: Message = {
      id: `thinking-${Date.now()}`,
      role: 'assistant',
      content: t.thinking,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, thinkingMessage])

    try {
      // Check if question is about another person
      const latestChartData = latestChart as { chart?: unknown } | null
      const chartToUse = await getChartForQuestion(input.trim(), latestChartData?.chart)
      const response = await generateResponse(input.trim(), chartToUse, latestChartData?.chart)
      
      // Remove thinking message and add response
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== thinkingMessage.id)
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: response,
            timestamp: new Date(),
          },
        ]
      })
    } catch (error: any) {
      console.error('Error generating response:', error)
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== thinkingMessage.id)
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            role: 'assistant',
            content: settings.language === 'fr'
              ? "Désolé, une erreur s'est produite. Veuillez réessayer."
              : settings.language === 'es'
              ? 'Lo siento, ocurrió un error. Por favor intenta de nuevo.'
              : 'Sorry, an error occurred. Please try again.',
            timestamp: new Date(),
          },
        ]
      })
    } finally {
      setLoading(false)
    }
  }

  // Extract birth data from question and calculate chart if needed
  const getChartForQuestion = async (question: string, defaultChart: any): Promise<any> => {
    if (!defaultChart) return null
    
    const lowerQuestion = question.toLowerCase()
    
    // Check if question mentions a specific person (not "my", "me", "mon", "ma")
    const personalPronouns = ['mon', 'ma', 'mes', 'my', 'me', 'mi', 'mis']
    const isAboutUser = personalPronouns.some(pronoun => lowerQuestion.includes(pronoun))
    
    // Check for birth date patterns
    const datePatterns = [
      /\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/,  // YYYY-MM-DD
      /\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/,  // DD-MM-YYYY or MM-DD-YYYY
      /\b(?:born|né|nacido|naissance|birth)\s+(?:on|le|el)?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})\b/i
    ]
    
    const hasDate = datePatterns.some(pattern => pattern.test(question))
    
    // If question mentions a date and is not about the user, try to extract info
    if (hasDate && !isAboutUser) {
      try {
        // Extract date from question
        let birthDate: string | null = null
        let birthTime: string = '12:00'
        let birthPlace: string | null = null
        
        // Try to extract date
        const dateMatch = question.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/) || 
                         question.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/)
        
        if (dateMatch) {
          if (dateMatch[0].includes(dateMatch[1]) && dateMatch[1].length === 4) {
            // YYYY-MM-DD format
            birthDate = `${dateMatch[1]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[3].padStart(2, '0')}`
          } else {
            // DD-MM-YYYY or MM-DD-YYYY - assume MM-DD-YYYY for now
            birthDate = `${dateMatch[3]}-${dateMatch[1].padStart(2, '0')}-${dateMatch[2].padStart(2, '0')}`
          }
        }
        
        // Extract time if mentioned
        const timeMatch = question.match(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\b/)
        if (timeMatch) {
          birthTime = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}${timeMatch[3] ? ':' + timeMatch[3] : ''}`
        }
        
        // Try to extract location (city names, countries)
        const locationMatch = question.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*(?:,|\s+)([A-Z][a-z]+)\b/)
        if (locationMatch) {
          birthPlace = `${locationMatch[1]}, ${locationMatch[2]}`
        }
        
        // If we have at least a date, calculate the chart
        if (birthDate) {
          try {
            const chartResponse = await apiClient.natal.calculate({
              birth_date: birthDate,
              birth_time: birthTime,
              birth_place: birthPlace || undefined,
              birth_city: birthPlace || undefined,
              latitude: settings.defaultLatitude || 0,
              longitude: settings.defaultLongitude || 0,
              timezone: settings.defaultTimezone || 'UTC',
              house_system: settings.houseSystem,
              include_extra_objects: settings.includeExtraObjects,
              use_topocentric_moon: settings.useTopocentricMoon,
              include_aspects: settings.includeAspects,
            })
            return chartResponse.data
          } catch (error) {
            console.error('Error calculating chart for other person:', error)
            // Fall back to default chart
          }
        }
      } catch (error) {
        console.error('Error extracting birth info:', error)
      }
    }
    
    // Return default chart if no other person detected or extraction failed
    return defaultChart
  }

  const generateResponse = async (question: string, chart: any, defaultChart?: any): Promise<string> => {
    const lowerQuestion = question.toLowerCase()
    const lang = settings.language || 'en'

    // Check if question is about current situation or transits
    if (
      lowerQuestion.includes('current') ||
      lowerQuestion.includes('now') ||
      lowerQuestion.includes('today') ||
      lowerQuestion.includes('transit') ||
      (lang === 'fr' && (lowerQuestion.includes('actuel') || lowerQuestion.includes('maintenant') || lowerQuestion.includes('transit'))) ||
      (lang === 'es' && (lowerQuestion.includes('actual') || lowerQuestion.includes('ahora') || lowerQuestion.includes('tránsito')))
    ) {
      return await handleCurrentTransits(chart, lang)
    }

    // Check if question is about future
    if (
      lowerQuestion.includes('future') ||
      lowerQuestion.includes('next') ||
      lowerQuestion.includes('will') ||
      lowerQuestion.includes('upcoming') ||
      (lang === 'fr' && (lowerQuestion.includes('futur') || lowerQuestion.includes('prochain'))) ||
      (lang === 'es' && (lowerQuestion.includes('futuro') || lowerQuestion.includes('próximo')))
    ) {
      return await handleFutureTransits(chart, lang)
    }

    // Check if question is about specific planet or sign (quick responses)
    const planets = ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']
    const signs = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces']
    
    // Only use quick responses for very specific planet/sign questions
    const isSpecificPlanetQuestion = planets.some(p => lowerQuestion.includes(p) && (lowerQuestion.includes('where') || lowerQuestion.includes('what') || lowerQuestion.includes('où') || lowerQuestion.includes('quoi')))
    if (isSpecificPlanetQuestion) {
      for (const planet of planets) {
        if (lowerQuestion.includes(planet)) {
          return generatePlanetResponse(planet, chart, lang)
        }
      }
    }

    // For interpretation requests or general questions, use Gemini AI
    const interpretationKeywords = [
      'interpretation', 'interpret', 'explain', 'tell me about', 'what does', 'what is',
      'interprétation', 'explique', 'parle', 'dis-moi', 'peux', 'peut', 'faire', 'mon', 'ma',
      'interpretación', 'explica', 'cuéntame', 'puedes', 'puede', 'hacer', 'mi'
    ]
    
    const isInterpretationRequest = interpretationKeywords.some(keyword => 
      lowerQuestion.includes(keyword)
    )

    // Use Gemini AI for interpretation requests and all general questions
    if (isInterpretationRequest || !isSpecificPlanetQuestion) {
      try {
        const systemInstruction = `You are an expert astrological interpreter. Provide detailed, insightful astrological interpretations. Write in ${lang === 'fr' ? 'French' : lang === 'es' ? 'Spanish' : 'English'}.`
        
        // Include chart context in the prompt if needed, or rely on previous conversation context (if we were sending it)
        // For now, we'll append minimal chart context if it's the first question about this chart
        const chartContext = chart && !question.includes('chart') ? `\n\nContext: Analyzing a natal chart with Sun in ${chart.planets?.sun?.sign}, Moon in ${chart.planets?.moon?.sign}, Ascendant in ${chart.ascendant_sign || 'unknown'}.` : ''
        
        const response = await apiClient.ai.interpret(
          question + chartContext,
          systemInstruction
        )

        if (response.error) {
          throw new Error(response.error)
        }

        return response.data?.content || ''
      } catch (error: any) {
        console.error('Gemini API error:', error)
        const errorMessage = error?.message || ''
        
        return lang === 'fr'
          ? `Désolé, une erreur s'est produite: ${errorMessage}. Veuillez réessayer.`
          : lang === 'es'
          ? `Lo siento, ocurrió un error: ${errorMessage}. Por favor intenta de nuevo.`
          : `Sorry, an error occurred: ${errorMessage}. Please try again.`
      }
    }

    // Fallback (should rarely be reached)
    return generateDefaultResponse(chart, lang)
  }

  const handleCurrentTransits = async (chart: any, lang: string): Promise<string> => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const natalPositions: Record<string, number> = {}
      
      // Extract planetary positions from chart
      if (chart.planets) {
        Object.entries(chart.planets).forEach(([key, value]: [string, any]) => {
          if (value && typeof value.longitude === 'number') {
            natalPositions[key] = value.longitude
          }
        })
      }

      const transitResponse = await apiClient.transits.calculate({
        natal_positions: natalPositions,
        natal_asc: chart.ascendant,
        natal_mc: chart.midheaven,
        target_date: today,
        include_angles: true,
      })

      const transitData = transitResponse.data || {}
      const transits = transitData.transits || []
      const transitsToAngles = transitData.transits_to_angles || []

      if (transits.length === 0 && transitsToAngles.length === 0) {
        return lang === 'fr'
          ? "Aucun transit majeur n'est actif en ce moment. C'est une période relativement calme astrologiquement."
          : lang === 'es'
          ? 'No hay tránsitos mayores activos en este momento. Es un período astrológicamente tranquilo.'
          : 'No major transits are active right now. This is a relatively calm astrological period.'
      }

      let response = lang === 'fr'
        ? '**Transits Actuels:**\n\n'
        : lang === 'es'
        ? '**Tránsitos Actuales:**\n\n'
        : '**Current Transits:**\n\n'

      // Add major transits
      const majorTransits = transits.slice(0, 5)
      majorTransits.forEach((transit: any) => {
        const aspect = transit.aspect || 'conjunction'
        const transitingBody = transit.transiting_body || 'planet'
        const natalBody = transit.natal_body || 'planet'
        response += `• ${transitingBody} ${aspect} ${natalBody}\n`
      })

      if (transitsToAngles.length > 0) {
        response += '\n' + (lang === 'fr' ? '**Transits aux Angles:**\n\n' : lang === 'es' ? '**Tránsitos a los Ángulos:**\n\n' : '**Transits to Angles:**\n\n')
        transitsToAngles.slice(0, 3).forEach((transit: any) => {
          const aspect = transit.aspect || 'conjunction'
          const transitingBody = transit.transiting_body || 'planet'
          const angle = transit.angle || 'angle'
          response += `• ${transitingBody} ${aspect} ${angle}\n`
        })
      }

      return response
    } catch (error) {
      console.error('Error fetching transits:', error)
      return lang === 'fr'
        ? "Je n'ai pas pu récupérer vos transits actuels. Veuillez réessayer plus tard."
        : lang === 'es'
        ? 'No pude obtener tus tránsitos actuales. Por favor intenta más tarde.'
        : "I couldn't fetch your current transits. Please try again later."
    }
  }

  const handleFutureTransits = async (chart: any, lang: string): Promise<string> => {
    try {
      // Get transits for next month
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      const targetDate = nextMonth.toISOString().split('T')[0]

      const natalPositions: Record<string, number> = {}
      if (chart.planets) {
        Object.entries(chart.planets).forEach(([key, value]: [string, any]) => {
          if (value && typeof value.longitude === 'number') {
            natalPositions[key] = value.longitude
          }
        })
      }

      const transitResponse = await apiClient.transits.calculate({
        natal_positions: natalPositions,
        natal_asc: chart.ascendant,
        natal_mc: chart.midheaven,
        target_date: targetDate,
        include_angles: true,
      })

      const transitData = transitResponse.data || {}
      const transits = transitData.transits || []

      if (transits.length === 0) {
        return lang === 'fr'
          ? 'Aucun transit majeur prévu pour le mois prochain.'
          : lang === 'es'
          ? 'No hay tránsitos mayores previstos para el próximo mes.'
          : 'No major transits are expected for next month.'
      }

      let response = lang === 'fr'
        ? `**Transits Prévus (${nextMonth.toLocaleDateString(lang === 'fr' ? 'fr-FR' : lang === 'es' ? 'es-ES' : 'en-US')}):**\n\n`
        : lang === 'es'
        ? `**Tránsitos Previstos (${nextMonth.toLocaleDateString('es-ES')}):**\n\n`
        : `**Upcoming Transits (${nextMonth.toLocaleDateString('en-US')}):**\n\n`

      transits.slice(0, 5).forEach((transit: any) => {
        const aspect = transit.aspect || 'conjunction'
        const transitingBody = transit.transiting_body || 'planet'
        const natalBody = transit.natal_body || 'planet'
        response += `• ${transitingBody} ${aspect} ${natalBody}\n`
      })

      return response
    } catch (error) {
      console.error('Error fetching future transits:', error)
      return lang === 'fr'
        ? "Je n'ai pas pu récupérer les transits futurs. Veuillez réessayer plus tard."
        : lang === 'es'
        ? 'No pude obtener los tránsitos futuros. Por favor intenta más tarde.'
        : "I couldn't fetch future transits. Please try again later."
    }
  }

  const generatePlanetResponse = (planet: string, chart: any, lang: string): string => {
    const planetData = chart.planets?.[planet]
    if (!planetData) {
      return lang === 'fr'
        ? `Je n'ai pas trouvé d'information sur ${planet} dans votre thème.`
        : lang === 'es'
        ? `No encontré información sobre ${planet} en tu carta.`
        : `I couldn't find information about ${planet} in your chart.`
    }

    const sign = planetData.sign || 'unknown'
    const house = planetData.house || 'unknown'
    const longitude = planetData.longitude || 0

    return lang === 'fr'
      ? `**${planet.charAt(0).toUpperCase() + planet.slice(1)} dans votre thème:**\n\n` +
        `• Signe: ${sign}\n` +
        `• Maison: ${house}\n` +
        `• Longitude: ${longitude.toFixed(2)}°\n\n` +
        `Le ${planet} en ${sign} influence votre ${planet === 'sun' ? 'identité fondamentale' : planet === 'moon' ? 'nature émotionnelle' : 'expression personnelle'}.`
      : lang === 'es'
      ? `**${planet.charAt(0).toUpperCase() + planet.slice(1)} en tu carta:**\n\n` +
        `• Signo: ${sign}\n` +
        `• Casa: ${house}\n` +
        `• Longitud: ${longitude.toFixed(2)}°\n\n` +
        `${planet.charAt(0).toUpperCase() + planet.slice(1)} en ${sign} influye en tu ${planet === 'sun' ? 'identidad fundamental' : planet === 'moon' ? 'naturaleza emocional' : 'expresión personal'}.`
      : `**${planet.charAt(0).toUpperCase() + planet.slice(1)} in your chart:**\n\n` +
        `• Sign: ${sign}\n` +
        `• House: ${house}\n` +
        `• Longitude: ${longitude.toFixed(2)}°\n\n` +
        `${planet.charAt(0).toUpperCase() + planet.slice(1)} in ${sign} influences your ${planet === 'sun' ? 'core identity' : planet === 'moon' ? 'emotional nature' : 'personal expression'}.`
  }

  const generateSignResponse = (sign: string, chart: any, lang: string): string => {
    // Find planets in this sign
    const planetsInSign: string[] = []
    if (chart.planets) {
      Object.entries(chart.planets).forEach(([planet, data]: [string, any]) => {
        if (data?.sign?.toLowerCase() === sign) {
          planetsInSign.push(planet)
        }
      })
    }

    if (planetsInSign.length === 0) {
      return lang === 'fr'
        ? `Aucune planète n'est en ${sign} dans votre thème.`
        : lang === 'es'
        ? `No hay planetas en ${sign} en tu carta.`
        : `No planets are in ${sign} in your chart.`
    }

    return lang === 'fr'
      ? `**Planètes en ${sign}:**\n\n` +
        planetsInSign.map((p) => `• ${p}`).join('\n') +
        `\n\nCes planètes sont influencées par l'énergie du ${sign}.`
      : lang === 'es'
      ? `**Planetas en ${sign}:**\n\n` +
        planetsInSign.map((p) => `• ${p}`).join('\n') +
        `\n\nEstos planetas están influenciados por la energía de ${sign}.`
      : `**Planets in ${sign}:**\n\n` +
        planetsInSign.map((p) => `• ${p}`).join('\n') +
        `\n\nThese planets are influenced by ${sign} energy.`
  }

  const generateDefaultResponse = (chart: any, lang: string): string => {
    return lang === 'fr'
      ? 'Je peux vous aider à comprendre votre thème natal, les transits actuels et futurs, et les significations astrologiques. Posez-moi une question spécifique!'
      : lang === 'es'
      ? 'Puedo ayudarte a entender tu carta natal, tránsitos actuales y futuros, y significados astrológicos. ¡Hazme una pregunta específica!'
      : 'I can help you understand your natal chart, current and future transits, and astrological meanings. Ask me a specific question!'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton href="/" />
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden flex flex-col"
          style={{ height: 'calc(100vh - 200px)' }}
        >
          {/* Header */}
          <div className="p-6 border-b border-white/20">
            <h1 className="text-2xl font-bold text-white flex items-center">
              <MessageSquare className="h-6 w-6 mr-3 text-yellow-400" />
              {t.title}
            </h1>
            {!hasApiKey && (
              <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Key className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-yellow-400 font-medium mb-1">
                      {lang === 'fr'
                        ? 'Clé API Gemini requise'
                        : lang === 'es'
                        ? 'Clave API de Gemini requerida'
                        : 'Gemini API Key Required'}
                    </p>
                    <p className="text-xs text-yellow-300/80 mb-2">
                      {lang === 'fr'
                        ? "Pour utiliser le chat, veuillez obtenir votre clé API Gemini (GRATUITE) et l'ajouter dans les paramètres."
                        : lang === 'es'
                        ? 'Para usar el chat, por favor obtén tu clave API de Gemini (GRATIS) y agrégalo en la configuración.'
                        : 'To use the chat, please get your Gemini API key (FREE) and add it in settings.'}
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-xs text-yellow-400 hover:text-yellow-300 transition underline"
                      >
                        <Key className="h-4 w-4" />
                        {lang === 'fr' ? 'Obtenir une clé API (GRATUITE)' : lang === 'es' ? 'Obtener clave API (GRATIS)' : 'Get FREE API Key'}
                      </a>
                      <Link
                        href="/settings"
                        className="inline-flex items-center gap-2 text-xs text-yellow-400 hover:text-yellow-300 transition underline"
                      >
                        <Settings className="h-4 w-4" />
                        {lang === 'fr' ? 'Aller aux paramètres' : lang === 'es' ? 'Ir a configuración' : 'Go to Settings'}
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {!latestChart && hasApiKey && (
              <p className="text-sm text-yellow-400 mt-2">{t.noChart}</p>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex items-start gap-3 max-w-[80%] ${
                      message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                    }`}
                  >
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user'
                          ? 'bg-purple-600'
                          : 'bg-blue-600'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="h-4 w-4 text-white" />
                      ) : (
                        <Bot className="h-4 w-4 text-white" />
                      )}
                    </div>
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.role === 'user'
                          ? 'bg-purple-600/80 text-white'
                          : 'bg-white/10 text-white'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>

          {/* Example Questions */}
          {messages.length <= 1 && hasApiKey && (
            <div className="px-6 pb-4">
              <p className="text-sm text-white/60 mb-2">
                {lang === 'fr' ? "Questions d'exemple:" : lang === 'es' ? 'Preguntas de ejemplo:' : 'Example questions:'}
              </p>
              <div className="flex flex-wrap gap-2">
                {t.exampleQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInput(q)}
                    className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full text-white/80 transition"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-6 border-t border-white/20">
            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder={hasApiKey ? t.placeholder : (lang === 'fr' ? "Configurez votre clé API Gemini d'abord..." : lang === 'es' ? 'Configura tu clave API de Gemini primero...' : 'Configure your Gemini API key first...')}
                disabled={loading || !latestChart || !hasApiKey}
                className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim() || !latestChart || !hasApiKey}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? (
                  <Sparkles className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
                <span className="hidden sm:inline">{t.send}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

