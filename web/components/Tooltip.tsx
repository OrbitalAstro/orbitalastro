'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HelpCircle } from 'lucide-react'

interface TooltipProps {
  content: string
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export default function Tooltip({ content, children, side = 'top', delay = 200 }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const triggerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (isVisible && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect()
      const tooltipOffset = 8

      switch (side) {
        case 'top':
          setPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - tooltipOffset,
          })
          break
        case 'bottom':
          setPosition({
            x: rect.left + rect.width / 2,
            y: rect.bottom + tooltipOffset,
          })
          break
        case 'left':
          setPosition({
            x: rect.left - tooltipOffset,
            y: rect.top + rect.height / 2,
          })
          break
        case 'right':
          setPosition({
            x: rect.right + tooltipOffset,
            y: rect.top + rect.height / 2,
          })
          break
      }
    }
  }, [isVisible, side])

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => setIsVisible(true), delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsVisible(false)
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            style={{
              position: 'fixed',
              left: `${position.x}px`,
              top: `${position.y}px`,
              transform: `translate(-50%, ${side === 'top' ? '-100%' : side === 'bottom' ? '0%' : side === 'left' ? '-50%' : '-50%'})`,
              zIndex: 1000,
              pointerEvents: 'none',
            }}
            className="bg-black/90 backdrop-blur-sm text-white text-sm rounded-lg px-3 py-2 max-w-xs border border-white/20 shadow-lg"
            role="tooltip"
          >
            {content}
            <div
              className={`absolute w-2 h-2 bg-black/90 border border-white/20 ${
                side === 'top' ? 'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 rotate-45 border-t-0 border-l-0' :
                side === 'bottom' ? 'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-b-0 border-r-0' :
                side === 'left' ? 'right-0 top-1/2 -translate-y-1/2 translate-x-1/2 rotate-45 border-l-0 border-b-0' :
                'left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 rotate-45 border-r-0 border-t-0'
              }`}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export function HelpTooltip({ term, definition }: { term: string; definition: string }) {
  return (
    <Tooltip content={definition}>
      <span className="inline-flex items-center gap-1 text-cosmic-gold cursor-help">
        {term}
        <HelpCircle className="h-3 w-3" />
      </span>
    </Tooltip>
  )
}

// Astrological term definitions
export const ASTRO_TERMS: Record<string, string> = {
  'Ascendant': 'The rising sign at the moment of birth, representing how you present yourself to the world.',
  'Midheaven': 'The highest point in the chart, representing career, public image, and life direction.',
  'House': 'One of 12 divisions of the chart, each representing different life areas.',
  'Aspect': 'An angular relationship between two planets, indicating how their energies interact.',
  'Transit': 'A current planetary position forming an aspect to a natal planet.',
  'Progression': 'A predictive technique where one day after birth equals one year of life.',
  'Solar Return': 'The moment when the Sun returns to its exact natal position, marking a new year cycle.',
  'Synastry': 'Comparison of two charts to understand relationship dynamics.',
  'T-square': 'An aspect pattern involving two planets in opposition, both square to a third planet.',
  'Grand Trine': 'Three planets forming trines to each other, creating a triangle of harmonious energy.',
}











