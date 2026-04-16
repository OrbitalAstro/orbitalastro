'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'

interface LogoProps {
  variant?: 'symbol' | 'wordmark' | 'horizontal' | 'compact'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  animated?: boolean
  asLink?: boolean // If false, don't wrap in Link (useful when already inside a Link)
}

export default function Logo({ 
  variant = 'horizontal', 
  size = 'md',
  className = '',
  animated = true,
  asLink = true
}: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-10 w-10',
    lg: 'h-16 w-16',
  }

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }

  const SymbolLogo = () => (
    <motion.svg
      viewBox="0 0 100 100"
      className={`${sizeClasses[size]} ${className}`}
      animate={animated ? { rotate: 360 } : {}}
      transition={animated ? { duration: 20, repeat: Infinity, ease: "linear" } : {}}
    >
      {/* Outer circle (ecliptic) */}
      <circle
        cx="50"
        cy="50"
        r="45"
        fill="none"
        stroke="url(#cosmic-gradient)"
        strokeWidth="2"
        opacity="0.6"
      />
      
      {/* ASC arc */}
      <path
        d="M 50 5 Q 70 25 85 50"
        fill="none"
        stroke="url(#cosmic-gradient)"
        strokeWidth="1.5"
        opacity="0.8"
      />
      
      {/* MC arc */}
      <path
        d="M 85 50 Q 70 75 50 95"
        fill="none"
        stroke="url(#cosmic-gradient)"
        strokeWidth="1.5"
        opacity="0.8"
      />
      
      {/* IC arc */}
      <path
        d="M 50 95 Q 30 75 15 50"
        fill="none"
        stroke="url(#cosmic-gradient)"
        strokeWidth="1.5"
        opacity="0.8"
      />
      
      {/* Central dot (Sun/self) */}
      <circle
        cx="50"
        cy="50"
        r="4"
        fill="url(#cosmic-gradient)"
        className="glow-gold"
      />
      
      {/* Diagonal slash (orbits intersecting narratives) */}
      <line
        x1="20"
        y1="20"
        x2="80"
        y2="80"
        stroke="url(#cosmic-gradient)"
        strokeWidth="1"
        opacity="0.4"
      />
      
      {/* Gradient definitions - Mauve prune foncé */}
      <defs>
        <linearGradient id="cosmic-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6B4C7A" />
          <stop offset="50%" stopColor="#5A3C6A" />
          <stop offset="100%" stopColor="#4A2C5A" />
        </linearGradient>
      </defs>
    </motion.svg>
  )

  const Wordmark = () => (
    <span className={`font-heading font-bold ${textSizes[size]} bg-gradient-to-r from-cosmic-gold via-cosmic-pink to-cosmic-purple bg-clip-text text-transparent ${className}`}>
      OrbitalAstro
    </span>
  )

  if (variant === 'symbol') {
    return <SymbolLogo />
  }

  if (variant === 'wordmark') {
    return <Wordmark />
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <SymbolLogo />
        <Wordmark />
      </div>
    )
  }

  // Horizontal (default)
  const content = (
    <>
      <SymbolLogo />
      <Wordmark />
    </>
  )
  
  if (asLink && variant === 'horizontal') {
    return (
      <Link href="/" className={`flex items-center space-x-3 ${className}`}>
        {content}
      </Link>
    )
  }
  
  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {content}
    </div>
  )
}







