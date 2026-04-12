import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import JournalPilotClient from './JournalPilotClient'

export const dynamic = 'force-dynamic'

export default async function JournalPilotPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/auth/signin?callbackUrl=/journal-pilot')
  }

  return <JournalPilotClient />
}
