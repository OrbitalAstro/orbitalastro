'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'

interface AspectGridProps {
  planets: Record<string, { longitude: number }>
  aspects?: Array<{
    body1: string
    body2: string
    aspect: string
    orb_deg: number
  }>
}

const PLANET_ORDER = [
  'sun', 'moon', 'mercury', 'venus', 'mars',
  'jupiter', 'saturn', 'uranus', 'neptune', 'pluto',
  'true_node', 'chiron'
]

const ASPECT_COLORS: Record<string, string> = {
  conjunction: '#FF0000',
  opposition: '#0000FF',
  square: '#FF0000',
  trine: '#00FF00',
  sextile: '#FFFF00',
}

export default function AspectGrid({ planets, aspects = [] }: AspectGridProps) {
  const aspectMap = useMemo(() => {
    const map: Record<string, Record<string, any>> = {}
    for (const aspect of aspects) {
      if (!map[aspect.body1]) map[aspect.body1] = {}
      map[aspect.body1][aspect.body2] = aspect
      if (!map[aspect.body2]) map[aspect.body2] = {}
      map[aspect.body2][aspect.body1] = aspect
    }
    return map
  }, [aspects])

  const planetList = PLANET_ORDER.filter(p => p in planets)

  return (
    <div className="overflow-x-auto">
      <div className="inline-block min-w-full">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-2 text-left text-white/70 font-semibold border-b border-white/10">
                Planet
              </th>
              {planetList.map((planet) => (
                <th
                  key={planet}
                  className="p-2 text-center text-white/70 font-semibold border-b border-white/10 min-w-[80px]"
                >
                  {planet.charAt(0).toUpperCase() + planet.slice(1).replace('_', ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {planetList.map((planet1, i) => (
              <tr key={planet1}>
                <td className="p-2 text-white font-medium border-r border-white/10">
                  {planet1.charAt(0).toUpperCase() + planet1.slice(1).replace('_', ' ')}
                </td>
                {planetList.map((planet2, j) => {
                  if (i === j) {
                    return (
                      <td
                        key={planet2}
                        className="p-2 text-center border border-white/10 bg-white/5"
                      >
                        <div className="w-8 h-8 mx-auto rounded-full bg-cosmic-gold/20 border border-cosmic-gold/50" />
                      </td>
                    )
                  }
                  
                  const aspect = aspectMap[planet1]?.[planet2]
                  if (!aspect) {
                    return (
                      <td
                        key={planet2}
                        className="p-2 text-center border border-white/10"
                      >
                        —
                      </td>
                    )
                  }

                  return (
                    <td
                      key={planet2}
                      className="p-2 text-center border border-white/10"
                      title={`${aspect.aspect} (${aspect.orb_deg.toFixed(2)}°)`}
                    >
                      <motion.div
                        className="w-8 h-8 mx-auto rounded flex items-center justify-center text-xs font-semibold"
                        style={{
                          backgroundColor: `${ASPECT_COLORS[aspect.aspect] || '#999'}40`,
                          border: `2px solid ${ASPECT_COLORS[aspect.aspect] || '#999'}`,
                          color: ASPECT_COLORS[aspect.aspect] || '#fff',
                        }}
                        whileHover={{ scale: 1.1 }}
                      >
                        {aspect.aspect.charAt(0).toUpperCase()}
                      </motion.div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}




