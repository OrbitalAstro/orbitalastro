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
      0 0 5px rgba(176, 224, 230, 1),
      0 0 10px rgba(175, 238, 238, 0.9),
      0 0 15px rgba(230, 230, 250, 0.8),
      0 0 20px rgba(221, 160, 221, 0.7),
      0 0 25px rgba(255, 127, 80, 0.6),
      0 0 30px rgba(176, 196, 222, 0.6),
      0 0 35px rgba(135, 206, 250, 0.5),
      0 0 40px rgba(255, 182, 193, 0.5),
      0 0 45px rgba(176, 224, 230, 0.4),
      0 0 50px rgba(230, 230, 250, 0.4),
      0 0 55px rgba(221, 160, 221, 0.3),
      0 0 60px rgba(255, 127, 80, 0.3),
      0 0 65px rgba(176, 196, 222, 0.3),
      0 0 70px rgba(135, 206, 250, 0.2),
      0 0 75px rgba(255, 182, 193, 0.2)
    `,
    filter: 'drop-shadow(0 0 8px rgba(176, 224, 230, 0.9)) drop-shadow(0 0 16px rgba(230, 230, 250, 0.7)) drop-shadow(0 0 24px rgba(221, 160, 221, 0.6)) drop-shadow(0 0 32px rgba(255, 127, 80, 0.5))',
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
            '0 0 5px rgba(176, 224, 230, 1), 0 0 10px rgba(175, 238, 238, 0.9), 0 0 15px rgba(230, 230, 250, 0.8), 0 0 20px rgba(221, 160, 221, 0.7), 0 0 25px rgba(255, 127, 80, 0.6), 0 0 30px rgba(176, 196, 222, 0.6), 0 0 35px rgba(135, 206, 250, 0.5), 0 0 40px rgba(255, 182, 193, 0.5)',
            '0 0 5px rgba(175, 238, 238, 1), 0 0 10px rgba(230, 230, 250, 0.9), 0 0 15px rgba(221, 160, 221, 0.8), 0 0 20px rgba(255, 127, 80, 0.7), 0 0 25px rgba(176, 196, 222, 0.6), 0 0 30px rgba(135, 206, 250, 0.6), 0 0 35px rgba(255, 182, 193, 0.5), 0 0 40px rgba(176, 224, 230, 0.5)',
            '0 0 5px rgba(230, 230, 250, 1), 0 0 10px rgba(221, 160, 221, 0.9), 0 0 15px rgba(255, 127, 80, 0.8), 0 0 20px rgba(176, 196, 222, 0.7), 0 0 25px rgba(135, 206, 250, 0.6), 0 0 30px rgba(255, 182, 193, 0.6), 0 0 35px rgba(176, 224, 230, 0.5), 0 0 40px rgba(175, 238, 238, 0.5)',
            '0 0 5px rgba(221, 160, 221, 1), 0 0 10px rgba(255, 127, 80, 0.9), 0 0 15px rgba(176, 196, 222, 0.8), 0 0 20px rgba(135, 206, 250, 0.7), 0 0 25px rgba(255, 182, 193, 0.6), 0 0 30px rgba(176, 224, 230, 0.6), 0 0 35px rgba(175, 238, 238, 0.5), 0 0 40px rgba(230, 230, 250, 0.5)',
            '0 0 5px rgba(255, 127, 80, 1), 0 0 10px rgba(176, 196, 222, 0.9), 0 0 15px rgba(135, 206, 250, 0.8), 0 0 20px rgba(255, 182, 193, 0.7), 0 0 25px rgba(176, 224, 230, 0.6), 0 0 30px rgba(175, 238, 238, 0.6), 0 0 35px rgba(230, 230, 250, 0.5), 0 0 40px rgba(221, 160, 221, 0.5)',
            '0 0 5px rgba(176, 224, 230, 1), 0 0 10px rgba(175, 238, 238, 0.9), 0 0 15px rgba(230, 230, 250, 0.8), 0 0 20px rgba(221, 160, 221, 0.7), 0 0 25px rgba(255, 127, 80, 0.6), 0 0 30px rgba(176, 196, 222, 0.6), 0 0 35px rgba(135, 206, 250, 0.5), 0 0 40px rgba(255, 182, 193, 0.5)',
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
            '0 0 5px rgba(176, 224, 230, 1), 0 0 10px rgba(175, 238, 238, 0.9), 0 0 15px rgba(230, 230, 250, 0.8), 0 0 20px rgba(221, 160, 221, 0.7), 0 0 25px rgba(255, 127, 80, 0.6), 0 0 30px rgba(176, 196, 222, 0.6), 0 0 35px rgba(135, 206, 250, 0.5), 0 0 40px rgba(255, 182, 193, 0.5)',
            '0 0 5px rgba(175, 238, 238, 1), 0 0 10px rgba(230, 230, 250, 0.9), 0 0 15px rgba(221, 160, 221, 0.8), 0 0 20px rgba(255, 127, 80, 0.7), 0 0 25px rgba(176, 196, 222, 0.6), 0 0 30px rgba(135, 206, 250, 0.6), 0 0 35px rgba(255, 182, 193, 0.5), 0 0 40px rgba(176, 224, 230, 0.5)',
            '0 0 5px rgba(230, 230, 250, 1), 0 0 10px rgba(221, 160, 221, 0.9), 0 0 15px rgba(255, 127, 80, 0.8), 0 0 20px rgba(176, 196, 222, 0.7), 0 0 25px rgba(135, 206, 250, 0.6), 0 0 30px rgba(255, 182, 193, 0.6), 0 0 35px rgba(176, 224, 230, 0.5), 0 0 40px rgba(175, 238, 238, 0.5)',
            '0 0 5px rgba(221, 160, 221, 1), 0 0 10px rgba(255, 127, 80, 0.9), 0 0 15px rgba(176, 196, 222, 0.8), 0 0 20px rgba(135, 206, 250, 0.7), 0 0 25px rgba(255, 182, 193, 0.6), 0 0 30px rgba(176, 224, 230, 0.6), 0 0 35px rgba(175, 238, 238, 0.5), 0 0 40px rgba(230, 230, 250, 0.5)',
            '0 0 5px rgba(255, 127, 80, 1), 0 0 10px rgba(176, 196, 222, 0.9), 0 0 15px rgba(135, 206, 250, 0.8), 0 0 20px rgba(255, 182, 193, 0.7), 0 0 25px rgba(176, 224, 230, 0.6), 0 0 30px rgba(175, 238, 238, 0.6), 0 0 35px rgba(230, 230, 250, 0.5), 0 0 40px rgba(221, 160, 221, 0.5)',
            '0 0 5px rgba(176, 224, 230, 1), 0 0 10px rgba(175, 238, 238, 0.9), 0 0 15px rgba(230, 230, 250, 0.8), 0 0 20px rgba(221, 160, 221, 0.7), 0 0 25px rgba(255, 127, 80, 0.6), 0 0 30px rgba(176, 196, 222, 0.6), 0 0 35px rgba(135, 206, 250, 0.5), 0 0 40px rgba(255, 182, 193, 0.5)',
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
