import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

async function sendEmailWithResend(args: {
  to: string[]
  subject: string
  html?: string
  text: string
  from: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not set')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: args.from,
      to: args.to,
      subject: args.subject,
      html: args.html || args.text,
      text: args.text,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Resend error (${response.status}): ${body || response.statusText}`)
  }

  const data = (await response.json().catch(() => null)) as null | { id?: string }
  return data?.id
}

export async function POST(request: NextRequest) {
  try {
    const { subject, text, html, language, newsletterOnly, productUpdatesOnly } = await request.json()

    if (!subject || !text) {
      return NextResponse.json({ error: 'Subject and text are required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()

    // Récupérer les abonnés
    let query = supabase
      .from('subscribers')
      .select('email, first_name, language')
      .is('unsubscribed_at', null)

    if (newsletterOnly) {
      query = query.eq('subscribed_to_newsletter', true)
    }

    if (productUpdatesOnly) {
      query = query.eq('subscribed_to_product_updates', true)
    }

    if (language) {
      query = query.eq('language', language)
    }

    const { data: subscribers, error } = await query

    if (error) {
      console.error('[newsletter/send] Supabase error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!subscribers || subscribers.length === 0) {
      return NextResponse.json({ error: 'No subscribers found' }, { status: 400 })
    }

    // Envoyer les emails par batch (Resend limite à 50 destinataires par requête)
    const batchSize = 50
    const batches: string[][] = []
    for (let i = 0; i < subscribers.length; i += batchSize) {
      batches.push(subscribers.slice(i, i + batchSize).map((s) => s.email))
    }

    const from = process.env.RESEND_FROM || 'OrbitalAstro <noreply@orbitalastro.ca>'
    const results: Array<{ batch: number; success: boolean; count: number; error?: string }> = []

    for (let i = 0; i < batches.length; i++) {
      try {
        const resendId = await sendEmailWithResend({
          to: batches[i],
          subject,
          text,
          html,
          from,
        })

        // Mettre à jour last_email_sent_at pour tous les destinataires de ce batch
        await supabase
          .from('subscribers')
          .update({ last_email_sent_at: new Date().toISOString() })
          .in('email', batches[i])

        results.push({ batch: i + 1, success: true, count: batches[i].length })
        console.log(`[newsletter/send] Batch ${i + 1}/${batches.length} sent: ${batches[i].length} emails, resendId: ${resendId}`)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        results.push({ batch: i + 1, success: false, count: batches[i].length, error: message })
        console.error(`[newsletter/send] Batch ${i + 1} failed:`, message)
      }
    }

    const totalSent = results.filter((r) => r.success).reduce((sum, r) => sum + r.count, 0)
    const totalFailed = results.filter((r) => !r.success).reduce((sum, r) => sum + r.count, 0)

    return NextResponse.json({
      ok: true,
      totalSubscribers: subscribers.length,
      totalSent,
      totalFailed,
      batches: results,
    })
  } catch (error) {
    console.error('[newsletter/send] Error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

