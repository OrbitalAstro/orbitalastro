'use client'

import { motion } from 'framer-motion'

interface LogoBackgroundProps {
  opacity?: number
  className?: string
}

export default function LogoBackground({ opacity = 0.15, className = '' }: LogoBackgroundProps) {
  return (
    <div className={`fixed inset-0 pointer-events-none z-0 ${className}`} style={{ opacity }}>
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.svg
          viewBox="0 0 400 400"
          className="w-full h-full max-w-4xl max-h-4xl"
          animate={{ rotate: 360 }}
          transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
        >
          <defs>
            <linearGradient id="logo-gold-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E4B5A0" />
              <stop offset="100%" stopColor="#F5D4C1" />
            </linearGradient>
          </defs>
          
          {/* Orbital system - multiple elliptical orbits */}
          {/* Outer orbit */}
          <ellipse
            cx="200"
            cy="150"
            rx="120"
            ry="80"
            fill="none"
            stroke="url(#logo-gold-gradient)"
            strokeWidth="1.5"
            opacity="0.6"
            transform="rotate(-20 200 150)"
          />
          
          {/* Middle orbit */}
          <ellipse
            cx="200"
            cy="150"
            rx="100"
            ry="70"
            fill="none"
            stroke="url(#logo-gold-gradient)"
            strokeWidth="1.5"
            opacity="0.7"
            transform="rotate(30 200 150)"
          />
          
          {/* Inner orbit */}
          <ellipse
            cx="200"
            cy="150"
            rx="80"
            ry="60"
            fill="none"
            stroke="url(#logo-gold-gradient)"
            strokeWidth="1.5"
            opacity="0.8"
            transform="rotate(-15 200 150)"
          />
          
          {/* Central circle */}
          <circle
            cx="200"
            cy="150"
            r="8"
            fill="url(#logo-gold-gradient)"
          />
          
          {/* Planets/Electrons - small circles along orbits */}
          {/* Planet 1 */}
          <circle cx="280" cy="150" r="4" fill="url(#logo-gold-gradient)" />
          
          {/* Planet 2 */}
          <circle cx="200" cy="70" r="4" fill="url(#logo-gold-gradient)" />
          
          {/* Planet 3 */}
          <circle cx="120" cy="150" r="4" fill="url(#logo-gold-gradient)" />
          
          {/* Planet 4 */}
          <circle cx="200" cy="230" r="4" fill="url(#logo-gold-gradient)" />
        </motion.svg>
      </div>
    </div>
  )
}

