// web/app/page.tsx — **CINEMATIC LANDING PAGE**

'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { useTranslation } from '@/lib/useTranslation'
import { PUBLIC_SITE_URL, SOURCE_CODE_REPOSITORY_URL, getApiDocsUrl } from '@/lib/site'
import LogoBackground from '@/components/LogoBackground'
import BrandText from '@/components/BrandText'
import Starfield from '@/components/Starfield'

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

            <p className="text-xl md:text-2xl lg:text-3xl text-cosmic-gold/90 mb-12 font-light">
              {t.home.heroSubtitle}
            </p>

            {/* CTAs — deux cartes identiques : cadre, bandeau titre, zone sous-titre */}
            <div className="flex flex-col sm:flex-row gap-5 sm:gap-6 justify-center items-stretch">
              <Link
                href="/dialogues"
                className="group flex max-w-[min(100%,22rem)] w-full sm:w-auto flex-col overflow-hidden rounded-2xl border border-cosmic-gold/35 bg-cosmic-purple/50 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.35)] ring-1 ring-inset ring-white/[0.07] transition duration-300 hover:border-cosmic-gold/55 hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] hover:ring-white/10"
              >
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  className="w-full px-8 py-4 rounded-none rounded-t-2xl bg-gradient-to-br from-cosmic-gold via-rose-gold to-cosmic-gold text-cosmic-purple font-semibold text-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] flex flex-col items-center justify-center text-center leading-tight transition duration-300 group-hover:brightness-[1.04]"
                >
                  <span>{t.dialogues.titleLine1}</span>
                  {t.dialogues.titleLine2 ? <span>{t.dialogues.titleLine2}</span> : null}
                </motion.button>
                <p className="border-t border-cosmic-purple/15 bg-gradient-to-b from-rose-gold to-[#edd5c5] px-3.5 py-3.5 text-center text-sm sm:text-base font-body leading-relaxed text-cosmic-purple">
                  {t.dialogues.heroCtaSubtitle}
                </p>
              </Link>

              <Link
                href="/reading-2026"
                className="group flex max-w-[min(100%,22rem)] w-full sm:w-auto flex-col overflow-hidden rounded-2xl border border-cosmic-gold/35 bg-cosmic-purple/50 backdrop-blur-md shadow-[0_12px_40px_rgba(0,0,0,0.35)] ring-1 ring-inset ring-white/[0.07] transition duration-300 hover:border-cosmic-gold/55 hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] hover:ring-white/10"
              >
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  className="w-full px-8 py-4 rounded-none rounded-t-2xl bg-gradient-to-br from-cosmic-gold via-rose-gold to-cosmic-gold text-cosmic-purple font-semibold text-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.45)] flex flex-col items-center justify-center text-center leading-tight transition duration-300 group-hover:brightness-[1.04]"
                >
                  <span>{t.reading2026.titleLine1}</span>
                  {t.reading2026.titleLine2 ? <span>{t.reading2026.titleLine2}</span> : null}
                </motion.button>
                <p className="border-t border-cosmic-purple/15 bg-gradient-to-b from-rose-gold to-[#edd5c5] px-3.5 py-3.5 text-center text-sm sm:text-base font-body leading-relaxed text-cosmic-purple">
                  {t.reading2026.heroCtaSubtitle}
                </p>
              </Link>
            </div>

            {/* Note de nouveautés */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
              className="mt-8 text-center text-cosmic-gold/80 font-body text-lg sm:text-xl tracking-normal max-w-xl mx-auto leading-relaxed"
            >
              Viens nous voir souvent pour découvrir nos nouveautés.
            </motion.p>
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
                <li>
                  <a
                    href={getApiDocsUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-cosmic-gold transition text-base"
                  >
                    {t.home.footerApiDocs}
                  </a>
                </li>
                <li>
                  <a
                    href={PUBLIC_SITE_URL}
                    className="hover:text-cosmic-gold transition text-base break-all"
                  >
                    {PUBLIC_SITE_URL}
                  </a>
                </li>
                <li>
                  <a
                    href={SOURCE_CODE_REPOSITORY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-cosmic-gold transition text-base"
                  >
                    {t.nav.sourceCode}
                  </a>
                </li>
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
