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
    background: 'linear-gradient(135deg, #FFD700 0%, #FF69B4 12%, #DA70D6 25%, #87CEEB 37%, #FFD700 50%, #FF6347 62%, #40E0D0 75%, #FFD700 87%, #FFD700 100%)',
    backgroundSize: '300% 300%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 20px rgba(255, 105, 180, 0.6)) drop-shadow(0 0 30px rgba(218, 112, 214, 0.4))',
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
        className="font-heading font-bold tracking-wider leading-none"
        style={{
          fontSize: size === 'sm' ? '1.2rem' : size === 'md' ? '2rem' : size === 'lg' ? '2.8rem' : '4rem',
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
