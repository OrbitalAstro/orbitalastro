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
    lg: 'text-7xl',
    xl: 'text-9xl',
  }

  const opalescentStyle = {
    background: 'linear-gradient(135deg, #FFE5B4 0%, #FFB6C1 12%, #DDA0DD 25%, #B0E0E6 37%, #F0E68C 50%, #FFA07A 62%, #98D8C8 75%, #FFDAB9 87%, #FFE5B4 100%)',
    backgroundSize: '300% 300%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(0 0 12px rgba(255, 182, 193, 0.5)) drop-shadow(0 0 24px rgba(221, 160, 221, 0.4)) drop-shadow(0 0 36px rgba(176, 224, 230, 0.3))',
    textShadow: '0 0 20px rgba(255, 182, 193, 0.3)',
  }

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
          ...opalescentStyle,
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
        className="font-heading font-bold tracking-wider leading-none"
        style={{
          fontSize: size === 'sm' ? '1.2rem' : size === 'md' ? '2rem' : size === 'lg' ? '2.8rem' : '4rem',
          letterSpacing: '0.15em',
          ...opalescentStyle,
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
