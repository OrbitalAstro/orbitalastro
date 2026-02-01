"use client"

import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import BackButton from '@/components/BackButton'
import Logo from '@/components/Logo'
import Starfield from '@/components/Starfield'
import { useTranslation } from '@/lib/useTranslation'

export default function PrivacyPage() {
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
              <Shield className="h-8 w-8" />
              {t.privacy.title}
            </h1>
            <p className="text-cosmic-gold/85 text-lg leading-relaxed">
              {t.privacy.lastUpdated}
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
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-cosmic-gold">{t.privacy.section1Title}</h2>
            <p className="text-white/85 leading-relaxed text-base sm:text-lg mb-4">{t.privacy.section1Content}</p>
            <ul className="list-disc list-inside space-y-2 text-white/85 text-base sm:text-lg">
              <li>{t.privacy.section1Item1}</li>
              <li>{t.privacy.section1Item2}</li>
              <li>{t.privacy.section1Item3}</li>
              <li>{t.privacy.section1Item4}</li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="bg-white/10 p-8 sm:p-10 rounded-3xl border border-cosmic-gold/20 backdrop-blur-sm"
          >
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-cosmic-gold">{t.privacy.section2Title}</h2>
            <p className="text-white/85 leading-relaxed text-base sm:text-lg mb-4">{t.privacy.section2Content}</p>
            <ul className="list-disc list-inside space-y-2 text-white/85 text-base sm:text-lg">
              <li>{t.privacy.section2Item1}</li>
              <li>{t.privacy.section2Item2}</li>
              <li>{t.privacy.section2Item3}</li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="bg-white/10 p-8 sm:p-10 rounded-3xl border border-cosmic-gold/20 backdrop-blur-sm"
          >
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-cosmic-gold">{t.privacy.section3Title}</h2>
            <p className="text-white/85 leading-relaxed text-base sm:text-lg">{t.privacy.section3Content}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="bg-white/10 p-8 sm:p-10 rounded-3xl border border-cosmic-gold/20 backdrop-blur-sm"
          >
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-cosmic-gold">{t.privacy.section4Title}</h2>
            <p className="text-white/85 leading-relaxed text-base sm:text-lg mb-4">{t.privacy.section4Content}</p>
            <p className="text-white/85 leading-relaxed text-base sm:text-lg">{t.privacy.section4Content2}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="bg-white/10 p-8 sm:p-10 rounded-3xl border border-cosmic-gold/20 backdrop-blur-sm"
          >
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-cosmic-gold">{t.privacy.section5Title}</h2>
            <p className="text-white/85 leading-relaxed text-base sm:text-lg">{t.privacy.section5Content}</p>
          </motion.div>
        </section>
      </div>
    </div>
  )
}
