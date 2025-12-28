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
    <div className={`flex flex-col items-center justify-center ${className}`}>
      {/* Orbital in script font */}
      <span 
        className={`${sizeClasses[size]} text-cosmic-gold font-['Great_Vibes',cursive] leading-none mb-1`}
        style={{
          fontFamily: "'Great Vibes', cursive",
          fontWeight: 400,
          letterSpacing: '0.02em',
        }}
      >
        Orbital
      </span>
      
      {/* ASTRO in sans-serif - smaller than Orbital */}
      <span 
        className="text-cosmic-gold font-heading font-bold tracking-wider leading-none"
        style={{
          fontSize: size === 'sm' ? '1.2rem' : size === 'md' ? '2rem' : size === 'lg' ? '2.8rem' : '4rem',
          letterSpacing: '0.15em',
        }}
      >
        ASTRO
      </span>
    </div>
  )
}
