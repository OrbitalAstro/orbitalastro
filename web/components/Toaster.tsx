'use client'

import { AnimatePresence } from 'framer-motion'
import { useToastStore } from '@/lib/toast'
import Toast from './Toast'

export default function Toaster() {
  const toasts = useToastStore((state) => state.toasts)

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}




