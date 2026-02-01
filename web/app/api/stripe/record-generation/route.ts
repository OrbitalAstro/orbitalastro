import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { getSupabaseAdmin } from '@/lib/supabase'

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(secretKey, {
    apiVersion: '2024-11-20.acacia',
  })
}

type RateBucket = { count: number; resetAt: number }

function checkRateLimit(key: string, limit: number, windowMs: number) {
  const g = globalThis as unknown as { __orbitalastroGenRate?: Map<string, RateBucket> }
  if (!g.__orbitalastroGenRate) g.__orbitalastroGenRate = new Map()
  const now = Date.now()
  const entry = g.__orbitalastroGenRate.get(key)

  if (!entry || entry.resetAt <= now) {
    g.__orbitalastroGenRate.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count += 1
  g.__orbitalastroGenRate.set(key, entry)
  return { allowed: true, remaining: limit - entry.count }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, productId, sessionId: clientSessionId } = body

    if (!email || !productId) {
      return NextResponse.json(
        { error: 'Email and productId are required' },
        { status: 400 }
      )
    }

    const stripe = getStripe()
    const supabase = getSupabaseAdmin()
    const ninetyDaysAgo = Math.floor(Date.now() / 1000) - (90 * 24 * 60 * 60)

    let targetSession: Stripe.Checkout.Session | null = null
    let quantityPurchased = 0

    // Prioriser session_id si fourni par le client
    if (clientSessionId) {
      try {
        const session = await stripe.checkout.sessions.retrieve(clientSessionId, { expand: ['line_items'] })
        if (session.payment_status === 'paid' && session.metadata?.productId === productId) {
          let currentQuantity = 1
          if (session.line_items && 'data' in session.line_items) {
            currentQuantity = session.line_items.data.reduce((sum, item) => sum + (item.quantity || 1), 0)
          } else if (session.line_items && Array.isArray(session.line_items)) {
            currentQuantity = session.line_items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)
          }
          const generationsUsed = parseInt(session.metadata?.generationsUsed || '0', 10)
          if (generationsUsed < currentQuantity) {
            targetSession = session
            quantityPurchased = currentQuantity
          }
        }
      } catch (err) {
        console.warn(`[record-generation] Could not retrieve session ${clientSessionId}:`, err)
      }
    }

    // Si pas de targetSession trouvé via clientSessionId, chercher par email
    if (!targetSession) {
      const sessions = await stripe.checkout.sessions.list({
        limit: 100,
        customer_email: email,
        created: { gte: ninetyDaysAgo },
      })

      for (const session of sessions.data) {
        if (session.payment_status === 'paid' && session.metadata?.productId === productId) {
          let currentQuantity = 1
          try {
            const sessionDetails = await stripe.checkout.sessions.retrieve(session.id, {
              expand: ['line_items'],
            })
            if (sessionDetails.line_items && 'data' in sessionDetails.line_items) {
              currentQuantity = sessionDetails.line_items.data.reduce((sum, item) => sum + (item.quantity || 1), 0)
            } else if (sessionDetails.line_items && Array.isArray(sessionDetails.line_items)) {
              currentQuantity = sessionDetails.line_items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)
            }
          } catch (err) {
            console.error(`[record-generation] Error retrieving line items for session ${session.id}:`, err)
          }

          const generationsUsed = parseInt(session.metadata?.generationsUsed || '0', 10)
          if (generationsUsed < currentQuantity) {
            targetSession = session
            quantityPurchased = currentQuantity
            break // Trouvé une session avec générations restantes
          }
        }
      }
    }

    if (!targetSession) {
      return NextResponse.json({ error: 'No available generations found for this product and email.' }, { status: 403 })
    }

    const currentGenerationsUsed = parseInt(targetSession.metadata?.generationsUsed || '0', 10)
    const newGenerationsUsed = currentGenerationsUsed + 1

    // Mettre à jour les métadonnées Stripe
    await stripe.checkout.sessions.update(targetSession.id, {
      metadata: {
        ...targetSession.metadata,
        generationsUsed: newGenerationsUsed.toString(),
      },
    })

    const quantityRemaining = quantityPurchased - newGenerationsUsed

    // Enregistrer la génération dans Supabase
    try {
      // Trouver le payment_id correspondant
      let paymentId: string | null = null
      const { data: payment } = await supabase
        .from('payments')
        .select('id')
        .eq('stripe_session_id', targetSession.id)
        .single()

      paymentId = payment?.id || null

      await supabase.from('generations').insert({
        customer_email: email.toLowerCase().trim(),
        product_id: productId,
        stripe_session_id: targetSession.id,
        payment_id: paymentId,
        content_preview: null,
        metadata: {
          quantityPurchased,
          generationsUsed: newGenerationsUsed,
          quantityRemaining,
        },
      })

      console.log('[record-generation] Generation recorded in database')
    } catch (dbError) {
      // Ne pas faire échouer la requête si l'enregistrement DB échoue
      console.error('[record-generation] Failed to record generation in database:', dbError)
    }

    return NextResponse.json({
      ok: true,
      productId,
      quantityPurchased,
      generationsUsed: newGenerationsUsed,
      quantityRemaining,
    })
  } catch (error) {
    console.error('[record-generation] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

