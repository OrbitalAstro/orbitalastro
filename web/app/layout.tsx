import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Toaster from '@/components/Toaster'
import QuickActions from '@/components/QuickActions'
import Navigation from '@/components/Navigation'
import { ErrorBoundary } from '@/components/ErrorBoundary'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'OrbitalAstro - Your Cosmic Blueprint Awaits',
  description: 'Professional-grade astrological calculations woven into mythopoetic narratives. Discover your natal chart, track transits, explore progressions, and hear the dialogue of your pre-incarnation.',
  keywords: 'astrology, natal chart, transits, progressions, solar return, birth chart, astrological calculations, cosmic blueprint',
  openGraph: {
    title: 'OrbitalAstro - Your Cosmic Blueprint',
    description: 'Where ancient wisdom meets modern precision',
    type: 'website',
    siteName: 'OrbitalAstro',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'OrbitalAstro - Your Cosmic Blueprint',
    description: 'Where ancient wisdom meets modern precision',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-body`} suppressHydrationWarning>
        <ErrorBoundary>
          <Providers>
            <Navigation />
            <main className="pt-16">
              {children}
            </main>
            <Toaster />
            <QuickActions />
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  )
}
