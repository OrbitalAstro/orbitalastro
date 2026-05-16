import { NextResponse } from 'next/server'
import type { Session } from 'next-auth'
import { isJournalFreeAccessEmail } from '@/lib/journal-free-access'
import { getSupabaseAdmin } from '@/lib/supabase'

/** Identifiant produit Stripe / Supabase pour l'abonnement journal. */
export const JOURNAL_MONTHLY_PRODUCT_ID = 'journal-monthly'

const SUBSCRIPTION_PRODUCT_IDS = new Set([JOURNAL_MONTHLY_PRODUCT_ID, 'monthly'])

export function isJournalSubscriptionProduct(productId: string | null | undefined): boolean {
  return Boolean(productId && SUBSCRIPTION_PRODUCT_IDS.has(productId))
}

/** Bypass serveur (tests locaux) — aligné sur checkPayment côté client. */
export function shouldBypassJournalSubscriptionServer(): boolean {
  if (process.env.JOURNAL_SUBSCRIPTION_REQUIRED === 'false') return true
  if (process.env.NEXT_PUBLIC_DEV_SKIP_PAYMENT === 'true') {
    return process.env.NODE_ENV === 'development'
  }
  if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_DEV_SKIP_PAYMENT !== 'false') {
    return true
  }
  return false
}

export async function hasJournalAccess(email: string): Promise<boolean> {
  if (shouldBypassJournalSubscriptionServer()) return true

  const normalized = email.toLowerCase().trim()
  if (!normalized) return false

  if (isJournalFreeAccessEmail(normalized)) return true

  const supabase = getSupabaseAdmin()
  const { data: rows, error } = await supabase
    .from('user_access')
    .select('expires_at')
    .eq('customer_email', normalized)
    .in('product_id', [...SUBSCRIPTION_PRODUCT_IDS])

  if (error || !rows?.length) return false
  return rows.some((row) => !row.expires_at || new Date(row.expires_at).getTime() > Date.now())
}

export function journalSubscriptionPaywallResponse(): NextResponse {
  return NextResponse.json(
    {
      error: 'SUBSCRIPTION_REQUIRED',
      code: 'SUBSCRIPTION_REQUIRED',
      productId: JOURNAL_MONTHLY_PRODUCT_ID,
    },
    { status: 402 },
  )
}

export async function assertJournalSubscription(session: Session | null): Promise<NextResponse | null> {
  const email = session?.user?.email
  if (!email) {
    return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
  }
  const ok = await hasJournalAccess(email)
  if (!ok) return journalSubscriptionPaywallResponse()
  return null
}

/** Prolonge ou crée l'accès journal (webhooks Stripe). */
export async function extendJournalAccess(
  email: string,
  opts?: { paymentId?: string; months?: number },
): Promise<void> {
  const normalized = email.toLowerCase().trim()
  if (!normalized) return

  const months = opts?.months ?? 1
  const supabase = getSupabaseAdmin()
  const expiresAt = new Date()
  expiresAt.setMonth(expiresAt.getMonth() + months)

  const { data: existing } = await supabase
    .from('user_access')
    .select('expires_at')
    .eq('customer_email', normalized)
    .eq('product_id', JOURNAL_MONTHLY_PRODUCT_ID)
    .maybeSingle()

  let nextExpiry = expiresAt
  if (existing?.expires_at) {
    const current = new Date(existing.expires_at)
    if (current.getTime() > Date.now()) {
      current.setMonth(current.getMonth() + months)
      nextExpiry = current
    }
  }

  await supabase.from('user_access').upsert(
    {
      customer_email: normalized,
      product_id: JOURNAL_MONTHLY_PRODUCT_ID,
      payment_id: opts?.paymentId ?? null,
      expires_at: nextExpiry.toISOString(),
    },
    { onConflict: 'customer_email,product_id' },
  )
}

export async function revokeJournalAccess(email: string): Promise<void> {
  const normalized = email.toLowerCase().trim()
  if (!normalized) return
  const supabase = getSupabaseAdmin()
  await supabase
    .from('user_access')
    .update({ expires_at: new Date().toISOString() })
    .eq('customer_email', normalized)
    .in('product_id', [...SUBSCRIPTION_PRODUCT_IDS])
}
