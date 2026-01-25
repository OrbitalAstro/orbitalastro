'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Send } from 'lucide-react'
import BackButton from '@/components/BackButton'
import { useTranslation } from '@/lib/useTranslation'

export default function ContactPage() {
  const t = useTranslation()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('sending')
    setErrorMessage('')

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Une erreur est survenue')
      }

      setStatus('success')
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch (error: any) {
      setStatus('error')
      setErrorMessage(error.message || 'Une erreur est survenue lors de l\'envoi du message.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-purple via-magenta-purple to-cosmic-purple relative">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <BackButton href="/" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-cosmic-purple/60 to-magenta-purple/60 backdrop-blur-sm rounded-xl p-8 border border-cosmic-gold/20 relative z-10"
        >
          <div className="flex items-center justify-center gap-3 mb-8">
            <Mail className="h-8 w-8 text-cosmic-gold" />
            <h1 className="text-3xl font-bold text-cosmic-gold">Contactez-nous</h1>
          </div>

          <p className="text-cosmic-gold/90 mb-8 text-center">
            Une question ? Une suggestion ? Écrivez-nous et nous vous répondrons dans les plus brefs délais.
          </p>

          {status === 'success' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-6 bg-green-500/20 border border-green-400/50 rounded-lg"
            >
              <p className="text-green-300 text-center font-semibold">
                Message envoyé avec succès ! Nous vous répondrons bientôt.
              </p>
            </motion.div>
          ) : status === 'error' ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-6 bg-red-500/20 border border-red-400/50 rounded-lg"
            >
              <p className="text-red-300 text-center font-semibold">
                {errorMessage || 'Une erreur est survenue. Veuillez réessayer.'}
              </p>
            </motion.div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-cosmic-gold mb-2">
                Nom
              </label>
              <input
                type="text"
                id="name"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-cosmic-gold/30 text-cosmic-gold placeholder-cosmic-gold/50 focus:outline-none focus:border-cosmic-gold"
                placeholder="Votre nom"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-cosmic-gold mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-cosmic-gold/30 text-cosmic-gold placeholder-cosmic-gold/50 focus:outline-none focus:border-cosmic-gold"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-cosmic-gold mb-2">
                Sujet
              </label>
              <input
                type="text"
                id="subject"
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-cosmic-gold/30 text-cosmic-gold placeholder-cosmic-gold/50 focus:outline-none focus:border-cosmic-gold"
                placeholder="Sujet de votre message"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-cosmic-gold mb-2">
                Message
              </label>
              <textarea
                id="message"
                required
                rows={6}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-cosmic-gold/30 text-cosmic-gold placeholder-cosmic-gold/50 focus:outline-none focus:border-cosmic-gold resize-none"
                placeholder="Votre message..."
              />
            </div>

            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full px-6 py-3 bg-gradient-to-r from-cosmic-gold via-rose-gold to-cosmic-gold text-cosmic-purple rounded-lg font-semibold hover:shadow-lg hover:shadow-cosmic-gold/50 transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'sending' ? (
                <>
                  <Send className="h-5 w-5 animate-pulse" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Envoyer le message
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-cosmic-gold/20 text-center">
            <p className="text-cosmic-gold/80 text-sm">
              Vous pouvez aussi nous écrire directement à{' '}
              <a
                href="mailto:info@orbitalastro.ca"
                className="text-cosmic-gold hover:text-rose-gold underline"
              >
                info@orbitalastro.ca
              </a>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

