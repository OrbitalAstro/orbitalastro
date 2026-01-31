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
      Array.from({ length: 1000 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2.5 + 0.5,
        duration: Math.random() * 4 + 2,
        delay: Math.random() * 2,
        xOffset: (Math.random() - 0.5) * 20, // Movement range
        yOffset: (Math.random() - 0.5) * 20,
        rotation: Math.random() * 360,
      }))
    )
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-[1]">
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
            opacity: [0.3, 1, 0.7, 1, 0.3],
            scale: [1, 1.4, 0.9, 1.3, 1],
            x: [0, star.xOffset, -star.xOffset, star.xOffset * 0.5, 0],
            y: [0, star.yOffset, -star.yOffset, star.yOffset * 0.5, 0],
            rotate: [star.rotation, star.rotation + 180, star.rotation + 360],
            boxShadow: [
              '0 0 2px rgba(255,255,255,0.5)',
              '0 0 8px rgba(255,255,255,0.9), 0 0 12px rgba(255,255,255,0.6)',
              '0 0 4px rgba(255,255,255,0.7)',
              '0 0 10px rgba(255,255,255,0.8), 0 0 15px rgba(255,255,255,0.5)',
              '0 0 2px rgba(255,255,255,0.5)',
            ],
          }}
          transition={{
            duration: star.duration,
            delay: star.delay,
            repeat: Infinity,
            ease: "easeInOut",
            times: [0, 0.25, 0.5, 0.75, 1],
          }}
        />
      ))}
    </div>
  )
}

