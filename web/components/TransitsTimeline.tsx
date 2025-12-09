'use client'

import { useState } from 'react'
import { Calendar, TrendingUp } from 'lucide-react'
import { apiClient } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'
import { format, addDays } from 'date-fns'

interface TransitsTimelineProps {
  natalChart: any
}

export default function TransitsTimeline({ natalChart }: TransitsTimelineProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])

  const { data: transits } = useQuery({
    queryKey: ['transits', natalChart, selectedDate],
    queryFn: async () => {
      if (!natalChart?.planets) return null
      const natalPositions = Object.fromEntries(
        Object.entries(natalChart.planets).map(([k, v]: [string, any]) => [k, v.longitude])
      )
      const response = await apiClient.transits.calculate({
        natal_positions: natalPositions,
        natal_asc: natalChart.ascendant,
        natal_mc: natalChart.midheaven,
        target_date: selectedDate + 'T12:00:00Z',
        include_angles: true,
      })
      return response.data
    },
    enabled: !!natalChart && !!selectedDate,
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-4">
        <Calendar className="h-5 w-5 text-white/60" />
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
      </div>

      {transits && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white mb-3">Active Transits</h3>
          {transits.transits && transits.transits.length > 0 ? (
            <div className="space-y-2">
              {transits.transits.slice(0, 10).map((transit: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-white/5 rounded-lg p-3 flex justify-between items-center"
                >
                  <div>
                    <span className="font-medium text-white capitalize">
                      {transit.transiting_body}
                    </span>
                    <span className="text-white/60 mx-2">{transit.aspect}</span>
                    <span className="font-medium text-white capitalize">
                      {transit.natal_body}
                    </span>
                  </div>
                  <div className="text-sm text-white/60">
                    {transit.orb_deg.toFixed(2)}° {transit.applying && '(applying)'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-white/60 text-center py-8">
              No significant transits on this date
            </div>
          )}

          {transits.transits_to_angles && transits.transits_to_angles.length > 0 && (
            <div className="mt-6 pt-6 border-t border-white/20">
              <h4 className="font-semibold text-white mb-3">Transits to Angles</h4>
              <div className="space-y-2">
                {transits.transits_to_angles.map((transit: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-purple-500/20 rounded-lg p-3 flex justify-between items-center"
                  >
                    <div>
                      <span className="font-medium text-white capitalize">
                        {transit.transiting_body}
                      </span>
                      <span className="text-white/60 mx-2">{transit.aspect}</span>
                      <span className="font-medium text-white">{transit.angle}</span>
                    </div>
                    <div className="text-sm text-white/60">
                      {transit.orb_deg.toFixed(2)}°
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}






