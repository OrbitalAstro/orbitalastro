'use client'

import { motion } from 'framer-motion'
import { Sparkles, Star, Telescope, Orbit, HeartHandshake } from 'lucide-react'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-32 pb-20 px-4">
      {/* Header */}
      <div className="text-center max-w-4xl mx-auto mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <Sparkles className="h-12 w-12 text-cosmic-gold mx-auto mb-6" />
          <h1 className="text-6xl font-heading font-bold mb-4">
            About <span className="text-gold-gradient">OrbitalAstro</span>
          </h1>

          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            A bridge between astronomy and storytelling, engineered for modern seekers.
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
            The Origin
          </h2>
          <p className="text-white/70 leading-relaxed text-lg">
            OrbitalAstro began with a simple question:  
            <span className="text-white">"What if astrology could be calculated with the precision of an observatory and expressed with the poetry of myth?"</span>
            <br/><br/>
            The platform combines astronomical computation—ephemerides, house systems, transits, progressions, parallax corrections—with narrative engines that can speak in mythic, cinematic, psychological, or coaching tones.
            <br/><br/>
            It's not just a chart generator.  
            <br/>
            It's a cosmic storyteller.
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
            <Telescope className="text-cosmic-gold h-8 w-8" />
            The Mission
          </h2>
          <p className="text-white/70 leading-relaxed text-lg">
            Our mission is to make the cosmos accessible.  
            To create tools that blend technical exactness with symbolic resonance.  
            To give users not just data—  
            <span className="text-white font-semibold">but meaning, insight, and story.</span>  
            <br/><br/>
            Whether you're an astrologer, a curious seeker, a developer, or an AI exploring symbolic frameworks:  
            <span className="text-white">OrbitalAstro gives you a universe you can navigate.</span>
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
            The Technology
          </h2>
          <ul className="text-white/70 space-y-4 text-lg">
            <li>• Swiss Ephemeris-grade astronomical accuracy</li>
            <li>• 10 house systems, topocentric parallax, advanced aspects</li>
            <li>• Birth-time rectification engine</li>
            <li>• Modular interpretation framework</li>
            <li>• SVG chart rendering engine</li>
            <li>• Full-featured web app using Next.js, Tailwind, Framer Motion</li>
            <li>• APIs designed for LLM orchestration</li>
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
            The Philosophy
          </h2>
          <p className="text-white/70 leading-relaxed text-lg">
            OrbitalAstro does not claim metaphysical truth.  
            It honors astrology as a symbolic language—a mirror, a mythology, a tool for reflection.
            <br/><br/>
            It offers:
            <br/>• <strong className="text-white">clarity</strong>, through precise calculations  
            <br/>• <strong className="text-white">meaning</strong>, through interpretive storytelling  
            <br/>• <strong className="text-white">agency</strong>, by letting users explore their chart as a narrative landscape  
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
            Enter the Cosmos
          </motion.button>
        </Link>
      </section>
    </div>
  )
}

