'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  MessageSquare, 
  Calendar,
  Settings, 
  Info,
  Menu,
  X
} from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Logo from './Logo'
import { useTranslation } from '@/lib/useTranslation'

export default function Navigation() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const t = useTranslation()

  const menuItems = [
    { href: '/dialogues', label: t.nav.dialogues, icon: MessageSquare },
    { href: '/reading-2026', label: t.nav.reading2026, icon: Calendar },
  ]

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/' || pathname === '/dashboard'
    }
    return pathname === href || pathname?.startsWith(href + '/')
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 backdrop-blur-md bg-black/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center">
              <Logo variant="horizontal" size="sm" asLink={false} />
            </Link>

            {/* Desktop Menu */}
            <div className="hidden lg:flex items-center space-x-1">
              {menuItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
                    ${isActive(item.href)
                      ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-white border border-purple-500/30'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
              
              {/* Settings and About */}
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-white/10">
                <Link
                  href="/settings"
                  className={`
                    p-2 rounded-lg transition-all
                    ${isActive('/settings')
                      ? 'bg-white/10 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                    }
                  `}
                  title={t.nav.settings}
                >
                  <Settings className="h-5 w-5" />
                </Link>
                <Link
                  href="/about"
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-all
                    ${isActive('/about')
                      ? 'bg-white/10 text-white'
                      : 'text-white/70 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  {t.nav.about}
                </Link>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 text-white hover:bg-white/10 rounded-lg transition"
              aria-label={t.common.openMenu}
            >
              <Menu className="h-6 w-6" />
            </button>
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
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 lg:hidden"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-black border-r border-white/10 z-50 lg:hidden overflow-y-auto"
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
                  {menuItems.map((item) => (
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
                  ))}
                  
                  <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
                    <Link
                      href="/settings"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg transition text-white
                        ${isActive('/settings')
                          ? 'bg-white/10'
                          : 'hover:bg-white/10'
                        }
                      `}
                    >
                      <Settings className="h-5 w-5 text-cosmic-gold" />
                      <span className="font-medium">{t.nav.settings}</span>
                    </Link>
                    <Link
                      href="/about"
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg transition text-white
                        ${isActive('/about')
                          ? 'bg-white/10'
                          : 'hover:bg-white/10'
                        }
                      `}
                    >
                      <Info className="h-5 w-5 text-cosmic-gold" />
                      <span className="font-medium">{t.nav.about}</span>
                    </Link>
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
