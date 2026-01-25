'use client'

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

  return (
    <div className={`flex flex-col items-center justify-center ${className} overflow-visible`}>
      {/* Orbital in script font */}
      <span 
        className={`${sizeClasses[size]} font-['Great_Vibes',cursive] leading-none mb-1 bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-200 bg-clip-text text-transparent`}
        style={{
          fontFamily: "'Great Vibes', cursive",
          fontWeight: 400,
          letterSpacing: '0.02em',
          textShadow: '0 0 20px rgba(255, 255, 200, 0.5)',
          filter: 'brightness(1.2)',
          padding: '0.2em 0.5em',
          display: 'inline-block',
        }}
      >
        Orbital
      </span>
      
      {/* ASTRO in sans-serif - smaller than Orbital */}
      <span 
        className="font-heading font-bold tracking-wider leading-none bg-gradient-to-r from-yellow-200 via-yellow-100 to-yellow-200 bg-clip-text text-transparent"
        style={{
          fontSize: size === 'sm' ? '1.2rem' : size === 'md' ? '2rem' : size === 'lg' ? '2.8rem' : '4rem',
          letterSpacing: '0.15em',
          textShadow: '0 0 20px rgba(255, 255, 200, 0.5)',
          filter: 'brightness(1.2)',
        }}
      >
        ASTRO
      </span>
    </div>
  )
}
