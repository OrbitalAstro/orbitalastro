"use client"

import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'
import BackButton from '@/components/BackButton'
import Logo from '@/components/Logo'
import Starfield from '@/components/Starfield'
import { useTranslation } from '@/lib/useTranslation'

export default function TermsPage() {
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
            <h1 className="text-4xl sm:text-5xl font-heading font-bold text-cosmic-gold mb-4 flex items-center justify-center gap-3">
              <FileText className="h-8 w-8" />
              {t.terms.title}
            </h1>
            <p className="text-cosmic-gold/85 text-lg leading-relaxed">
              {t.terms.lastUpdated}
            </p>
          </motion.div>
        </div>

        <section className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="bg-white/10 p-8 sm:p-10 rounded-3xl border border-cosmic-gold/20 backdrop-blur-sm"
          >
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-cosmic-gold">{t.terms.section1Title}</h2>
            <p className="text-white/85 leading-relaxed text-base sm:text-lg mb-4">{t.terms.section1Content}</p>
            <p className="text-white/85 leading-relaxed text-base sm:text-lg">{t.terms.section1Content2}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="bg-white/10 p-8 sm:p-10 rounded-3xl border border-cosmic-gold/20 backdrop-blur-sm"
          >
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-cosmic-gold">{t.terms.section2Title}</h2>
            <div className="space-y-4 text-white/85 text-base sm:text-lg leading-relaxed">
              <p><strong className="text-cosmic-gold">{t.terms.section2Item1Title}</strong> {t.terms.section2Item1Content}</p>
              <p><strong className="text-cosmic-gold">{t.terms.section2Item2Title}</strong> {t.terms.section2Item2Content}</p>
              <p><strong className="text-cosmic-gold">{t.terms.section2Item3Title}</strong> {t.terms.section2Item3Content}</p>
              <p><strong className="text-cosmic-gold">{t.terms.section2Item4Title}</strong> {t.terms.section2Item4Content}</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="bg-white/10 p-8 sm:p-10 rounded-3xl border border-cosmic-gold/20 backdrop-blur-sm"
          >
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-cosmic-gold">{t.terms.section3Title}</h2>
            <p className="text-white/85 leading-relaxed text-base sm:text-lg mb-4">{t.terms.section3Content}</p>
            <p className="text-white/85 leading-relaxed text-base sm:text-lg">{t.terms.section3Content2}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="bg-white/10 p-8 sm:p-10 rounded-3xl border border-cosmic-gold/20 backdrop-blur-sm"
          >
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-cosmic-gold">{t.terms.section4Title}</h2>
            <p className="text-white/85 leading-relaxed text-base sm:text-lg mb-4">{t.terms.section4Content}</p>
            <p className="text-white/85 leading-relaxed text-base sm:text-lg">{t.terms.section4Content2}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="bg-white/10 p-8 sm:p-10 rounded-3xl border border-cosmic-gold/20 backdrop-blur-sm"
          >
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-cosmic-gold">{t.terms.section5Title}</h2>
            <p className="text-white/85 leading-relaxed text-base sm:text-lg">{t.terms.section5Content}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.5 }}
            className="bg-white/10 p-8 sm:p-10 rounded-3xl border border-cosmic-gold/20 backdrop-blur-sm"
          >
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-cosmic-gold">{t.terms.section6Title}</h2>
            <p className="text-white/85 leading-relaxed text-base sm:text-lg">{t.terms.section6Content}</p>
          </motion.div>
        </section>
      </div>
    </div>
  )
}
