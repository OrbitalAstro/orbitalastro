'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Home, Settings, BookOpen, Sparkles, Calendar, Command, TrendingUp, Zap, Wand2, MessageSquare, Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useKeyboardShortcuts } from '@/lib/keyboard'
import { useTranslation } from '@/lib/useTranslation'

interface QuickAction {
  id: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  action: () => void
  shortcut?: string
}

export default function QuickActions() {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')
  const router = useRouter()
  const t = useTranslation()

  const actions: QuickAction[] = [
    {
      id: 'dashboard',
      label: t.nav.dashboard,
      icon: Home,
      action: () => {
        router.push('/dashboard')
        setIsOpen(false)
      },
      shortcut: 'G D',
    },
    {
      id: 'transits',
      label: t.nav.transits,
      icon: Zap,
      action: () => {
        router.push('/transits')
        setIsOpen(false)
      },
      shortcut: 'G T',
    },
    {
      id: 'progressions',
      label: t.nav.progressions,
      icon: TrendingUp,
      action: () => {
        router.push('/progressions')
        setIsOpen(false)
      },
      shortcut: 'G P',
    },
    {
      id: 'rectification',
      label: t.nav.rectification,
      icon: Wand2,
      action: () => {
        router.push('/rectification')
        setIsOpen(false)
      },
      shortcut: 'G R',
    },
    {
      id: 'stories',
      label: t.nav.stories,
      icon: BookOpen,
      action: () => {
        router.push('/stories')
        setIsOpen(false)
      },
      shortcut: 'G S',
    },
    {
      id: 'dialogues',
      label: t.nav.dialogues,
      icon: Sparkles,
      action: () => {
        router.push('/dialogues')
        setIsOpen(false)
      },
      shortcut: 'G D G',
    },
    {
      id: 'reading-2026',
      label: t.nav.reading2026,
      icon: Calendar,
      action: () => {
        router.push('/reading-2026')
        setIsOpen(false)
      },
      shortcut: 'G 2 6',
    },
    {
      id: 'saint-valentin',
      label: t.nav.valentine,
      icon: Heart,
      action: () => {
        router.push('/saint-valentin')
        setIsOpen(false)
      },
      shortcut: 'G V',
    },
    {
      id: 'chat',
      label: t.nav.chat,
      icon: MessageSquare,
      action: () => {
        router.push('/chat')
        setIsOpen(false)
      },
      shortcut: 'G /',
    },
    {
      id: 'settings',
      label: t.nav.settings,
      icon: Settings,
      action: () => {
        router.push('/settings')
        setIsOpen(false)
      },
      shortcut: 'G ,',
    },
    {
      id: 'about',
      label: t.nav.about,
      icon: Calendar,
      action: () => {
        router.push('/about')
        setIsOpen(false)
      },
      shortcut: 'G A',
    },
  ]

  const filteredActions = actions.filter((action) =>
    action.label.toLowerCase().includes(search.toLowerCase())
  )

  useKeyboardShortcuts([
    {
      key: 'k',
      meta: true,
      handler: () => setIsOpen(true),
    },
    {
      key: 'Escape',
      handler: () => setIsOpen(false),
    },
  ])

  useEffect(() => {
    if (isOpen) {
      const input = document.getElementById('quick-actions-search')
      input?.focus()
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="fixed top-1/4 left-1/2 -translate-x-1/2 w-full max-w-2xl z-50"
          >
            <div className="bg-black border border-white/20 rounded-xl shadow-2xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 border-b border-white/10">
                <Search className="h-5 w-5 text-white/60" />
                <input
                  id="quick-actions-search"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t.tooltips.searchActions}
                  className="flex-1 bg-transparent text-white placeholder-white/50 outline-none"
                />
                <kbd className="px-2 py-1 bg-white/10 rounded text-xs text-white/60 flex items-center gap-1">
                  <Command className="h-3 w-3" />
                  K
                </kbd>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {filteredActions.length === 0 ? (
                  <div className="p-8 text-center text-white/60">
                    {t.quickActions.noResults}
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredActions.map((action, idx) => (
                      <motion.button
                        key={action.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        onClick={action.action}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition text-left"
                      >
                        <action.icon className="h-5 w-5 text-cosmic-gold" />
                        <span className="flex-1 text-white">{action.label}</span>
                        {action.shortcut && (
                          <kbd className="px-2 py-1 bg-white/10 rounded text-xs text-white/60">
                            {action.shortcut}
                          </kbd>
                        )}
                      </motion.button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
