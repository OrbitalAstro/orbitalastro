import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const newsletterOnly = searchParams.get('newsletter') === 'true'
    const productUpdatesOnly = searchParams.get('product_updates') === 'true'
    const language = searchParams.get('language') // 'fr', 'en', 'es'

    const supabase = getSupabaseAdmin()

    let query = supabase
      .from('subscribers')
      .select('email, first_name, language, subscribed_to_newsletter, subscribed_to_product_updates, subscribed_to_promotions')
      .is('unsubscribed_at', null) // Seulement les abonnés actifs

    if (newsletterOnly) {
      query = query.eq('subscribed_to_newsletter', true)
    }

    if (productUpdatesOnly) {
      query = query.eq('subscribed_to_product_updates', true)
    }

    if (language) {
      query = query.eq('language', language)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('[subscribers/list] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, subscribers: data || [], count: data?.length || 0 })
  } catch (error) {
    console.error('[subscribers/list] Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

