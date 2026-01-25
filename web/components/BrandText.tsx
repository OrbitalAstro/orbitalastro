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
    color: '#FFD700',
    textShadow: `
      0 0 10px rgba(255, 215, 0, 0.9),
      0 0 20px rgba(255, 105, 180, 0.7),
      0 0 30px rgba(218, 112, 214, 0.6),
      0 0 40px rgba(135, 206, 235, 0.5),
      0 0 50px rgba(255, 99, 71, 0.4),
      0 0 60px rgba(64, 224, 208, 0.3)
    `,
    filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.8)) drop-shadow(0 0 20px rgba(255, 105, 180, 0.6))',
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
            '0 0 10px rgba(255, 215, 0, 0.9), 0 0 20px rgba(255, 105, 180, 0.7), 0 0 30px rgba(218, 112, 214, 0.6), 0 0 40px rgba(135, 206, 235, 0.5)',
            '0 0 10px rgba(255, 105, 180, 0.9), 0 0 20px rgba(218, 112, 214, 0.7), 0 0 30px rgba(135, 206, 235, 0.6), 0 0 40px rgba(255, 99, 71, 0.5)',
            '0 0 10px rgba(218, 112, 214, 0.9), 0 0 20px rgba(135, 206, 235, 0.7), 0 0 30px rgba(255, 99, 71, 0.6), 0 0 40px rgba(64, 224, 208, 0.5)',
            '0 0 10px rgba(255, 215, 0, 0.9), 0 0 20px rgba(255, 105, 180, 0.7), 0 0 30px rgba(218, 112, 214, 0.6), 0 0 40px rgba(135, 206, 235, 0.5)',
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
            '0 0 10px rgba(255, 215, 0, 0.9), 0 0 20px rgba(255, 105, 180, 0.7), 0 0 30px rgba(218, 112, 214, 0.6), 0 0 40px rgba(135, 206, 235, 0.5)',
            '0 0 10px rgba(255, 105, 180, 0.9), 0 0 20px rgba(218, 112, 214, 0.7), 0 0 30px rgba(135, 206, 235, 0.6), 0 0 40px rgba(255, 99, 71, 0.5)',
            '0 0 10px rgba(218, 112, 214, 0.9), 0 0 20px rgba(135, 206, 235, 0.7), 0 0 30px rgba(255, 99, 71, 0.6), 0 0 40px rgba(64, 224, 208, 0.5)',
            '0 0 10px rgba(255, 215, 0, 0.9), 0 0 20px rgba(255, 105, 180, 0.7), 0 0 30px rgba(218, 112, 214, 0.6), 0 0 40px rgba(135, 206, 235, 0.5)',
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
