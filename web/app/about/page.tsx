"use client"

import { motion } from 'framer-motion'
import { Sparkles, Star, Eye, Orbit, HeartHandshake } from 'lucide-react'
import Link from 'next/link'
import BackButton from '@/components/BackButton'
import { useTranslation } from '@/lib/useTranslation'

export default function AboutPage() {
  const t = useTranslation()
  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-20 px-4">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <BackButton href="/" />
      </div>
      {/* Header */}
      <div className="text-center max-w-4xl mx-auto mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <Sparkles className="h-12 w-12 text-cosmic-gold mx-auto mb-6" />
          <h1 className="text-6xl font-heading font-bold mb-4">
            {t.about.title} <span className="text-gold-gradient">OrbitalAstro</span>
          </h1>

          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            {t.about.subtitle}
          </p>
        </motion.div>
      </div>

      {/* Origin Story */}
      <section className="max-w-5xl mx-auto mb-32">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="bg-white/5 p-10 rounded-3xl border border-white/10 backdrop-blur-sm"
        >
          <h2 className="text-4xl font-semibold mb-6 flex items-center gap-3">
            <Star className="text-cosmic-gold h-8 w-8" />
            {t.about.origin}
          </h2>
          <p className="text-white/70 leading-relaxed text-lg">
            {t.about.originText1}
            <span className="text-white"> {t.about.originQuestion}</span>
            <br/><br/>
            {t.about.originText2}
            <br/><br/>
            {t.about.originText3}
            <br/>
            {t.about.originText4}
          </p>
        </motion.div>
      </section>

      {/* Mission */}
      <section className="max-w-5xl mx-auto mb-32">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 p-10 rounded-3xl border border-white/10 backdrop-blur-sm"
        >
          <h2 className="text-4xl font-semibold mb-6 flex items-center gap-3">
            <Eye className="text-cosmic-gold h-8 w-8" />
            {t.about.mission}
          </h2>
          <p className="text-white/70 leading-relaxed text-lg">
            {t.about.missionText1}
            <br/>
            {t.about.missionText2}
            <br/>
            {t.about.missionText3}
            <span className="text-white font-semibold"> {t.about.missionText4}</span>
            <br/><br/>
            {t.about.missionText5}
            <br/>
            <span className="text-white"> {t.about.missionText6}</span>
          </p>
        </motion.div>
      </section>

      {/* Technology */}
      <section className="max-w-5xl mx-auto mb-32">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="bg-white/5 p-10 rounded-3xl border border-white/10 backdrop-blur-sm"
        >
          <h2 className="text-4xl font-semibold mb-6 flex items-center gap-3">
            <Orbit className="text-cosmic-gold h-8 w-8" />
            {t.about.technology}
          </h2>
          <ul className="text-white/70 space-y-4 text-lg">
            <li>• {t.about.tech1}</li>
            <li>• {t.about.tech2}</li>
            <li>• {t.about.tech3}</li>
            <li>• {t.about.tech4}</li>
            <li>• {t.about.tech5}</li>
            <li>• {t.about.tech6}</li>
            <li>• {t.about.tech7}</li>
          </ul>
        </motion.div>
      </section>

      {/* Philosophy */}
      <section className="max-w-5xl mx-auto mb-32">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="bg-gradient-to-br from-yellow-500/10 to-purple-500/20 p-10 rounded-3xl border border-white/10 backdrop-blur-sm"
        >
          <h2 className="text-4xl font-semibold mb-6 flex items-center gap-3">
            <HeartHandshake className="text-cosmic-gold h-8 w-8" />
            {t.about.philosophy}
          </h2>
          <p className="text-white/70 leading-relaxed text-lg">
            {t.about.philosophyText1}
            <br/>
            {t.about.philosophyText2}
            <br/><br/>
            {t.about.philosophyText3}
            <br/>• <strong className="text-white">{t.about.philosophyClarity}</strong>, {t.about.philosophyClarityDesc}
            <br/>• <strong className="text-white">{t.about.philosophyMeaning}</strong>, {t.about.philosophyMeaningDesc}
            <br/>• <strong className="text-white">{t.about.philosophyAgency}</strong>, {t.about.philosophyAgencyDesc}
          </p>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="text-center mt-10">
        <Link href="/dashboard">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-12 py-5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold text-xl shadow-2xl hover:shadow-purple-500/50 transition"
          >
            {t.about.cta}
          </motion.button>
        </Link>
      </section>
    </div>
  )
}

