'use client'

import { motion } from 'framer-motion'

interface BrandTextProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export default function BrandText({ size = 'lg', className = '' }: BrandTextProps) {
  const sizeClasses = {
    sm: 'text-3xl',
    md: 'text-5xl',
    /** Landing : moins massif sur mobile pour laisser place au hero (sous-titre + CTAs). */
    lg: 'text-5xl sm:text-6xl md:text-7xl',
    xl: 'text-9xl',
  }

  const astroSizeClasses = {
    sm: 'text-xl',
    md: 'text-[2rem]',
    lg: 'text-[1.2rem] sm:text-[1.45rem] md:text-[1.85rem] lg:text-[2.35rem]',
    xl: 'text-[4rem]',
  }

  const getOpalescentStyle = () => ({
    background: 'linear-gradient(135deg, #FF7F50 0%, #DDA0DD 25%, #AFEEEE 50%, #B0E0E6 75%, #FF7F50 100%)',
    backgroundSize: '200% 200%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    textShadow: `
      0 0 8px rgba(255, 127, 80, 0.4),
      0 0 16px rgba(221, 160, 221, 0.3),
      0 0 24px rgba(175, 238, 238, 0.3),
      0 0 32px rgba(176, 224, 230, 0.2)
    `,
    filter: 'drop-shadow(0 0 6px rgba(255, 127, 80, 0.4)) drop-shadow(0 0 12px rgba(221, 160, 221, 0.3))',
    opacity: 1,
    display: 'inline-block',
  })

  return (
    <div className={`flex flex-col items-center justify-center ${className} overflow-visible`}>
      {/* Orbital in script font */}
      <motion.span 
        className={`${sizeClasses[size]} font-['Great_Vibes',cursive] leading-none mb-1`}
        style={{
          fontFamily: "'Great Vibes', cursive",
          fontWeight: 400,
          letterSpacing: '0.02em',
          padding: '0.2em 0.5em',
          display: 'inline-block',
          ...getOpalescentStyle(),
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        Orbital
      </motion.span>
      
      {/* ASTRO in sans-serif - smaller than Orbital */}
      <motion.span 
        className={`font-heading font-bold tracking-wider leading-none ${astroSizeClasses[size]}`}
        style={{
          letterSpacing: '0.15em',
          ...getOpalescentStyle(),
        }}
        animate={{
          backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        ASTRO
      </motion.span>
    </div>
  )
}
