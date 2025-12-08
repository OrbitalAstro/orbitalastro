'use client'

import { motion } from 'framer-motion'
import { Settings as SettingsIcon, RotateCcw } from 'lucide-react'
import { useSettingsStore } from '@/lib/store'

export default function Settings() {
  const settings = useSettingsStore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20"
        >
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white flex items-center">
              <SettingsIcon className="h-8 w-8 mr-3 text-yellow-400" />
              Settings
            </h1>
            <button
              onClick={settings.resetSettings}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition flex items-center"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </button>
          </div>

          <div className="space-y-8">
            {/* House System */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">House System</h2>
              <select
                value={settings.houseSystem}
                onChange={(e) => settings.updateSettings({ houseSystem: e.target.value })}
                className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              <h2 className="text-xl font-semibold text-white mb-4">Chart Options</h2>
              <div className="space-y-4">
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={settings.includeExtraObjects}
                    onChange={(e) => settings.updateSettings({ includeExtraObjects: e.target.checked })}
                    className="mr-3 w-4 h-4"
                  />
                  Include Extra Objects (Lilith, Asteroids, etc.)
                </label>
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={settings.useTopocentricMoon}
                    onChange={(e) => settings.updateSettings({ useTopocentricMoon: e.target.checked })}
                    className="mr-3 w-4 h-4"
                  />
                  Use Topocentric Moon Parallax Correction
                </label>
                <label className="flex items-center text-white">
                  <input
                    type="checkbox"
                    checked={settings.includeAspects}
                    onChange={(e) => settings.updateSettings({ includeAspects: e.target.checked })}
                    className="mr-3 w-4 h-4"
                  />
                  Include Aspect Calculations
                </label>
              </div>
            </section>

            {/* Narrative Settings */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Narrative Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Tone</label>
                  <select
                    value={settings.narrativeTone}
                    onChange={(e) => settings.updateSettings({ narrativeTone: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {['mythic', 'psychological', 'coaching', 'cinematic', 'soft_therapeutic'].map((tone) => (
                      <option key={tone} value={tone}>
                        {tone.charAt(0).toUpperCase() + tone.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Depth</label>
                  <select
                    value={settings.narrativeDepth}
                    onChange={(e) => settings.updateSettings({ narrativeDepth: e.target.value })}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    {['short', 'standard', 'long'].map((depth) => (
                      <option key={depth} value={depth}>
                        {depth.charAt(0).toUpperCase() + depth.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Focus Areas</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['career', 'relationships', 'family', 'spirituality', 'creativity', 'healing'].map((focus) => (
                      <label key={focus} className="flex items-center text-white">
                        <input
                          type="checkbox"
                          checked={settings.narrativeFocus.includes(focus)}
                          onChange={(e) => {
                            const newFocus = e.target.checked
                              ? [...settings.narrativeFocus, focus]
                              : settings.narrativeFocus.filter((f) => f !== focus)
                            settings.updateSettings({ narrativeFocus: newFocus })
                          }}
                          className="mr-2 w-4 h-4"
                        />
                        {focus.charAt(0).toUpperCase() + focus.slice(1)}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Chart Visualization */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Chart Visualization</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Style</label>
                  <select
                    value={settings.chartStyle}
                    onChange={(e) => settings.updateSettings({ chartStyle: e.target.value as 'traditional' | 'modern' })}
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="traditional">Traditional</option>
                    <option value="modern">Modern</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Size: {settings.chartSize}px
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

            {/* Default Location */}
            <section>
              <h2 className="text-xl font-semibold text-white mb-4">Default Location</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Latitude</label>
                  <input
                    type="number"
                    value={settings.defaultLatitude || ''}
                    onChange={(e) => settings.updateSettings({ defaultLatitude: e.target.value ? parseFloat(e.target.value) : null })}
                    step="0.0001"
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">Longitude</label>
                  <input
                    type="number"
                    value={settings.defaultLongitude || ''}
                    onChange={(e) => settings.updateSettings({ defaultLongitude: e.target.value ? parseFloat(e.target.value) : null })}
                    step="0.0001"
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-white/80 mb-2">Timezone</label>
                  <input
                    type="text"
                    value={settings.defaultTimezone}
                    onChange={(e) => settings.updateSettings({ defaultTimezone: e.target.value })}
                    placeholder="America/New_York"
                    className="w-full px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

