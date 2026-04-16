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
    const productId = searchParams.get('product_id')

    if (!productId) {
      return NextResponse.json(
        { error: 'product_id is required' },
        { status: 400 }
      )
    }

    const stripe = getStripe()

    // Récupérer tous les prix pour ce produit
    const prices = await stripe.prices.list({
      product: productId,
      limit: 100,
    })

    if (prices.data.length === 0) {
      return NextResponse.json(
        { error: 'No prices found for this product' },
        { status: 404 }
      )
    }

    // Trouver le prix actif de 9.99 CAD (pour Lecture 2026)
    const activePrice = prices.data.find(
      (p) => p.active && p.unit_amount === 999 && p.currency === 'cad' && p.type === 'one_time'
    ) || prices.data.find((p) => p.active)

    return NextResponse.json({
      productId,
      prices: prices.data.map((p) => ({
        id: p.id,
        amount: p.unit_amount / 100,
        currency: p.currency,
        type: p.type,
        active: p.active,
        recurring: p.recurring,
      })),
      recommendedPriceId: activePrice?.id,
    })
  } catch (error) {
    console.error('Get price ID error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

