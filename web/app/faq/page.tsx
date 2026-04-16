"use client"

import { motion } from 'framer-motion'
import { HelpCircle } from 'lucide-react'
import BackButton from '@/components/BackButton'
import Logo from '@/components/Logo'
import Starfield from '@/components/Starfield'
import { useTranslation } from '@/lib/useTranslation'

export default function FAQPage() {
  const t = useTranslation()

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-purple via-magenta-purple to-cosmic-purple relative">
      <Starfield />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 relative z-10">
        <BackButton href="/" />

        <div className="mt-6 flex justify-center">
          <Logo variant="horizontal" size="md" animated={false} />
        </div>

        <div className="text-center max-w-4xl mx-auto mt-10 mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-heading font-bold text-cosmic-gold mb-4 whitespace-nowrap">
              {t.faq.title}
            </h1>
            <p className="text-cosmic-gold/85 text-lg leading-relaxed">
              {t.faq.subtitle}
            </p>
          </motion.div>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="bg-white/10 p-8 sm:p-10 rounded-3xl border border-cosmic-gold/20 backdrop-blur-sm"
          >
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 flex items-center gap-3 text-cosmic-gold">
              <HelpCircle className="h-7 w-7 text-cosmic-gold" />
              {t.faq.q1.question}
            </h2>
            <p className="text-white/85 leading-relaxed text-base sm:text-lg">
              {t.faq.q1.answer}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="bg-white/10 p-8 sm:p-10 rounded-3xl border border-cosmic-gold/20 backdrop-blur-sm"
          >
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 flex items-center gap-3 text-cosmic-gold">
              <HelpCircle className="h-7 w-7 text-cosmic-gold" />
              {t.faq.q2.question}
            </h2>
            <p className="text-white/85 leading-relaxed text-base sm:text-lg">
              {t.faq.q2.answer}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="bg-white/10 p-8 sm:p-10 rounded-3xl border border-cosmic-gold/20 backdrop-blur-sm"
          >
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 flex items-center gap-3 text-cosmic-gold">
              <HelpCircle className="h-7 w-7 text-cosmic-gold" />
              {t.faq.q3.question}
            </h2>
            <p className="text-white/85 leading-relaxed text-base sm:text-lg">
              {t.faq.q3.answer}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="bg-white/10 p-8 sm:p-10 rounded-3xl border border-cosmic-gold/20 backdrop-blur-sm"
          >
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 flex items-center gap-3 text-cosmic-gold">
              <HelpCircle className="h-7 w-7 text-cosmic-gold" />
              {t.faq.q4.question}
            </h2>
            <p className="text-white/85 leading-relaxed text-base sm:text-lg">
              {t.faq.q4.answer}
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
