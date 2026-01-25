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
    const email = searchParams.get('email')
    const productId = searchParams.get('productId')

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const stripe = getStripe()

    // Rechercher les sessions de checkout payées pour cet email
    // On cherche dans les 90 derniers jours
    const ninetyDaysAgo = Math.floor(Date.now() / 1000) - (90 * 24 * 60 * 60)
    
    const sessions = await stripe.checkout.sessions.list({
      limit: 100,
      customer_email: email,
      created: { gte: ninetyDaysAgo },
    })

    // Vérifier si une session payée correspond au produit demandé
    for (const session of sessions.data) {
      if (session.payment_status === 'paid' && session.metadata?.productId === productId) {
        return NextResponse.json({
          paid: true,
          productId: session.metadata.productId,
          sessionId: session.id,
        })
      }
    }

    return NextResponse.json({ paid: false })
  } catch (error) {
    console.error('Stripe email verification error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

