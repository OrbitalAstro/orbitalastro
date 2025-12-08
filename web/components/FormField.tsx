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
  const showError = touched && error

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
          onChange={(e) => {
            const newValue = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
            onChange(newValue)
          }}
          onBlur={() => setTouched(true)}
          placeholder={placeholder}
          step={step}
          min={min}
          max={max}
          required={required}
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
          aria-invalid={showError}
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

