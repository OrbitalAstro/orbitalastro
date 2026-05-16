import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { isJournalFreeAccessEmail } from '@/lib/journal-free-access'
import {
  hasJournalAccess,
  JOURNAL_MONTHLY_PRODUCT_ID,
  shouldBypassJournalSubscriptionServer,
} from '@/lib/journal-subscription'
import { isJournalMonthlyCheckoutConfigured } from '@/lib/stripe-journal-price'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }

  const email = session.user.email
  const freeAccess = isJournalFreeAccessEmail(email)
  const subscribed = await hasJournalAccess(email)

  return NextResponse.json({
    subscribed,
    freeAccess,
    productId: JOURNAL_MONTHLY_PRODUCT_ID,
    checkoutConfigured: isJournalMonthlyCheckoutConfigured(),
    bypass: shouldBypassJournalSubscriptionServer(),
  })
}
