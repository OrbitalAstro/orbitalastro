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
    // Calculer la quantité totale achetée pour ce produit
    let totalQuantity = 0
    let lastSessionId: string | null = null
    
    for (const session of sessions.data) {
      if (session.payment_status === 'paid' && session.metadata?.productId === productId) {
        lastSessionId = session.id
        
        // Récupérer les détails de la session pour obtenir la quantité
        try {
          const sessionDetails = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ['line_items'],
          })
          
          let quantity = 1
          if (sessionDetails.line_items && 'data' in sessionDetails.line_items) {
            quantity = sessionDetails.line_items.data.reduce((sum, item) => sum + (item.quantity || 1), 0)
          } else if (sessionDetails.line_items && Array.isArray(sessionDetails.line_items)) {
            quantity = sessionDetails.line_items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0)
          }
          
          totalQuantity += quantity
        } catch (err) {
          console.error(`Error retrieving session ${session.id}:`, err)
          // En cas d'erreur, compter 1 unité par défaut
          totalQuantity += 1
        }
      }
    }

    if (totalQuantity > 0) {
      return NextResponse.json({
        paid: true,
        productId,
        quantity: totalQuantity, // Nombre total d'unités achetées
        sessionId: lastSessionId,
      })
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

