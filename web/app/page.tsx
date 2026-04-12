// web/app/page.tsx — **CINEMATIC LANDING PAGE**

'use client'

export const dynamic = 'force-dynamic'

import { motion } from 'framer-motion'
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-cosmic-purple via-magenta-purple to-cosmic-purple relative flex flex-col">
      {/* Hero : tout en flux dans la section (fonds en absolute local, pas de fixed plein viewport) */}
      <section className="relative min-h-screen flex flex-col overflow-x-hidden">
        <LogoBackground opacity={0.3} />
        <Starfield />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-16 pt-6 w-full max-w-full">
          <div className="w-full max-w-5xl flex justify-end lg:hidden mb-4">
            <Link href="/dialogues">
              <motion.button
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-lg border border-white/35 bg-[linear-gradient(135deg,rgba(255,255,255,0.45)_0%,rgba(255,228,240,0.35)_35%,rgba(200,235,255,0.3)_70%,rgba(255,255,255,0.4)_100%)] px-6 py-2 font-semibold text-cosmic-purple shadow-[0_4px_24px_rgba(221,160,221,0.35),0_0_20px_rgba(175,238,238,0.2),inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-md"
              >
                {t.nav.beginJourney}
              </motion.button>
            </Link>
          </div>

          <div className="pointer-events-none flex justify-center w-full mb-6 sm:mb-8">
            <BrandText size="lg" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="relative z-10 mx-auto max-w-5xl w-full text-center"
          >
            <p className="text-xl md:text-2xl lg:text-3xl text-cosmic-gold/90 mb-12 font-light">
              {t.home.heroSubtitle}
            </p>

            {/* CTAs — deux « planètes » harmonisées : même taille, forme circulaire, léger relief */}
            <div className="flex flex-col sm:flex-row gap-6 sm:gap-10 justify-center items-center">
              <Link
                href="/dialogues"
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cosmic-purple rounded-full"
                aria-label={t.dialogues.title}
              >
                <motion.div
                  whileHover={{ scale: 1.045 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className={[
                    'flex aspect-square w-full max-w-[14rem] sm:aspect-auto sm:h-56 sm:w-56',
                    'flex-col items-center justify-center gap-1.5 rounded-full backdrop-blur-xl',
                    'border border-white/40 ring-1 ring-white/25',
                    // Opalescence alignée sur BrandText : corail / prune / turquoise / bleu poudre (tons doux, translucides)
                    'bg-[radial-gradient(circle_at_30%_22%,rgba(255,255,255,0.7)_0%,rgba(255,255,255,0.12)_42%,transparent_55%),linear-gradient(135deg,rgba(255,127,80,0.22)_0%,rgba(221,160,221,0.28)_26%,rgba(175,238,238,0.26)_52%,rgba(176,224,230,0.32)_78%,rgba(255,127,80,0.18)_100%)]',
                    'px-4 py-5 text-center',
                    'shadow-[inset_0_2px_14px_rgba(255,255,255,0.5),inset_0_-8px_20px_rgba(107,45,125,0.08),0_8px_28px_rgba(0,0,0,0.28),0_0_36px_rgba(221,160,221,0.2),0_0_52px_rgba(175,238,238,0.12)]',
                    'transition-[border-color,box-shadow,background-color] duration-300',
                    'hover:border-white/55 hover:shadow-[inset_0_2px_16px_rgba(255,255,255,0.55),inset_0_-8px_20px_rgba(107,45,125,0.06),0_10px_32px_rgba(0,0,0,0.32),0_0_44px_rgba(221,160,221,0.28),0_0_64px_rgba(175,238,238,0.16)]',
                  ].join(' ')}
                >
                  <span className="font-semibold text-cosmic-purple text-[0.82rem] sm:text-sm leading-tight">
                    {t.dialogues.titleLine1}
                    {t.dialogues.titleLine2 ? (
                      <>
                        <br />
                        <span>{t.dialogues.titleLine2}</span>
                      </>
                    ) : null}
                  </span>
                  <p className="font-body text-cosmic-purple/92 text-[0.65rem] sm:text-[0.7rem] leading-snug max-h-[min(44%,5.75rem)] overflow-y-auto overscroll-contain [scrollbar-width:thin]">
                    {t.dialogues.heroCtaSubtitle}
                  </p>
                </motion.div>
              </Link>

              <Link
                href="/reading-2026"
                className="focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-cosmic-purple rounded-full"
                aria-label={t.reading2026.title}
              >
                <motion.div
                  whileHover={{ scale: 1.045 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                  className={[
                    'flex aspect-square w-full max-w-[14rem] sm:aspect-auto sm:h-56 sm:w-56',
                    'flex-col items-center justify-center gap-1.5 rounded-full backdrop-blur-xl',
                    'border border-white/40 ring-1 ring-white/25',
                    // Variante : même palette opalescente, angle inversé (reflet nacré décalé)
                    'bg-[radial-gradient(circle_at_72%_26%,rgba(255,255,255,0.62)_0%,rgba(255,255,255,0.1)_44%,transparent_54%),linear-gradient(215deg,rgba(176,224,230,0.3)_0%,rgba(175,238,238,0.26)_30%,rgba(221,160,221,0.28)_56%,rgba(255,127,80,0.2)_88%,rgba(176,224,230,0.24)_100%)]',
                    'px-4 py-5 text-center',
                    'shadow-[inset_0_2px_14px_rgba(255,255,255,0.48),inset_0_-8px_20px_rgba(107,45,125,0.08),0_8px_28px_rgba(0,0,0,0.28),0_0_36px_rgba(175,238,238,0.18),0_0_52px_rgba(221,160,221,0.16)]',
                    'transition-[border-color,box-shadow,background-color] duration-300',
                    'hover:border-white/55 hover:shadow-[inset_0_2px_16px_rgba(255,255,255,0.55),inset_0_-8px_20px_rgba(107,45,125,0.06),0_10px_32px_rgba(0,0,0,0.32),0_0_44px_rgba(175,238,238,0.22),0_0_64px_rgba(221,160,221,0.22)]',
                  ].join(' ')}
                >
                  <span className="font-semibold text-cosmic-purple text-[0.82rem] sm:text-sm leading-tight">
                    {t.reading2026.titleLine1}
                    {t.reading2026.titleLine2 ? (
                      <>
                        <br />
                        <span>{t.reading2026.titleLine2}</span>
                      </>
                    ) : null}
                  </span>
                  <p className="font-body text-cosmic-purple/92 text-[0.65rem] sm:text-[0.7rem] leading-snug max-h-[min(44%,5.75rem)] overflow-y-auto overscroll-contain [scrollbar-width:thin]">
                    {t.reading2026.heroCtaSubtitle}
                  </p>
                </motion.div>
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
        </div>
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
