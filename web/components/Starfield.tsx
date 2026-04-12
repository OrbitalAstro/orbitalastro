'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export default function Starfield() {
  const [stars, setStars] = useState<Array<{
    id: number
    x: number
    y: number
    size: number
    duration: number
    delay: number
    xOffset: number
    yOffset: number
    rotation: number
  }>>([])

  // Generate stars only on client to avoid hydration mismatch
  useEffect(() => {
    setStars(
      Array.from({ length: 350 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 1.5 + 1,
        duration: Math.random() * 3 + 3,
        delay: Math.random() * 1,
        xOffset: (Math.random() - 0.5) * 5, // Movement range réduit
        yOffset: (Math.random() - 0.5) * 5,
        rotation: 0, // Pas de rotation
      }))
    )
  }, [])

  return (
    <div className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-hidden>
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${star.x}%`,
            top: `${star.y}%`,
            width: star.size,
            height: star.size,
          }}
          animate={{
            opacity: [0.4, 0.9, 0.4],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

