'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Users, Sparkles } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import ChartVisualization from './ChartVisualization'
import { useToast } from '@/lib/toast'

interface SynastryChartProps {
  chart1: any
  chart2: any
}

export default function SynastryChart({ chart1, chart2 }: SynastryChartProps) {
  const toast = useToast()
  const [showAspects, setShowAspects] = useState(true)

  // Calculate synastry aspects between the two charts
  const synastryAspects = []
  if (chart1?.planets && chart2?.planets) {
    for (const [planet1, data1] of Object.entries(chart1.planets)) {
      for (const [planet2, data2] of Object.entries(chart2.planets)) {
        const pos1 = (data1 as any).longitude
        const pos2 = (data2 as any).longitude
        const diff = Math.abs(pos1 - pos2) % 360
        const angle = diff > 180 ? 360 - diff : diff

        // Check for major aspects
        const aspects = [
          { name: 'conjunction', angle: 0, orb: 8 },
          { name: 'opposition', angle: 180, orb: 8 },
          { name: 'trine', angle: 120, orb: 8 },
          { name: 'square', angle: 90, orb: 8 },
          { name: 'sextile', angle: 60, orb: 6 },
        ]

        for (const aspect of aspects) {
          if (Math.abs(angle - aspect.angle) <= aspect.orb) {
            synastryAspects.push({
              planet1,
              planet2,
              aspect: aspect.name,
              orb: Math.abs(angle - aspect.angle),
            })
          }
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
          <Users className="h-6 w-6 text-cosmic-gold" />
          Synastry Comparison
        </h3>
        <label className="flex items-center gap-2 text-white/70">
          <input
            type="checkbox"
            checked={showAspects}
            onChange={(e) => setShowAspects(e.target.checked)}
            className="w-4 h-4"
          />
          Show Aspects
        </label>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h4 className="text-lg font-semibold text-white mb-4">Chart 1</h4>
          <ChartVisualization chart={chart1} />
        </div>
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h4 className="text-lg font-semibold text-white mb-4">Chart 2</h4>
          <ChartVisualization chart={chart2} />
        </div>
      </div>

      {showAspects && synastryAspects.length > 0 && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h4 className="text-lg font-semibold text-white mb-4">Synastry Aspects</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {synastryAspects.slice(0, 20).map((aspect, idx) => (
              <div
                key={idx}
                className="bg-white/5 rounded-lg p-3 flex justify-between items-center"
              >
                <span className="text-white capitalize">
                  {aspect.planet1} {aspect.aspect} {aspect.planet2}
                </span>
                <span className="text-white/60 text-sm">
                  {aspect.orb.toFixed(2)}°
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}




