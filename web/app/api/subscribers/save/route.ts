import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, language, source, stripeCustomerId } = await request.json()

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Créer ou mettre à jour le subscriber
    const { data, error } = await supabase
      .from('subscribers')
      .upsert(
        {
          email: email.toLowerCase().trim(),
          first_name: firstName || null,
          language: language || 'fr',
          source: source || 'manual',
          stripe_customer_id: stripeCustomerId || null,
          subscribed_to_newsletter: true,
          subscribed_to_product_updates: true,
          subscribed_to_promotions: true,
          unsubscribed_at: null, // Réabonner si désabonné précédemment
        },
        {
          onConflict: 'email',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single()

    if (error) {
      console.error('[subscribers/save] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, subscriber: data })
  } catch (error) {
    console.error('[subscribers/save] Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

