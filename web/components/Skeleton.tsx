'use client'

import { motion } from 'framer-motion'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'chart' | 'card'
  width?: string | number
  height?: string | number
  animate?: boolean
}

export default function Skeleton({
  className = '',
  variant = 'rectangular',
  width,
  height,
  animate = true,
}: SkeletonProps) {
  const baseClasses = 'bg-white/10 rounded'
  
  const variantClasses = {
    text: 'h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
    chart: 'rounded-full aspect-square',
    card: 'rounded-xl',
  }

  const style: React.CSSProperties = {}
  if (width) style.width = typeof width === 'number' ? `${width}px` : width
  if (height) style.height = typeof height === 'number' ? `${height}px` : height

  return (
    <motion.div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      animate={
        animate
          ? {
              opacity: [0.5, 0.8, 0.5],
            }
          : {}
      }
      transition={
        animate
          ? {
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }
          : {}
      }
    />
  )
}

// Pre-built skeleton components
export function ChartSkeleton() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="relative w-96 h-96">
        <Skeleton variant="circular" className="absolute inset-0" />
        <Skeleton variant="circular" className="absolute inset-8" />
        <Skeleton variant="circular" className="absolute inset-16" />
        <Skeleton variant="circular" className="absolute top-1/2 left-1/2 w-8 h-8 -translate-x-1/2 -translate-y-1/2" />
      </div>
    </div>
  )
}

export function InterpretationSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton variant="text" width="60%" height={24} />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="80%" />
      <div className="mt-6 space-y-2">
        <Skeleton variant="text" width="40%" height={20} />
        <Skeleton variant="text" width="100%" />
        <Skeleton variant="text" width="90%" />
      </div>
    </div>
  )
}

export function TransitSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton variant="circular" width={40} height={40} />
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="40%" />
            <Skeleton variant="text" width="60%" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div className="bg-white/5 rounded-xl p-6 border border-white/10">
      <Skeleton variant="text" width="50%" height={24} className="mb-4" />
      <Skeleton variant="text" width="100%" />
      <Skeleton variant="text" width="90%" />
      <Skeleton variant="text" width="80%" className="mt-2" />
    </div>
  )
}




