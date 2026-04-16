'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { RotateCcw, Maximize2 } from 'lucide-react'
import ChartVisualization from './ChartVisualization'

interface BiWheelProps {
  chart1: any
  chart2: any
  label1?: string
  label2?: string
  showAspects?: boolean
}

export default function BiWheel({ chart1, chart2, label1 = 'Chart 1', label2 = 'Chart 2', showAspects = true }: BiWheelProps) {
  const [rotation, setRotation] = useState(0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-heading font-bold text-white">BiWheel View</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRotation(0)}
            className="p-2 hover:bg-white/10 rounded-lg transition text-white/70 hover:text-white"
            title="Reset rotation"
          >
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 0.5 }}
          className="bg-white/5 rounded-xl p-6 border border-white/10"
        >
          <h4 className="text-lg font-semibold text-white mb-4 text-center">{label1}</h4>
          <ChartVisualization chart={chart1} />
        </motion.div>
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 0.5 }}
          className="bg-white/5 rounded-xl p-6 border border-white/10"
        >
          <h4 className="text-lg font-semibold text-white mb-4 text-center">{label2}</h4>
          <ChartVisualization chart={chart2} />
        </motion.div>
      </div>

      {showAspects && (
        <div className="bg-white/5 rounded-xl p-6 border border-white/10">
          <h4 className="text-lg font-semibold text-white mb-4">Inter-Chart Aspects</h4>
          <p className="text-white/70 text-sm">
            Synastry aspects between the two charts will be displayed here.
          </p>
        </div>
      )}
    </div>
  )
}














