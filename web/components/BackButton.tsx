'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { motion } from 'framer-motion'
import { useTranslation } from '@/lib/useTranslation'

interface BackButtonProps {
  href?: string
  label?: string
  className?: string
}

export default function BackButton({ href, label, className = '' }: BackButtonProps) {
  const router = useRouter()
  const t = useTranslation()
  const resolvedLabel = label ?? t.common.back

  const handleClick = () => {
    if (href) {
      router.push(href)
    } else {
      router.back()
    }
  }

  return (
    <motion.button
      onClick={handleClick}
      className={`flex items-center gap-2 text-white/70 hover:text-white transition mb-6 ${className}`}
      whileHover={{ x: -4 }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <ArrowLeft className="h-5 w-5" />
      <span>{resolvedLabel}</span>
    </motion.button>
  )
}











