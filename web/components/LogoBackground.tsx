'use client'

import { OrbitalOrbitsGraphic } from '@/components/OrbitalOrbitsGraphic'

interface LogoBackgroundProps {
  opacity?: number
  className?: string
}

export default function LogoBackground({ opacity = 0.15, className = '' }: LogoBackgroundProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden ${className}`}
      style={{ opacity }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <OrbitalOrbitsGraphic
          idPrefix="orbital-home-bg"
          className="h-[min(100%,90vh)] w-[min(100%,90vh)] max-h-[90vh] max-w-full shrink-0"
        />
      </div>
    </div>
  )
}
