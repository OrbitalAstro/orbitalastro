import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(secretKey, {
    apiVersion: '2024-11-20.acacia',
  })
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items'],
    })

    if (session.payment_status === 'paid') {
      const productId = session.metadata?.productId || 'unknown'
      const productIdsRaw = session.metadata?.productIds || productId
      const productIds = productIdsRaw
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)

      let quantity = 1
      if (session.line_items && 'data' in session.line_items) {
        quantity = session.line_items.data.reduce((sum, item) => sum + (item.quantity || 1), 0)
      }

      const generationsUsed = parseInt(session.metadata?.generationsUsed || '0', 10)

      return NextResponse.json({
        paid: true,
        productId,
        productIds: productIds.length > 0 ? productIds : [productId],
        customerEmail: session.customer_email,
        quantity,
        generationsUsed,
        sessionId: session.id,
      })
    }

    return NextResponse.json({ paid: false })
  } catch (error) {
    console.error('Stripe session verification error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

