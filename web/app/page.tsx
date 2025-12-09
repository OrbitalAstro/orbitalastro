// web/app/page.tsx — **CINEMATIC LANDING PAGE**

'use client'

import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Sparkles, BarChart3, BookOpen, Settings as SettingsIcon, Calendar, Star,
  ArrowRight, Eye, Scroll, Wand2, Zap, Heart
} from 'lucide-react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import MobileMenu from '@/components/MobileMenu'
import { useTranslation } from '@/lib/useTranslation'

// -------------------------------------------------------------
// MAIN LANDING PAGE
// -------------------------------------------------------------
export default function LandingPage() {
  const t = useTranslation()
  const { scrollY } = useScroll()
  const y1 = useTransform(scrollY, [0, 300], [0, 200])
  const y2 = useTransform(scrollY, [0, 300], [0, -100])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      
      {/* Starfield */}
      <Starfield />

      {/* Navigation Bar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 backdrop-blur-md bg-black/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            {/* Logo */}
            <Logo variant="horizontal" size="md" />

            {/* Right Nav */}
            <div className="flex items-center space-x-6">
              <Link href="/about" className="hidden md:block text-white/70 hover:text-white transition">
                {t.nav.about}
              </Link>
              <Link href="/chat" className="hidden md:block text-white/70 hover:text-white transition">
                {t.nav.chat}
              </Link>
              <Link href="/dashboard" className="hidden md:block text-white/70 hover:text-white transition">
                {t.nav.enter}
              </Link>
              <Link href="/settings" className="hidden md:block text-white/70 hover:text-white transition">
                <SettingsIcon className="h-5 w-5" />
              </Link>

              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold"
                >
                  {t.nav.beginJourney}
                </motion.button>
              </Link>
              <MobileMenu />
            </div>

          </div>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section className="relative min-h-screen flex items-center justify-center px-4">
        <motion.div
          style={{ y: y1, opacity }}
          className="text-center max-w-5xl mx-auto z-10"
        >
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
          >
            <h1 className="text-6xl md:text-8xl font-heading font-bold mb-6 leading-tight">
              <span className="text-cosmic-gradient">
                {t.home.heroTitle1}
              </span>
              <br />
              <span className="text-white">{t.home.heroTitle2}</span>
            </h1>

            <p className="text-2xl md:text-3xl text-white/80 mb-4 font-light">
              {t.home.heroSubtitle}
            </p>

            <p className="text-lg text-white/60 mb-12 max-w-2xl mx-auto">
              {t.home.heroDescription}
              <Link href="/dashboard" className="text-purple-400 hover:text-purple-300 underline">{t.home.heroDescriptionLinkNatal}</Link>,{' '}
              <Link href="/transits" className="text-purple-400 hover:text-purple-300 underline">{t.home.heroDescriptionLinkTransits}</Link>,{' '}
              <Link href="/progressions" className="text-purple-400 hover:text-purple-300 underline">{t.home.heroDescriptionLinkProgressions}</Link>,
              {' '}and hear the <Link href="/dialogues" className="text-purple-400 hover:text-purple-300 underline">{t.home.heroDescriptionLinkDialogues}</Link>.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-2xl hover:shadow-purple-500/50 transition flex items-center group"
                >
                  {t.home.ctaCalculate}
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition" />
                </motion.button>
              </Link>

              <Link href="/stories">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold text-lg border border-white/20 hover:bg-white/20 transition"
                >
                  {t.home.ctaReadStories}
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </motion.div>

        <motion.div style={{ y: y2 }} className="absolute inset-0 pointer-events-none">
          <FloatingPlanets />
        </motion.div>
      </section>

      {/* STORIES CAROUSEL */}
      <section className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-heading font-bold mb-4 text-gold-gradient">
              {t.home.storiesTitle}
            </h2>
            <p className="text-xl text-white/70">
              {t.home.storiesSubtitle}
            </p>
          </motion.div>

          <StoryCarousel />
        </div>
      </section>

      {/* CHART SHOWCASE */}
      <section className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-3xl p-12 backdrop-blur-sm border border-white/10"
          >
            <div className="grid md:grid-cols-2 gap-12 items-center">

              {/* Left Text */}
              <div>
                <h2 className="text-4xl font-bold mb-6">{t.home.precisionTitle}</h2>
                <p className="text-lg text-white/80 mb-6">
                  {t.home.precisionDescription}
                </p>

                <ul className="space-y-3 text-white/70">
                  <li className="flex items-center">
                    <Star className="h-5 w-5 mr-3 text-cosmic-gold" /> {t.home.feature1}
                  </li>
                  <li className="flex items-center">
                    <Star className="h-5 w-5 mr-3 text-cosmic-gold" /> {t.home.feature2}
                  </li>
                  <li className="flex items-center">
                    <Star className="h-5 w-5 mr-3 text-cosmic-gold" /> {t.home.feature3}
                  </li>
                  <li className="flex items-center">
                    <Star className="h-5 w-5 mr-3 text-cosmic-gold" />{' '}
                    <Link href="/rectification" className="hover:text-cosmic-gold transition">
                      {t.home.feature4}
                    </Link>
                  </li>
                </ul>
              </div>

              {/* Right Visual */}
              <div className="relative">
                <ChartShowcase />
              </div>

            </div>
          </motion.div>
        </div>
      </section>

      {/* FEATURES GRID */}
      <section className="relative py-32 px-4">
        <div className="max-w-7xl mx-auto">
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl font-heading font-bold mb-4 text-gold-gradient">
              {t.home.featuresTitle}
            </h2>
          </motion.div>

          <FeatureGrid />
        
        </div>
      </section>

      {/* BIG CTA */}
      <section className="relative py-32 px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto text-center"
        >
          <div className="bg-gradient-to-br from-purple-900/50 to-pink-900/50 rounded-3xl p-16 backdrop-blur-sm border border-white/10">
            <Eye className="h-16 w-16 mx-auto mb-6 text-cosmic-gold" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              {t.home.ctaTitle}
            </h2>
            <p className="text-xl text-white/80 mb-8">
              {t.home.ctaDescription}
            </p>

            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white rounded-xl font-semibold text-xl shadow-2xl hover:shadow-purple-500/50 transition"
              >
                {t.home.ctaButton}
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="relative border-t border-white/10 py-12 px-4">
        <div className="max-w-7xl mx-auto">

          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Logo variant="horizontal" size="sm" />
              <p className="text-white/60">{t.home.footerTagline}</p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">{t.home.footerFeatures}</h3>
              <ul className="space-y-2 text-white/60">
                <li><Link href="/dashboard" className="hover:text-white">{t.nav.dashboard}</Link></li>
                <li><Link href="/chart" className="hover:text-white">{t.nav.chart}</Link></li>
                <li><Link href="/transits" className="hover:text-white">Transits</Link></li>
                <li><Link href="/progressions" className="hover:text-white">Progressions</Link></li>
                <li><Link href="/rectification" className="hover:text-white">Rectification</Link></li>
                <li><Link href="/stories" className="hover:text-white">{t.nav.stories}</Link></li>
                <li><Link href="/dialogues" className="hover:text-white">{t.nav.dialogues}</Link></li>
                <li><Link href="/chat" className="hover:text-white">{t.nav.chat}</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">{t.home.footerResources}</h3>
              <ul className="space-y-2 text-white/60">
                <li><Link href="/settings" className="hover:text-white">{t.nav.settings}</Link></li>
                <li><Link href="/about" className="hover:text-white">{t.nav.about}</Link></li>
                <li><a href="/docs" className="hover:text-white">API Docs</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">{t.home.footerAbout}</h3>
              <p className="text-white/60 text-sm">
                {t.home.footerAboutText}
              </p>
              <Link href="/about" className="text-purple-400 hover:text-purple-300 text-sm mt-2 inline-block">
                {t.home.footerLearnMore}
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10 text-center text-white/60">
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
    <div className="fixed inset-0 pointer-events-none">
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

// -------------------------------------------------------------
// FLOATING PLANETS
// -------------------------------------------------------------
function FloatingPlanets() {
  return (
    <>
      {['☉', '☽', '☿', '♀', '♂', '♃', '♄'].map((glyph, i) => (
        <motion.div
          key={i}
          className="absolute text-6xl opacity-20"
          style={{
            left: `${10 + i * 12}%`,
            top: `${20 + (i % 3) * 30}%`,
          }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, 360],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {glyph}
        </motion.div>
      ))}
    </>
  )
}

// -------------------------------------------------------------
// STORIES CAROUSEL
// -------------------------------------------------------------
function StoryCarousel() {
  const t = useTranslation()
  const stories: Array<{ title: string; excerpt: string; sign: string }> = [
    {
      title: t.home.story1Title,
      excerpt: t.home.story1Excerpt,
      sign: "Leo",
    },
    {
      title: t.home.story2Title,
      excerpt: t.home.story2Excerpt,
      sign: "Cancer",
    },
    {
      title: t.home.story3Title,
      excerpt: t.home.story3Excerpt,
      sign: "Capricorn",
    },
  ]

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {stories.map((story, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-2xl p-8 border border-white/10 backdrop-blur-sm hover:border-white/20 transition"
        >
          <Scroll className="h-12 w-12 text-cosmic-gold mb-4" />
          <h3 className="text-2xl font-bold mb-2">{story.title}</h3>
          <p className="text-white/70 mb-4">{story.excerpt}</p>
          <span className="text-sm text-purple-400 font-semibold">{story.sign}</span>
        </motion.div>
      ))}
    </div>
  )
}

