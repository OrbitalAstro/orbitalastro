'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { History, X, Clock, Trash2 } from 'lucide-react'
import { useChartHistory } from '@/lib/store'
import { useToast } from '@/lib/toast'

interface ChartHistoryProps {
  onLoadChart: (chart: any) => void
}

export default function ChartHistory({ onLoadChart }: ChartHistoryProps) {
  const { history, clearHistory, removeFromHistory } = useChartHistory()
  const [isOpen, setIsOpen] = useState(false)
  const toast = useToast()

  const handleLoad = (chart: any) => {
    onLoadChart(chart)
    setIsOpen(false)
    toast.success('Chart loaded from history')
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 p-4 bg-cosmic-pink rounded-full shadow-lg hover:shadow-xl transition z-40"
        aria-label="Open chart history"
      >
        <History className="h-6 w-6 text-white" />
        {history.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-cosmic-gold text-black text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {history.length}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-96 bg-black border-l border-white/10 z-50 overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-heading font-bold text-white flex items-center gap-2">
                    <History className="h-6 w-6 text-cosmic-gold" />
                    Chart History
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 hover:bg-white/10 rounded-lg transition"
                    aria-label="Close history"
                  >
                    <X className="h-5 w-5 text-white" />
                  </button>
                </div>

                {history.length === 0 ? (
                  <div className="text-center py-12 text-white/60">
                    <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No chart history yet</p>
                    <p className="text-sm mt-2">Calculated charts will appear here</p>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-end mb-4">
                      <button
                        onClick={() => {
                          if (confirm('Clear all chart history?')) {
                            clearHistory()
                            toast.info('History cleared')
                          }
                        }}
                        className="text-sm text-white/60 hover:text-white transition flex items-center gap-1"
                      >
                        <Trash2 className="h-4 w-4" />
                        Clear All
                      </button>
                    </div>
                    <div className="space-y-3">
                      {history.map((item) => (
                        <motion.div
                          key={item.id || Math.random().toString()}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-white/5 rounded-lg p-4 border border-white/10 hover:border-cosmic-gold/50 transition cursor-pointer"
                          onClick={() => handleLoad(item.chart)}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-white font-semibold">
                                <Clock className="h-4 w-4 text-white/60" />
                                {item.timestamp && new Date(item.timestamp).toLocaleString()}
                              </div>
                              {item.birthData && (
                                <div className="text-sm text-white/60 mt-1">
                                  {item.birthData.birth_date} {item.birthData.birth_time}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                removeFromHistory(item.id || '')
                                toast.info('Removed from history')
                              }}
                              className="p-1 hover:bg-white/10 rounded transition"
                              aria-label="Remove from history"
                            >
                              <X className="h-4 w-4 text-white/60" />
                            </button>
                          </div>
                          {item.chart?.planets?.sun && (
                            <div className="text-xs text-white/50 mt-2">
                              Sun: {item.chart.planets.sun.sign} • Asc: {item.chart.planets && Object.values(item.chart.planets).length > 0 ? (Object.values(item.chart.planets)[0] as any)?.sign || 'N/A' : 'N/A'}
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

