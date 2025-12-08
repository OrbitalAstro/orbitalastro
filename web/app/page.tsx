// web/app/page.tsx — **CINEMATIC LANDING PAGE**

'use client'

import { useState, useEffect } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import {
  Sparkles, ChartBar, BookOpen, Settings, Calendar, Star,
  ArrowRight, Telescope, Scroll, Wand2, Zap, Heart
} from 'lucide-react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import MobileMenu from '@/components/MobileMenu'

// -------------------------------------------------------------
// MAIN LANDING PAGE
// -------------------------------------------------------------
export default function LandingPage() {
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
                About
              </Link>
              <Link href="/dashboard" className="hidden md:block text-white/70 hover:text-white transition">
                Enter
              </Link>

              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg font-semibold"
                >
                  Begin Journey
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
                Your Cosmic Blueprint
              </span>
              <br />
              <span className="text-white">Awaits</span>
            </h1>

            <p className="text-2xl md:text-3xl text-white/80 mb-4 font-light">
              Where ancient wisdom meets modern precision
            </p>

            <p className="text-lg text-white/60 mb-12 max-w-2xl mx-auto">
              Professional-grade astrological calculations woven into mythopoetic narratives.
              Discover your natal chart, track transits, explore progressions,
              and hear the dialogue of your pre-incarnation.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/dashboard">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-4 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white rounded-xl font-semibold text-lg shadow-2xl hover:shadow-purple-500/50 transition flex items-center group"
                >
                  Calculate Your Chart
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition" />
                </motion.button>
              </Link>

              <Link href="/stories">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-10 py-4 bg-white/10 backdrop-blur-sm text-white rounded-xl font-semibold text-lg border border-white/20 hover:bg-white/20 transition"
                >
                  Read Stories
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
              Stories Written in the Stars
            </h2>
            <p className="text-xl text-white/70">
              Each chart tells a story. Each story reveals a path.
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
                <h2 className="text-4xl font-bold mb-6">Precision Meets Poetry</h2>
                <p className="text-lg text-white/80 mb-6">
                  Our charts combine Swiss Ephemeris-grade calculations with beautiful visualizations.
                  Every angle, every aspect, every transit—rendered with the precision of an observatory
                  and the beauty of a constellation map.
                </p>

                <ul className="space-y-3 text-white/70">
                  <li className="flex items-center">
                    <Star className="h-5 w-5 mr-3 text-cosmic-gold" /> 10 house systems supported
                  </li>
                  <li className="flex items-center">
                    <Star className="h-5 w-5 mr-3 text-cosmic-gold" /> Topocentric Moon parallax correction
                  </li>
                  <li className="flex items-center">
                    <Star className="h-5 w-5 mr-3 text-cosmic-gold" /> Aspect pattern recognition
                  </li>
                  <li className="flex items-center">
                    <Star className="h-5 w-5 mr-3 text-cosmic-gold" /> Birth-time rectification engine
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
              A Complete Astrological Platform
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
            <Telescope className="h-16 w-16 mx-auto mb-6 text-cosmic-gold" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Ready to Map Your Cosmos?
            </h2>
            <p className="text-xl text-white/80 mb-8">
              Join the journey. Calculate your chart. Read your story.
              Hear your pre-incarnation dialogue.
            </p>

            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-5 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 text-white rounded-xl font-semibold text-xl shadow-2xl hover:shadow-purple-500/50 transition"
              >
                Begin Your Journey
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
              <p className="text-white/60">Where astronomy meets storytelling.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-white/60">
                <li><Link href="/dashboard" className="hover:text-white">Dashboard</Link></li>
                <li><Link href="/chart" className="hover:text-white">Charts</Link></li>
                <li><Link href="/stories" className="hover:text-white">Stories</Link></li>
                <li><Link href="/dialogues" className="hover:text-white">Dialogues</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-white/60">
                <li><Link href="/settings" className="hover:text-white">Settings</Link></li>
                <li><Link href="/about" className="hover:text-white">About</Link></li>
                <li><a href="/docs" className="hover:text-white">API Docs</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">About</h3>
              <p className="text-white/60 text-sm">
                Professional-grade astrological calculations with mythopoetic interpretations.
              </p>
              <Link href="/about" className="text-purple-400 hover:text-purple-300 text-sm mt-2 inline-block">
                Learn more →
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-white/10 text-center text-white/60">
            <p>&copy; 2024 OrbitalAstro. Built with precision and poetry.</p>
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
  const stars = Array.from({ length: 100 }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    duration: Math.random() * 3 + 2,
  }))

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
  const stories = [
    {
      title: "The Sun in Leo",
      excerpt:
        "Your Sun in Leo illuminates a path of creative expression and leadership...",
      sign: "Leo",
    },
    {
      title: "The Moon's Embrace",
      excerpt:
        "Your Moon in Cancer reflects deep emotional waters of memory and intuition...",
      sign: "Cancer",
    },
    {
      title: "Saturn's Return",
      excerpt:
        "As Saturn completes its cycle, you stand at the threshold of mastery...",
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
  const features = [
    { icon: Telescope, title: "Precision Calculations", desc: "Swiss Ephemeris-grade accuracy" },
    { icon: Scroll, title: "Mythopoetic Stories", desc: "Narratives woven from your chart" },
    { icon: Wand2, title: "Birth-Time Rectification", desc: "Find your exact birth moment" },
    { icon: Zap, title: "Real-Time Transits", desc: "Track planetary movements" },
    { icon: Heart, title: "Personalized Interpretations", desc: "Tailored to your focus areas" },
    { icon: ChartBar, title: "Visual Charts", desc: "Beautiful SVG renderings" },
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
          <feature.icon className="h-10 w-10 text-cosmic-gold mb-4" />
          <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
          <p className="text-white/70">{feature.desc}</p>
        </motion.div>
      ))}
    </div>
  )
}