// -------------------------------------------------------------
// ROTATING CHART SHOWCASE
// -------------------------------------------------------------
function ChartShowcase() {
  return (
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      className="w-full aspect-square relative"
    >
      <div className="absolute inset-0 rounded-full border-4 border-cosmic-purple/30" />
      <div className="absolute inset-4 rounded-full border-2 border-cosmic-pink/30" />
      <div className="absolute inset-8 rounded-full border border-cosmic-gold/30" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        <Sparkles className="h-16 w-16 text-yellow-400" />
      </div>
    </motion.div>
  )
}

// -------------------------------------------------------------
// FEATURE GRID
// -------------------------------------------------------------
function FeatureGrid() {
  const t = useTranslation()
  const features = [
    { icon: Eye, title: t.home.featurePrecision, desc: t.home.featurePrecisionDesc, href: "/dashboard" },
    { icon: Scroll, title: t.home.featureStories, desc: t.home.featureStoriesDesc, href: "/stories" },
    { icon: Wand2, title: t.home.featureRectification, desc: t.home.featureRectificationDesc, href: "/rectification" },
    { icon: Zap, title: t.home.featureTransits, desc: t.home.featureTransitsDesc, href: "/transits" },
    { icon: Heart, title: t.home.featureInterpretations, desc: t.home.featureInterpretationsDesc, href: "/dashboard" },
    { icon: BarChart3, title: t.home.featureCharts, desc: t.home.featureChartsDesc, href: "/chart" },
  ]

  return (
    <div className="grid md:grid-cols-3 gap-8">
      {features.map((feature, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1 }}
          className="bg-white/5 rounded-xl p-6 border border-white/10 hover:border-white/20 transition"
        >
          <Link href={feature.href || '#'} className="block">
            <feature.icon className="h-10 w-10 text-cosmic-gold mb-4" />
            <h3 className="text-xl font-semibold mb-2 hover:text-cosmic-gold transition">{feature.title}</h3>
            <p className="text-white/70">{feature.desc}</p>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
