import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'À propos - OrbitalAstro',
  description: 'Découvrez l\'équipe derrière OrbitalAstro et notre mission de rendre l\'astrologie accessible et bienveillante.',
  openGraph: {
    title: 'À propos - OrbitalAstro',
    description: 'Découvrez l\'équipe derrière OrbitalAstro et notre mission de rendre l\'astrologie accessible et bienveillante.',
  },
  twitter: {
    title: 'À propos - OrbitalAstro',
    description: 'Découvrez l\'équipe derrière OrbitalAstro et notre mission de rendre l\'astrologie accessible et bienveillante.',
  },
}

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

