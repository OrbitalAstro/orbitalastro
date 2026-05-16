import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Stripe from 'stripe'
import { authOptions } from '@/lib/auth-options'
import { getSupabaseAdmin } from '@/lib/supabase'

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not set')
  return new Stripe(secretKey, { apiVersion: '2024-11-20.acacia' })
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Non authentifié.' }, { status: 401 })
    }

    const email = session.user.email.toLowerCase().trim()
    const supabase = getSupabaseAdmin()
    const { data: payment } = await supabase
      .from('payments')
      .select('stripe_customer_id')
      .eq('customer_email', email)
      .not('stripe_customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let customerId = payment?.stripe_customer_id as string | undefined

    const stripe = getStripe()
    if (!customerId) {
      const customers = await stripe.customers.list({ email, limit: 1 })
      customerId = customers.data[0]?.id
    }

    if (!customerId) {
      return NextResponse.json(
        { error: 'Aucun client Stripe associé à ce compte.' },
        { status: 404 },
      )
    }

    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin
    const portal = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${origin.replace(/\/+$/, '')}/journal-pilot`,
    })

    return NextResponse.json({ url: portal.url })
  } catch (error) {
    console.error('[billing-portal]', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erreur inconnue' },
      { status: 500 },
    )
  }
}
