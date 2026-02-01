"use client"

import { motion } from 'framer-motion'
import { Sparkles, Orbit } from 'lucide-react'
import BackButton from '@/components/BackButton'
import Logo from '@/components/Logo'
import Starfield from '@/components/Starfield'

export default function UniversPage() {
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
            <h1 className="text-4xl sm:text-5xl font-heading font-bold text-cosmic-gold mb-4">
              L'Univers Orbital
            </h1>
            <p className="text-cosmic-gold/85 text-lg leading-relaxed">
              Un espace de jeu de vie où chaque orbite devient une exploration
            </p>
          </motion.div>
        </div>

        <section className="mb-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="bg-white/10 p-8 sm:p-10 rounded-3xl border border-cosmic-gold/20 backdrop-blur-sm"
          >
            <p className="text-white/85 leading-relaxed text-base sm:text-lg mb-6">
              Bienvenue dans l'univers ludique d'Orbital Astro, un espace de jeu de vie où chaque choix, chaque mouvement personnel et chaque relation deviennent des orbites à explorer. Ici, l'Astrologie est la voix officielle de la Guilde : elle n'impose rien, elle invite, éclaire et donne le ton, tandis que la Guilde — les 10 planètes, les 12 signes et d'autres éléments du ciel — prend vie selon le dialogue et ajoute sa propre énergie à la ronde.
            </p>
            <p className="text-white/85 leading-relaxed text-base sm:text-lg mb-6">
              Chaque membre de la Guilde a sa personnalité et sa voix : les planètes soufflent des informations sur les dynamiques qui les concernent, les signes apportent leurs couleurs et nuances, et les aspects créent des reflets de résonances et des étincelles qui révèlent tensions et harmonies. Ensemble, ils forment un collectif vivant, un vrai conseil cosmique qui accompagne tes explorations tout en te laissant calibrer et aligner ta trajectoire.
            </p>
            <p className="text-white/85 leading-relaxed text-base sm:text-lg mb-6">
              Avec le Dialogue Orbital, tu deviens explorateur·rice de ton univers intérieur : tu observes comment tes orbites se croisent, se frôlent, s'éloignent ou s'harmonisent, entre elles et avec celles des autres. C'est un jeu d'observation et de curiosité, où tu peux tester des perspectives, découvrir des résonances et t'amuser avec les mouvements uniques de ton univers.
            </p>
            <p className="text-white/85 leading-relaxed text-base sm:text-lg">
              Orbital Astro transforme l'astrologie en une aventure vivante et ludique : l'Astrologie, la Guilde et toi explorez, jouez et interagissez avec légèreté, émerveillement et un petit sourire cosmique.
            </p>
          </motion.div>
        </section>

        <div className="flex justify-center mt-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex items-center gap-3 text-cosmic-gold/70"
          >
            <Orbit className="h-6 w-6" />
            <span className="text-sm italic">Explore ton univers orbital</span>
            <Sparkles className="h-5 w-5" />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
