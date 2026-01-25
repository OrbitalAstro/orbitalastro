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
      
      // Calculer la quantité totale achetée
      let quantity = 1 // Par défaut, 1 unité
      if (session.line_items && 'data' in session.line_items) {
        // Si line_items est une liste
        quantity = session.line_items.data.reduce((sum, item) => sum + (item.quantity || 1), 0)
      } else if (session.line_items && Array.isArray(session.line_items)) {
        // Si line_items est un tableau
        quantity = session.line_items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)
      }
      
      // Récupérer le nombre de générations depuis les métadonnées
      const generations = parseInt(session.metadata?.generations || '0', 10)
      
      return NextResponse.json({
        paid: true,
        productId,
        customerEmail: session.customer_email,
        quantity, // Nombre d'unités achetées
        generations, // Nombre de générations déjà effectuées
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

