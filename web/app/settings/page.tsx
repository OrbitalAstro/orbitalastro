'use client'

export const dynamic = 'force-dynamic'

import { motion } from 'framer-motion'
import { Globe, Settings as SettingsIcon } from 'lucide-react'
import BackButton from '@/components/BackButton'
import { useSettingsStore } from '@/lib/store'
import { useTranslation } from '@/lib/useTranslation'

export default function Settings() {
  const settings = useSettingsStore()
  const t = useTranslation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton href="/" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20"
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white flex items-center">
              <SettingsIcon className="h-8 w-8 mr-3 text-yellow-400" />
              {t.settings.title}
            </h1>
          </div>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
              <Globe className="h-5 w-5 mr-2 text-yellow-400" />
              {t.settings.language}
            </h2>
            <select
              value={settings.language || 'fr'}
              onChange={(e) => settings.updateSettings({ language: e.target.value as 'en' | 'fr' | 'es' })}
              className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [&>option]:bg-slate-900 [&>option]:text-white"
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
            </select>
            <p className="mt-2 text-sm text-white/60">{t.settings.languageDescription}</p>
          </section>
        </motion.div>
      </div>
    </div>
  )
}
