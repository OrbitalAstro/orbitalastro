'use client'

import { useState } from 'react'
import { BookOpen, Sparkles, Moon, Sun } from 'lucide-react'
import { useSettingsStore } from '@/lib/store'
import { getHouseName } from '@/lib/houseNames'

interface InterpretationPanelProps {
  chart: any
}

export default function InterpretationPanel({ chart }: InterpretationPanelProps) {
  const settings = useSettingsStore()
  const [activeTab, setActiveTab] = useState<'overview' | 'planets' | 'houses' | 'aspects'>('overview')

  if (!chart) return null

  const planets = chart.planets || {}
  const aspects = chart.aspects || []
  const patterns = chart.patterns || {}

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex space-x-2 border-b border-white/20">
        {[
          { id: 'overview', label: 'Overview', icon: BookOpen },
          { id: 'planets', label: 'Planets', icon: Sun },
          { id: 'houses', label: 'Houses', icon: Sparkles },
          { id: 'aspects', label: 'Aspects', icon: Moon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 font-medium transition ${
              activeTab === tab.id
                ? 'text-white border-b-2 border-purple-500'
                : 'text-white/60 hover:text-white/80'
            }`}
          >
            <tab.icon className="inline h-4 w-4 mr-1" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="text-white/80 space-y-4">
        {activeTab === 'overview' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Chart Summary</h3>
            <p className="mb-4">
              Your natal chart reveals a {planets.sun?.sign || 'Unknown'} Sun with a{' '}
              {planets.moon?.sign || 'Unknown'} Moon, indicating{' '}
              {settings.narrativeTone === 'mythic' ? 'cosmic themes' : 'psychological patterns'} of{' '}
              {planets.sun?.sign || 'your sign'}.
            </p>
            {aspects.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Key Aspects</h4>
                <ul className="list-disc list-inside space-y-1">
                  {aspects.slice(0, 5).map((aspect: any, idx: number) => (
                    <li key={idx}>
                      {aspect.body1} {aspect.aspect} {aspect.body2} ({aspect.orb_deg.toFixed(1)}°)
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {activeTab === 'planets' && (
          <div className="space-y-3">
            {Object.entries(planets).map(([name, planet]: [string, any]) => (
              <div key={name} className="bg-white/5 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="font-semibold capitalize">{name}</span>
                  <span className="text-sm">
                    {planet.sign} • {getHouseName(planet.house, settings.language || 'en')}
                  </span>
                </div>
                <div className="text-sm text-white/60 mt-1">
                  {planet.longitude.toFixed(2)}°
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'houses' && (
          <div>
            {chart.house_system && (
              <div className="mb-4 pb-4 border-b border-white/20">
                <span className="text-sm text-white/60">
                  {settings.language === 'fr' ? 'Système de maisons:' : settings.language === 'es' ? 'Sistema de casas:' : 'House System:'}{' '}
                </span>
                <span className="text-sm font-semibold text-white capitalize">
                  {chart.house_system.replace('_', ' ')}
                </span>
              </div>
            )}
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(chart.houses || {}).map(([num, cusp]: [string, any]) => (
                <div key={num} className="bg-white/5 rounded-lg p-2 text-sm">
                  <span className="font-semibold">{getHouseName(num, settings.language || 'en')}</span>
                  <div className="text-white/60">{cusp.toFixed(2)}°</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'aspects' && (
          <div className="space-y-2">
            {aspects.map((aspect: any, idx: number) => (
              <div key={idx} className="bg-white/5 rounded-lg p-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium capitalize">
                    {aspect.body1} {aspect.aspect} {aspect.body2}
                  </span>
                  <span className="text-sm">
                    {aspect.orb_deg.toFixed(2)}° {aspect.applying ? '(applying)' : '(separating)'}
                  </span>
                </div>
              </div>
            ))}
            {Object.keys(patterns).length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/20">
                <h4 className="font-semibold mb-2">Aspect Patterns</h4>
                {patterns.grand_trines && patterns.grand_trines.length > 0 && (
                  <div className="text-sm">Grand Trines: {patterns.grand_trines.length}</div>
                )}
                {patterns.t_squares && patterns.t_squares.length > 0 && (
                  <div className="text-sm">T-Squares: {patterns.t_squares.length}</div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

