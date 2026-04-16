'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle } from 'lucide-react'
import Tooltip from './Tooltip'

interface FormFieldProps {
  label: string
  name: string
  value: string | number
  onChange: (value: any) => void
  type?: string
  inputMode?: string
  pattern?: string
  placeholder?: string
  error?: string
  success?: boolean
  required?: boolean
  tooltip?: string
  icon?: React.ComponentType<{ className?: string }>
  step?: string
  min?: number
  max?: number
}

export default function FormField({
  label,
  name,
  value,
  onChange,
  type = 'text',
  inputMode,
  pattern,
  placeholder,
  error,
  success,
  required = false,
  tooltip,
  icon: Icon,
  step,
  min,
  max,
}: FormFieldProps) {
  const [touched, setTouched] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const showError = touched && error

  // Pour les champs date et time, permettre la saisie textuelle
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Arrêter la propagation pour empêcher les handlers globaux d'intercepter les touches
    // Cela permet notamment d'éviter que les raccourcis clavier n'interfèrent avec la saisie
    if (type === 'date' || type === 'time') {
      e.stopPropagation()
      // Ne pas appeler preventDefault() pour permettre la saisie normale
    }
  }

  // Convertir la saisie textuelle en format date/time si nécessaire
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value
    
    if (type === 'date' || type === 'time') {
      // Laisser le navigateur gérer complètement la conversion et la validation
      onChange(newValue)
    } else if (type === 'number') {
      const numValue = parseFloat(newValue) || 0
      onChange(numValue)
    } else {
      onChange(newValue)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-white/80 mb-2">
        {Icon && <Icon className="inline h-4 w-4 mr-1" />}
        {label}
        {required && <span className="text-eclipse-red ml-1">*</span>}
        {tooltip && (
          <Tooltip content={tooltip}>
            <span className="ml-1 text-cosmic-gold cursor-help">?</span>
          </Tooltip>
        )}
      </label>
      <div className="relative">
        <input
          type={type}
          name={name}
          value={value}
          inputMode={inputMode}
          pattern={pattern}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setTouched(true)
            setIsFocused(false)
          }}
          placeholder={placeholder}
          step={step}
          min={min}
          max={max}
          required={required}
          // Permettre la saisie au clavier pour les champs date et time
          // En utilisant inputMode, on force le clavier numérique sur mobile
          // mais on permet toujours la saisie au clavier sur desktop
          // S'assurer que le champ peut recevoir toutes les touches
          autoComplete={type === 'date' ? 'bday' : type === 'time' ? 'off' : undefined}
          className={`
            w-full px-4 py-2 rounded-lg bg-white/10 border text-white placeholder-white/50
            focus:outline-none focus:ring-2 transition
            ${showError 
              ? 'border-eclipse-red focus:ring-eclipse-red' 
              : success 
              ? 'border-aurora-teal focus:ring-aurora-teal' 
              : 'border-white/20 focus:ring-cosmic-pink'
            }
          `}
          aria-invalid={showError ? 'true' : 'false'}
          aria-describedby={showError ? `${name}-error` : undefined}
        />
        <AnimatePresence>
          {showError && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <AlertCircle className="h-5 w-5 text-eclipse-red" />
            </motion.div>
          )}
          {success && !showError && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <CheckCircle className="h-5 w-5 text-aurora-teal" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {showError && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          id={`${name}-error`}
          className="mt-1 text-sm text-eclipse-red flex items-center gap-1"
          role="alert"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </motion.p>
      )}
    </div>
  )
}
