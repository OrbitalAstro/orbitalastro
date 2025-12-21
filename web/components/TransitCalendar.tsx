'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns'
import { apiClient } from '@/lib/api'
import { useQuery } from '@tanstack/react-query'

interface TransitCalendarProps {
  natalChart: any
  selectedDate?: Date
  onDateSelect?: (date: Date) => void
}

export default function TransitCalendar({ natalChart, selectedDate, onDateSelect }: TransitCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [hoveredDate, setHoveredDate] = useState<Date | null>(null)

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  // Get transits for hovered/selected date
  const targetDate = hoveredDate || selectedDate || new Date()
  const { data: transits } = useQuery({
    queryKey: ['transits-calendar', natalChart, targetDate],
    queryFn: async () => {
      if (!natalChart?.planets) return null
      const natalPositions = Object.fromEntries(
        Object.entries(natalChart.planets).map(([k, v]: [string, any]) => [k, v.longitude])
      )
      const response = await apiClient.transits.calculate({
        natal_positions: natalPositions,
        natal_asc: natalChart.ascendant,
        natal_mc: natalChart.midheaven,
        target_date: format(targetDate, 'yyyy-MM-dd') + 'T12:00:00Z',
        include_angles: true,
      })
      return response.data
    },
    enabled: !!natalChart && !!targetDate,
  })

  const hasTransits = (_date: Date) => {
    // Simplified: check if date has significant transits
    // In a real implementation, you'd pre-calculate all transits for the month
    return Math.random() > 0.7 // Placeholder
  }

  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
          <Calendar className="h-6 w-6 text-cosmic-gold" />
          Transit Calendar
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            className="p-2 hover:bg-white/10 rounded-lg transition"
            aria-label="Previous month"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <span className="text-white font-semibold min-w-[150px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            className="p-2 hover:bg-white/10 rounded-lg transition"
            aria-label="Next month"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="text-center text-white/60 text-sm font-semibold p-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const isCurrentMonth = isSameMonth(day, currentMonth)
          const isSelected = selectedDate && format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
          const isHovered = hoveredDate && format(day, 'yyyy-MM-dd') === format(hoveredDate, 'yyyy-MM-dd')
          const hasActiveTransits = hasTransits(day)

          return (
            <motion.button
              key={day.toISOString()}
              onClick={() => onDateSelect?.(day)}
              onMouseEnter={() => setHoveredDate(day)}
              onMouseLeave={() => setHoveredDate(null)}
              className={`
                aspect-square p-2 rounded-lg transition
                ${isCurrentMonth ? 'text-white' : 'text-white/30'}
                ${isSelected ? 'bg-cosmic-pink text-white' : ''}
                ${isHovered && !isSelected ? 'bg-white/10' : ''}
                ${hasActiveTransits ? 'border-2 border-cosmic-gold' : 'border border-white/10'}
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="flex flex-col items-center">
                <span className={`text-sm font-semibold ${isToday(day) ? 'text-cosmic-gold' : ''}`}>
                  {format(day, 'd')}
                </span>
                {hasActiveTransits && (
                  <div className="w-1.5 h-1.5 rounded-full bg-cosmic-gold mt-1" />
                )}
              </div>
            </motion.button>
          )
        })}
      </div>

      {transits && transits.transits && transits.transits.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-6 pt-6 border-t border-white/10"
        >
          <h4 className="text-white font-semibold mb-3">
            Transits for {format(targetDate, 'MMMM d, yyyy')}
          </h4>
          <div className="space-y-2">
            {transits.transits.slice(0, 5).map((transit: any, idx: number) => (
              <div
                key={idx}
                className="bg-white/5 rounded-lg p-2 text-sm text-white/80"
              >
                {transit.transiting_body} {transit.aspect} {transit.natal_body} ({transit.orb_deg.toFixed(2)}°)
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}











