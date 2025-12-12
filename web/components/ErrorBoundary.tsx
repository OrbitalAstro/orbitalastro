'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-white/5 rounded-xl p-8 border border-white/10 backdrop-blur-sm text-center"
          >
            <AlertTriangle className="h-16 w-16 text-eclipse-red mx-auto mb-4" />
            <h2 className="text-2xl font-heading font-bold mb-2">Something Went Wrong</h2>
            <p className="text-white/70 mb-6">
              We encountered an error while processing your request. This might be a temporary issue.
            </p>
            {this.state.error && (
              <details className="text-left mb-6 text-sm text-white/60">
                <summary className="cursor-pointer mb-2">Error Details</summary>
                <pre className="bg-black/30 p-3 rounded overflow-auto">
                  {this.state.error.message}
                </pre>
              </details>
            )}
            <div className="flex gap-4 justify-center">
            <button
              onClick={this.handleReset}
              className="px-6 py-3 bg-cosmic-pink text-white rounded-lg font-semibold hover:bg-cosmic-pink/80 transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-cosmic-gold"
              aria-label="Try again"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
            <Link href="/dashboard">
              <button 
                className="px-6 py-3 bg-white/10 text-white rounded-lg font-semibold hover:bg-white/20 transition flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-cosmic-gold"
                aria-label="Go to dashboard"
              >
                <Home className="h-4 w-4" />
                Go Home
              </button>
            </Link>
            </div>
          </motion.div>
        </div>
      )
    }

    return this.props.children
  }
}

