'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  BookOpenText,
  CreditCard,
  Orbit,
  Settings,
  Info,
  Mail,
  HelpCircle,
  FileText,
  Shield,
  Menu,
  X,
  LogOut,
  ChevronDown,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { signOut } from 'next-auth/react'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from './Logo'
import CartNavLink from './CartNavLink'
import { useTranslation } from '@/lib/useTranslation'
import { useAuth } from '@/lib/useAuth'

export default function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const t = useTranslation()
  const { isAuthenticated } = useAuth()

  const handleSignOut = () => {
    setMobileMenuOpen(false)
    setMoreOpen(false)
    void signOut({ callbackUrl: '/' })
  }

  useEffect(() => {
    if (!moreOpen) return
    const onPointerDown = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [moreOpen])

  const menuItems: Array<{
    href: string
    label: string
    icon: React.ComponentType<{ className?: string }>
    disabled?: boolean
  }> = [
    { href: '/about', label: t.nav.about, icon: Info },
    { href: '/univers', label: t.nav.univers, icon: Orbit },
    { href: '/journal-pilot', label: t.nav.journalPilot, icon: BookOpenText },
    { href: '/pricing', label: t.nav.pricing, icon: CreditCard },
  ]

  const moreItems = [
    { href: '/faq', label: t.nav.faq, icon: HelpCircle },
    { href: '/terms', label: t.nav.terms, icon: FileText },
    { href: '/privacy', label: t.nav.privacy, icon: Shield },
    { href: '/contact', label: t.nav.contact, icon: Mail },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard'
    }
    return pathname === href || pathname?.startsWith(href + '/')
  }

  const linkClass = (href: string, compact = false) =>
    [
      compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm',
      'rounded-lg font-medium transition-all whitespace-nowrap',
      isActive(href)
        ? 'bg-white/10 text-white'
        : 'text-white/70 hover:text-white hover:bg-white/10',
    ].join(' ')

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-white/10 backdrop-blur-md bg-black/80 overflow-x-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-center h-16">
            {/* Logo — ancré à gauche */}
            <Link
              href="/"
              className="absolute left-0 flex items-center flex-shrink-0 z-10"
            >
              <Logo variant="horizontal" size="sm" asLink={false} />
            </Link>

            {/* Menu desktop — centré */}
            <div className="hidden xl:flex items-center justify-center gap-0.5 min-w-0 px-28">
              {menuItems.map((item) => {
                if (item.disabled) {
                  return (
                    <div
                      key={item.href}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/40 cursor-not-allowed opacity-50 whitespace-nowrap"
                      title={
                        t.locale === 'fr'
                          ? 'Disponible très bientôt'
                          : t.locale === 'es'
                            ? 'Disponible muy pronto'
                            : 'Coming very soon'
                      }
                    >
                      {item.label}
                    </div>
                  )
                }
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={linkClass(item.href, true)}
                  >
                    {item.label}
                  </Link>
                )
              })}

              {/* Liens secondaires — menu Plus */}
              <div ref={moreRef} className="relative">
                <button
                  type="button"
                  onClick={() => setMoreOpen((o) => !o)}
                  className={[
                    'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap',
                    moreOpen || moreItems.some((i) => isActive(i.href))
                      ? 'bg-white/10 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10',
                  ].join(' ')}
                  aria-expanded={moreOpen}
                  aria-haspopup="true"
                >
                  {t.nav.more}
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                <AnimatePresence>
                  {moreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-1 min-w-[10rem] py-1 rounded-lg border border-white/10 bg-black/95 backdrop-blur-md shadow-xl z-50"
                    >
                      {moreItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMoreOpen(false)}
                          className={`block px-4 py-2 text-sm transition ${isActive(item.href) ? 'text-white bg-white/10' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Actions — ancrées à droite */}
            <div className="absolute right-0 flex items-center gap-1 z-10">
              <CartNavLink className="hidden xl:inline-flex p-2 rounded-lg hover:bg-white/10" />
              <Link
                href="/settings"
                className={`hidden xl:block p-2 rounded-lg transition-all ${isActive('/settings') ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'}`}
                title={t.nav.settings}
              >
                <Settings className="h-5 w-5" />
              </Link>
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-all whitespace-nowrap"
                >
                  <LogOut className="h-4 w-4" />
                  <span>{t.nav.signOut}</span>
                </button>
              )}
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="xl:hidden p-2 text-white hover:bg-white/10 rounded-lg transition"
                aria-label={t.common.openMenu}
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 xl:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-black border-r border-white/10 z-50 xl:hidden overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <Logo variant="horizontal" size="sm" asLink={false} />
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition"
                    aria-label={t.common.closeMenu}
                  >
                    <X className="h-6 w-6 text-white" />
                  </button>
                </div>

                <nav className="space-y-2">
                  {menuItems.map((item) => {
                    if (item.disabled) {
                      return (
                        <div
                          key={item.href}
                          className="flex items-center gap-3 p-3 rounded-lg text-white/40 cursor-not-allowed opacity-50"
                          title={
                            t.locale === 'fr'
                              ? 'Disponible très bientôt'
                              : t.locale === 'es'
                                ? 'Disponible muy pronto'
                                : 'Coming very soon'
                          }
                        >
                          <item.icon className="h-5 w-5 text-cosmic-gold/40" />
                          <span className="font-medium">{item.label}</span>
                        </div>
                      )
                    }
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg transition text-white
                          ${isActive(item.href)
                            ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30'
                            : 'hover:bg-white/10'
                          }
                        `}
                      >
                        <item.icon className="h-5 w-5 text-cosmic-gold" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    )
                  })}

                  <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
                    {moreItems.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`
                          flex items-center gap-3 p-3 rounded-lg transition text-white
                          ${isActive(item.href) ? 'bg-white/10' : 'hover:bg-white/10'}
                        `}
                      >
                        <item.icon className="h-5 w-5 text-cosmic-gold" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    ))}
                    <Link
                      href="/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg transition text-white
                        ${isActive('/settings') ? 'bg-white/10' : 'hover:bg-white/10'}
                      `}
                    >
                      <Settings className="h-5 w-5 text-cosmic-gold" />
                      <span className="font-medium">{t.nav.settings}</span>
                    </Link>
                    {isAuthenticated && (
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="flex items-center gap-3 p-3 rounded-lg transition text-white hover:bg-white/10 w-full"
                      >
                        <LogOut className="h-5 w-5 text-cosmic-gold" />
                        <span className="font-medium">{t.nav.signOut}</span>
                      </button>
                    )}
                  </div>
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
