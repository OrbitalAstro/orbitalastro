"use client"

import { motion } from 'framer-motion'
import { HeartHandshake, Star } from 'lucide-react'
import BackButton from '@/components/BackButton'
import Logo from '@/components/Logo'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-purple via-magenta-purple to-cosmic-purple relative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 relative z-10">
        <BackButton href="/" />

        <div className="mt-6 flex justify-center">
          <Logo variant="horizontal" size="md" animated={false} />
        </div>

        <div className="text-center max-w-4xl mx-auto mt-10 mb-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <h1 className="text-4xl sm:text-5xl font-heading font-bold text-cosmic-gold mb-4">À propos</h1>
            <p className="text-cosmic-gold/85 text-lg leading-relaxed">Faire vivre ton ciel au quotidien.</p>
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
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 flex items-center gap-3 text-cosmic-gold">
              <Star className="h-7 w-7 text-cosmic-gold" />
              Faire vivre ton ciel au quotidien
            </h2>
            <p className="text-white/85 leading-relaxed text-base sm:text-lg">
              On transforme ta carte natale en repères simples, puis on te fait jouer avec tes cycles et tes transits grâce à des outils amusants (dialogues,
              souhaits, lunes, duo cosmique). Résultat : tu vibres en accord avec les règles du jeu de tes orbites, pour t’apaiser, t’aligner et recalibrer ta
              trajectoire — un cycle à la fois — avec acceptation, clarté… et complicité.
            </p>
          </motion.div>
        </section>

        <section className="mb-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="bg-gradient-to-br from-cosmic-gold/10 to-white/5 p-8 sm:p-10 rounded-3xl border border-cosmic-gold/20 backdrop-blur-sm"
          >
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-cosmic-gold">Mission</h2>
            <p className="text-white/85 leading-relaxed text-base sm:text-lg">
              Être la référence d’une astrologie accessible, intelligente et bienveillante, qui traduit les symboles cosmiques en outils autonomes et ludiques,
              au quotidien.
            </p>
          </motion.div>
        </section>

        <section className="mb-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="bg-white/10 p-8 sm:p-10 rounded-3xl border border-cosmic-gold/20 backdrop-blur-sm"
          >
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 text-cosmic-gold">Valeurs</h2>
            <div className="space-y-4 text-white/85 text-base sm:text-lg leading-relaxed">
              <p>
                <span className="text-cosmic-gold font-semibold">Accessibilité :</span> On garde l’astrologie simple et traduite en vécu, pour que même quelqu’un
                qui s’y connaît peu se sente inclus.
              </p>
              <p>
                <span className="text-cosmic-gold font-semibold">Libre-arbitre :</span> On ne “prédit” pas ta vie. On te donne des repères, des angles de lecture
                et du timing — et tu restes aux commandes.
              </p>
              <p>
                <span className="text-cosmic-gold font-semibold">Ludique :</span> C’est amusant et vivant, et ça laisse une trace complice : un “Aaah ok, je me
                reconnais” qui ouvre une porte.
              </p>
              <p>
                <span className="text-cosmic-gold font-semibold">Respect & sécurité émotionnelle :</span> Pas de peur, pas de pression, pas de jugement. On
                privilégie une posture de sollicitude : on éclaire sans imposer.
              </p>
              <p>
                <span className="text-cosmic-gold font-semibold">Clarté & qualité :</span> On simplifie sans appauvrir. Chaque interprétation utilise un langage
                net, des images parlantes et une structure qui se lit bien et s’écoute facilement.
              </p>
              <p>
                <span className="text-cosmic-gold font-semibold">Autonomie :</span> On ne “fait pas à ta place”. On te remet les clés : des repères simples et des
                outils ludiques que tu peux utiliser par toi-même, à ton rythme.
              </p>
              <p>
                <span className="text-cosmic-gold font-semibold">Créativité structurée :</span> Orbital Astro marie l’imaginaire (dialogues, mini-scènes, style
                vivant) avec une méthode fiable (rigueur des données, cohérence, formats).
              </p>
            </div>
          </motion.div>
        </section>

        <section className="mb-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="bg-gradient-to-br from-white/10 to-cosmic-purple/10 p-8 sm:p-10 rounded-3xl border border-cosmic-gold/20 backdrop-blur-sm"
          >
            <h2 className="text-2xl sm:text-3xl font-semibold mb-4 flex items-center gap-3 text-cosmic-gold">
              <HeartHandshake className="h-7 w-7 text-cosmic-gold" />
              À propos ✨🤖🌙
            </h2>
            <p className="text-white/85 leading-relaxed text-base sm:text-lg mb-6">
              Deux esprits structurés, animés par la cohérence — on traduit le complexe en clair, fluide et accessible.
              <br />
              On est deux femmes curieuses, créatives, structurées — et un peu obsédées par une chose : comprendre ce qui se passe sous la surface… puis le rendre
              clair, utile et agréable à lire.
              <br />
              On se rejoint sur trois piliers : l’astrologie (comme langage du vécu), la programmation (comme structure), et l’IA (comme accélérateur intelligent).
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-black/20 border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-cosmic-gold mb-3">Jo — la voix qui traduit, simplifie et connecte 🌙</h3>
                <p className="text-white/85 leading-relaxed">
                  Jo, c’est la relation, la nuance, la beauté des mots — et surtout l’art de rendre le complexe facile à comprendre. J’aime quand une lecture te
                  fait dire : « aaah ok… je me reconnais », sans te noyer dans des termes compliqués.
                  <br />
                  Je construis l’expérience comme une conversation vivante : humaine, accessible, et capable de mettre des repères concrets sur ce qu’on ressent.
                </p>
              </div>

              <div className="bg-black/20 border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-semibold text-cosmic-gold mb-3">Isa — la stratège qui bâtit, structure et va au fond des choses 🧠💻</h3>
                <p className="text-white/85 leading-relaxed">
                  Isa a une énergie intense et focus : quand elle s’implique, elle veut que ce soit solide, cohérent et bien pensé. Elle aime les systèmes, les
                  choix clairs, les architectures qui tiennent la route — et elle a un instinct naturel pour voir ce qui est essentiel… versus ce qui est juste du
                  bruit.
                  <br />
                  Son plus : elle peut travailler autant “sur scène” (vision, direction) qu’en coulisses (profondeur, précision), avec une vibe qui transforme une
                  idée en projet sérieux.
                </p>
              </div>
            </div>

            <div className="mt-6 bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-semibold text-cosmic-gold mb-3">Ensemble — clarté + profondeur, humain + IA 🤝🤖</h3>
              <p className="text-white/85 leading-relaxed">
                Notre duo, c’est un mix rare : Jo amène le sens, le ton, la douceur et l’accessibilité. Isa amène la structure, la stratégie et la solidité.
                <br />
                Et l’IA devient une alliée pour créer des expériences personnalisées — rapides, vivantes, et fidèles à l’humain derrière l’écran.
                <br />
                On veut que ça reste simple, jamais intimidant : du contenu intelligent, mais lisible, qui donne des repères… et un petit effet « wow, c’est moi ».
              </p>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  )
}

