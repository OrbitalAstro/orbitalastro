import JournalPilotClient from './JournalPilotClient'

export const dynamic = 'force-dynamic'

/**
 * Pas de getServerSession ici : après connexion, le cookie JWT peut ne pas être
 * encore vu par le RSC, ce qui renvoie vers /auth/signin en boucle. L’accès est
 * contrôlé côté client (getSession) + routes /api/journal/* (getServerSession).
 */
export default function JournalPilotPage() {
  return <JournalPilotClient />
}
