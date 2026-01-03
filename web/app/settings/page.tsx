'use client'

export const dynamic = 'force-dynamic'

import { motion } from 'framer-motion'
import { Settings as SettingsIcon, RotateCcw, Globe, Key } from 'lucide-react'
import { useSettingsStore } from '@/lib/store'
import BackButton from '@/components/BackButton'
import { useEffect, useState } from 'react'
import { useTranslation } from '@/lib/useTranslation'

export default function Settings() {
  const settings = useSettingsStore()
  const t = useTranslation()
  const [deviceTimezone, setDeviceTimezone] = useState<string>('')

  // Get device timezone on mount
  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    setDeviceTimezone(tz)
    // Auto-set timezone if not already set
    if (!settings.defaultTimezone || settings.defaultTimezone === 'UTC') {
      settings.updateSettings({ defaultTimezone: tz })
    }
  }, [])

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
            <button
              onClick={settings.resetSettings}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition flex items-center"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              {t.settings.reset}
            </button>
          </div>

          <div className="space-y-8">
            {/* Language */}
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
              <p className="mt-2 text-sm text-white/60">
                {t.settings.languageDescription}
              </p>
            </section>

            {/* House System */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">{t.settings.houseSystem}</h2>
              <select
                value={settings.houseSystem || 'placidus'}
                onChange={(e) => settings.updateSettings({ houseSystem: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [&>option]:bg-slate-900 [&>option]:text-white"
              >
                {[
                  'placidus', 'whole_sign', 'equal', 'koch', 'porphyry',
                  'regiomontanus', 'campanus', 'alcabitius', 'meridian', 'topocentric'
                ].map((system) => (
                  <option key={system} value={system}>
                    {system.charAt(0).toUpperCase() + system.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </section>

            {/* Chart Options */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">{t.settings.chartOptions}</h2>
              <div className="space-y-4">
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={settings.includeExtraObjects}
                    onChange={(e) => settings.updateSettings({ includeExtraObjects: e.target.checked })}
                    className="mr-3 w-4 h-4"
                  />
                  {t.settings.includeExtraObjects}
                </label>
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={settings.useTopocentricMoon}
                    onChange={(e) => settings.updateSettings({ useTopocentricMoon: e.target.checked })}
                    className="mr-3 w-4 h-4"
                  />
                  {t.settings.useTopocentricMoon}
                </label>
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={settings.includeAspects}
                    onChange={(e) => settings.updateSettings({ includeAspects: e.target.checked })}
                    className="mr-3 w-4 h-4"
                  />
                  {t.settings.includeAspects}
                </label>
              </div>
            </section>

            {/* Narrative Settings */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">{t.settings.narrativeSettings}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">{t.settings.tone}</label>
                  <select
                    value={settings.narrativeTone || 'mythic'}
                    onChange={(e) => settings.updateSettings({ narrativeTone: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [&>option]:bg-slate-900 [&>option]:text-white"
                  >
                    {[
                      { value: 'mythic', label: t.settings.toneMythic },
                      { value: 'psychological', label: t.settings.tonePsychological },
                      { value: 'coaching', label: t.settings.toneCoaching },
                      { value: 'cinematic', label: t.settings.toneCinematic },
                      { value: 'soft_therapeutic', label: t.settings.toneSoftTherapeutic },
                    ].map((tone) => (
                      <option key={tone.value} value={tone.value}>
                        {tone.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">{t.settings.depth}</label>
                  <select
                    value={settings.narrativeDepth || 'standard'}
                    onChange={(e) => settings.updateSettings({ narrativeDepth: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [&>option]:bg-slate-900 [&>option]:text-white"
                  >
                    {[
                      { value: 'short', label: t.settings.depthShort },
                      { value: 'standard', label: t.settings.depthStandard },
                      { value: 'long', label: t.settings.depthLong },
                      { value: 'comprehensive', label: t.settings.depthComprehensive },
                    ].map((depth) => (
                      <option key={depth.value} value={depth.value}>
                        {depth.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">{t.settings.focusAreas}</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { key: 'career', label: t.settings.career },
                      { key: 'relationships', label: t.settings.relationships },
                      { key: 'family', label: t.settings.family },
                      { key: 'spirituality', label: t.settings.spirituality },
                      { key: 'creativity', label: t.settings.creativity },
                      { key: 'healing', label: t.settings.healing },
                    ].map((focus) => (
                      <label key={focus.key} className="flex items-center text-white">
                        <input
                          type="checkbox"
                          checked={settings.narrativeFocus.includes(focus.key)}
                          onChange={(e) => {
                            const newFocus = e.target.checked
                              ? [...settings.narrativeFocus, focus.key]
                              : settings.narrativeFocus.filter((f) => f !== focus.key)
                            settings.updateSettings({ narrativeFocus: newFocus })
                          }}
                          className="mr-2 w-4 h-4"
                        />
                        {focus.label}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    {t.settings.interpretationPrompt}
                  </label>
                  <textarea
                    value={settings.interpretationPrompt || ''}
                    onChange={(e) => settings.updateSettings({ interpretationPrompt: e.target.value })}
                    placeholder={t.settings.interpretationPromptPlaceholder}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-y min-h-[200px] max-h-[400px] overflow-y-auto custom-scrollbar"
                    rows={10}
                  />
                  <p className="mt-2 text-sm text-white/60">
                    {t.settings.interpretationPromptDescription}
                  </p>
                </div>
              </div>
            </section>

            {/* Chart Visualization */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">{t.settings.chartVisualization}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">{t.settings.style}</label>
                  <select
                    value={settings.chartStyle || 'traditional'}
                    onChange={(e) => settings.updateSettings({ chartStyle: e.target.value as 'traditional' | 'modern' })}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [&>option]:bg-slate-900 [&>option]:text-white"
                  >
                    <option value="traditional">Traditional</option>
                    <option value="modern">Modern</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    {t.settings.size}: {settings.chartSize}px
                  </label>
                  <input
                    type="range"
                    min="400"
                    max="1000"
                    step="50"
                    value={settings.chartSize}
                    onChange={(e) => settings.updateSettings({ chartSize: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>
              </div>
            </section>

            {/* Default Birth Information */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">{t.settings.defaultBirthInfo}</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">{t.settings.firstName}</label>
                    <input
                      type="text"
                      value={settings.defaultFirstName}
                      onChange={(e) => settings.updateSettings({ defaultFirstName: e.target.value })}
                      placeholder={t.settings.firstName}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">{t.settings.lastName}</label>
                    <input
                      type="text"
                      value={settings.defaultLastName}
                      onChange={(e) => settings.updateSettings({ defaultLastName: e.target.value })}
                      placeholder={t.settings.lastName}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">{t.settings.dateOfBirth}</label>
                    <input
                      type="date"
                      value={settings.defaultBirthDate}
                      onChange={(e) => settings.updateSettings({ defaultBirthDate: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-white/80 mb-2">{t.settings.hourOfBirth}</label>
                    <input
                      type="time"
                      value={settings.defaultBirthTime}
                      onChange={(e) => settings.updateSettings({ defaultBirthTime: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">{t.settings.timezone}</label>
                  <div className="flex gap-2">
                    <select
                      value={settings.defaultTimezone || deviceTimezone || 'UTC'}
                      onChange={(e) => settings.updateSettings({ defaultTimezone: e.target.value })}
                      className="flex-1 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 [&>option]:bg-slate-900 [&>option]:text-white [&>optgroup]:bg-slate-800"
                    >
                      {(settings.defaultTimezone && !['America', 'Europe', 'Asia', 'Australia', 'Pacific', 'Africa', 'UTC'].some(prefix => settings.defaultTimezone?.startsWith(prefix))) && (
                        <optgroup label={settings.language === 'fr' ? 'Actuel' : settings.language === 'es' ? 'Actual' : 'Current'}>
                          <option value={settings.defaultTimezone}>{settings.defaultTimezone}</option>
                        </optgroup>
                      )}
                      <optgroup label="Americas">
                        <option value="America/New_York">Eastern Time (ET) - New York</option>
                        <option value="America/Chicago">Central Time (CT) - Chicago</option>
                        <option value="America/Denver">Mountain Time (MT) - Denver</option>
                        <option value="America/Los_Angeles">Pacific Time (PT) - Los Angeles</option>
                        <option value="America/Phoenix">Arizona Time - Phoenix</option>
                        <option value="America/Anchorage">Alaska Time - Anchorage</option>
                        <option value="America/Toronto">Eastern Time - Toronto</option>
                        <option value="America/Vancouver">Pacific Time - Vancouver</option>
                        <option value="America/Toronto">Eastern Time - Toronto/Montreal</option>
                        <option value="America/Mexico_City">Central Time - Mexico City</option>
                        <option value="America/Sao_Paulo">Brasília Time - São Paulo</option>
                        <option value="America/Buenos_Aires">Argentina Time - Buenos Aires</option>
                      </optgroup>
                      <optgroup label="Europe">
                        <option value="Europe/London">Greenwich Mean Time (GMT) - London</option>
                        <option value="Europe/Paris">Central European Time (CET) - Paris</option>
                        <option value="Europe/Berlin">Central European Time - Berlin</option>
                        <option value="Europe/Rome">Central European Time - Rome</option>
                        <option value="Europe/Madrid">Central European Time - Madrid</option>
                        <option value="Europe/Amsterdam">Central European Time - Amsterdam</option>
                        <option value="Europe/Brussels">Central European Time - Brussels</option>
                        <option value="Europe/Vienna">Central European Time - Vienna</option>
                        <option value="Europe/Zurich">Central European Time - Zurich</option>
                        <option value="Europe/Stockholm">Central European Time - Stockholm</option>
                        <option value="Europe/Oslo">Central European Time - Oslo</option>
                        <option value="Europe/Copenhagen">Central European Time - Copenhagen</option>
                        <option value="Europe/Helsinki">Eastern European Time - Helsinki</option>
                        <option value="Europe/Athens">Eastern European Time - Athens</option>
                        <option value="Europe/Moscow">Moscow Time - Moscow</option>
                      </optgroup>
                      <optgroup label="Asia">
                        <option value="Asia/Dubai">Gulf Standard Time - Dubai</option>
                        <option value="Asia/Kolkata">India Standard Time - Mumbai</option>
                        <option value="Asia/Shanghai">China Standard Time - Shanghai</option>
                        <option value="Asia/Tokyo">Japan Standard Time - Tokyo</option>
                        <option value="Asia/Seoul">Korea Standard Time - Seoul</option>
                        <option value="Asia/Hong_Kong">Hong Kong Time - Hong Kong</option>
                        <option value="Asia/Singapore">Singapore Time - Singapore</option>
                        <option value="Asia/Bangkok">Indochina Time - Bangkok</option>
                        <option value="Asia/Jakarta">Western Indonesia Time - Jakarta</option>
                        <option value="Asia/Manila">Philippine Time - Manila</option>
                      </optgroup>
                      <optgroup label="Oceania">
                        <option value="Australia/Sydney">Australian Eastern Time - Sydney</option>
                        <option value="Australia/Melbourne">Australian Eastern Time - Melbourne</option>
                        <option value="Australia/Brisbane">Australian Eastern Time - Brisbane</option>
                        <option value="Australia/Perth">Australian Western Time - Perth</option>
                        <option value="Pacific/Auckland">New Zealand Time - Auckland</option>
                      </optgroup>
                      <optgroup label="Africa">
                        <option value="Africa/Cairo">Eastern European Time - Cairo</option>
                        <option value="Africa/Johannesburg">South Africa Standard Time - Johannesburg</option>
                        <option value="Africa/Lagos">West Africa Time - Lagos</option>
                      </optgroup>
                      <optgroup label="UTC">
                        <option value="UTC">Coordinated Universal Time (UTC)</option>
                      </optgroup>
                    </select>
                    <button
                      onClick={() => {
                        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
                        settings.updateSettings({ defaultTimezone: tz })
                        setDeviceTimezone(tz)
                      }}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition text-sm whitespace-nowrap"
                      title={t.settings.useDevice}
                    >
                      {t.settings.useDevice}
                    </button>
                  </div>
                  {deviceTimezone && (
                    <p className="mt-1 text-xs text-white/60">
                      {t.settings.deviceTimezone}: <span className="text-aurora-teal">{deviceTimezone}</span>
                    </p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
