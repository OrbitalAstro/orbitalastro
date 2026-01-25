// web/app/page.tsx — **CINEMATIC LANDING PAGE**

'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  ArrowRight, MessageSquare, Calendar
} from 'lucide-react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { useTranslation } from '@/lib/useTranslation'
import LogoBackground from '@/components/LogoBackground'
import BrandText from '@/components/BrandText'

// -------------------------------------------------------------
// MAIN LANDING PAGE
// -------------------------------------------------------------
export default function LandingPage() {
  const t = useTranslation()
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 300], [0, 200])
  const y2 = useTransform(scrollY, [0, 300], [0, -100])

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-purple via-magenta-purple to-cosmic-purple relative">
      
      {/* Logo Background */}
      <LogoBackground opacity={0.12} />
      
      {/* Starfield */}
      <Starfield />

      {/* Hero CTA Button - Navigation is now in layout */}
      <div className="fixed top-20 right-4 z-40 lg:hidden">
        <Link href="/dialogues">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2 bg-gradient-to-r from-cosmic-gold to-rose-gold rounded-lg font-semibold shadow-lg text-cosmic-purple"
          >
            {t.nav.beginJourney}
          </motion.button>
        </Link>
      </div>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center px-4 pt-16">
        {/* Brand Text - Logo style */}
        <div className="absolute top-24 md:top-32 left-1/2 transform -translate-x-1/2 z-20 overflow-visible w-full max-w-full">
          <BrandText size="lg" />
        </div>
        
        <motion.div
          style={{ y: y1 }}
          className="text-center max-w-5xl mx-auto z-10 relative mt-32 md:mt-40"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >

            <p className="text-xl md:text-2xl lg:text-3xl text-cosmic-gold/90 mb-4 font-light">
              {t.home.heroSubtitle}
            </p>

            <p className="text-base md:text-lg text-cosmic-gold/85 mb-12 max-w-2xl mx-auto">{t.home.heroLead}</p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/dialogues">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-4 bg-gradient-to-r from-cosmic-gold via-rose-gold to-cosmic-gold text-cosmic-purple rounded-xl font-semibold text-lg shadow-2xl hover:shadow-cosmic-gold/50 transition flex items-center group"
                >
                  {t.dialogues.title}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition" />
                </motion.button>
              </Link>

              <Link href="/reading-2026">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-4 bg-cosmic-gold/20 backdrop-blur-sm text-cosmic-gold rounded-xl font-semibold text-lg border border-cosmic-gold/40 hover:bg-cosmic-gold/30 hover:border-cosmic-gold/60 transition"
                >
                  {t.reading2026.title}
                </motion.button>
              </Link>

              <Link href="/pricing">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-4 bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-sm text-white rounded-xl font-semibold text-lg border border-purple-500/40 hover:bg-purple-600/30 hover:border-purple-500/60 transition"
                >
                  {t.nav.pricing}
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </motion.div>

      </section>

      {/* FOOTER */}
      <footer className="relative border-t border-cosmic-gold/20 py-12 px-4 z-10">
        <div className="max-w-7xl mx-auto">

          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Logo variant="horizontal" size="sm" />
              <p className="text-cosmic-gold/80 mt-2">{t.home.footerTagline}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-cosmic-gold">{t.home.footerServices}</h3>
              <ul className="space-y-2 text-cosmic-gold/80">
                <li><Link href="/dialogues" className="hover:text-cosmic-gold transition text-base">{t.dialogues.title}</Link></li>
                <li><Link href="/reading-2026" className="hover:text-cosmic-gold transition text-base">{t.reading2026.title}</Link></li>
                <li><Link href="/saint-valentin" className="hover:text-cosmic-gold transition text-base">{t.valentine.title}</Link></li>
                <li><Link href="/pricing" className="hover:text-cosmic-gold transition text-base">{t.nav.pricing}</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-cosmic-gold">{t.home.footerResources}</h3>
              <ul className="space-y-2 text-cosmic-gold/80">
                <li><Link href="/settings" className="hover:text-cosmic-gold transition text-base">{t.nav.settings}</Link></li>
                <li><Link href="/about" className="hover:text-cosmic-gold transition text-base">{t.nav.about}</Link></li>
                <li><a href="/docs" className="hover:text-cosmic-gold transition text-base">{t.home.footerApiDocs}</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-cosmic-gold">{t.home.footerAbout}</h3>
              <p className="text-cosmic-gold/80 text-sm">
                {t.home.footerAboutText}
              </p>
              <Link href="/about" className="text-cosmic-gold hover:text-rose-gold text-sm mt-2 inline-block">
                {t.home.footerLearnMore}
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-cosmic-gold/20 text-center text-cosmic-gold/75">
            <p>{t.home.footerCopyright}</p>
          </div>

        </div>
      </footer>

    </div>
  )
}

// -------------------------------------------------------------
// STARFIELD BACKGROUND
// -------------------------------------------------------------
function Starfield() {
  const [stars, setStars] = useState<Array<{
    id: number
    x: number
    y: number
    size: number
    duration: number
  }>>([])

  // Generate stars only on client to avoid hydration mismatch
  useEffect(() => {
    setStars(
      Array.from({ length: 100 }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        duration: Math.random() * 3 + 2,
      }))
    )
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
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
            opacity: [0.3, 1, 0.3],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}
