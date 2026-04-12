'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Home, BookOpen, MessageSquare, Settings, Info, TrendingUp, Zap, Wand2, Calendar, Users, BookOpenText } from 'lucide-react'
import Link from 'next/link'
import Logo from './Logo'
import { useTranslation } from '@/lib/useTranslation'

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const t = useTranslation()

  const menuItems = [
    { href: '/dashboard', label: t.nav.dashboard, icon: Home },
    { href: '/transits', label: t.nav.transits, icon: Zap },
    { href: '/progressions', label: t.nav.progressions, icon: TrendingUp },
    { href: '/rectification', label: t.nav.rectification, icon: Wand2 },
    { href: '/stories', label: t.nav.stories, icon: BookOpen },
    { href: '/dialogues', label: t.nav.dialogues, icon: MessageSquare },
    { href: '/reading-2026', label: t.nav.reading2026, icon: Calendar },
    { href: '/journal-pilot', label: t.nav.journalPilot, icon: BookOpenText },
    { href: '/saint-valentin', label: t.nav.valentine, icon: Users },
    { href: '/chat', label: t.nav.chat, icon: MessageSquare },
    { href: '/settings', label: t.nav.settings, icon: Settings },
    { href: '/about', label: t.nav.about, icon: Info },
  ]

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition"
        aria-label={t.common.openMenu}
      >
        <Menu className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 md:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-black border-r border-white/10 z-50 md:hidden overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                  <Logo variant="horizontal" size="sm" />
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition"
                    aria-label={t.common.closeMenu}
                  >
                    <X className="h-6 w-6 text-white" />
                  </button>
                </div>

                <nav className="space-y-2">
                  {menuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition text-white"
                    >
                      <item.icon className="h-5 w-5 text-cosmic-gold" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  ))}
                </nav>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

