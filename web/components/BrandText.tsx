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

  const getOpalescentStyle = () => ({
    color: '#B0E0E6', // Silver blue comme couleur de base
    textShadow: `
      0 0 8px rgba(176, 224, 230, 0.7),
      0 0 16px rgba(230, 230, 250, 0.5),
      0 0 24px rgba(221, 160, 221, 0.4),
      0 0 32px rgba(255, 127, 80, 0.3)
    `,
    filter: 'drop-shadow(0 0 6px rgba(176, 224, 230, 0.6)) drop-shadow(0 0 12px rgba(230, 230, 250, 0.4))',
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
          textShadow: [
            '0 0 8px rgba(176, 224, 230, 0.7), 0 0 16px rgba(230, 230, 250, 0.5), 0 0 24px rgba(221, 160, 221, 0.4), 0 0 32px rgba(255, 127, 80, 0.3)',
            '0 0 8px rgba(230, 230, 250, 0.7), 0 0 16px rgba(221, 160, 221, 0.5), 0 0 24px rgba(255, 127, 80, 0.4), 0 0 32px rgba(176, 196, 222, 0.3)',
            '0 0 8px rgba(221, 160, 221, 0.7), 0 0 16px rgba(255, 127, 80, 0.5), 0 0 24px rgba(176, 196, 222, 0.4), 0 0 32px rgba(176, 224, 230, 0.3)',
            '0 0 8px rgba(255, 127, 80, 0.7), 0 0 16px rgba(176, 196, 222, 0.5), 0 0 24px rgba(176, 224, 230, 0.4), 0 0 32px rgba(230, 230, 250, 0.3)',
            '0 0 8px rgba(176, 224, 230, 0.7), 0 0 16px rgba(230, 230, 250, 0.5), 0 0 24px rgba(221, 160, 221, 0.4), 0 0 32px rgba(255, 127, 80, 0.3)',
          ],
        }}
        transition={{
          duration: 8,
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
          ...getOpalescentStyle(),
        }}
        animate={{
          textShadow: [
            '0 0 8px rgba(176, 224, 230, 0.7), 0 0 16px rgba(230, 230, 250, 0.5), 0 0 24px rgba(221, 160, 221, 0.4), 0 0 32px rgba(255, 127, 80, 0.3)',
            '0 0 8px rgba(230, 230, 250, 0.7), 0 0 16px rgba(221, 160, 221, 0.5), 0 0 24px rgba(255, 127, 80, 0.4), 0 0 32px rgba(176, 196, 222, 0.3)',
            '0 0 8px rgba(221, 160, 221, 0.7), 0 0 16px rgba(255, 127, 80, 0.5), 0 0 24px rgba(176, 196, 222, 0.4), 0 0 32px rgba(176, 224, 230, 0.3)',
            '0 0 8px rgba(255, 127, 80, 0.7), 0 0 16px rgba(176, 196, 222, 0.5), 0 0 24px rgba(176, 224, 230, 0.4), 0 0 32px rgba(230, 230, 250, 0.3)',
            '0 0 8px rgba(176, 224, 230, 0.7), 0 0 16px rgba(230, 230, 250, 0.5), 0 0 24px rgba(221, 160, 221, 0.4), 0 0 32px rgba(255, 127, 80, 0.3)',
          ],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        ASTRO
      </motion.span>
    </div>
  )
}
