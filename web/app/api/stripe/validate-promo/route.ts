import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Initialiser Stripe seulement au runtime, pas au build time
function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(secretKey, {
    apiVersion: '2024-11-20.acacia',
  })
}

export async function POST(request: NextRequest) {
  try {
    const { promoCode, productId } = await request.json()

    if (!promoCode) {
      return NextResponse.json(
        { error: 'Promo code is required' },
        { status: 400 }
      )
    }

    // Vérifier le code promo dans Stripe
    // Les codes promo doivent être créés dans Stripe Dashboard comme "Coupons"
    const stripe = getStripe()
    try {
      const coupon = await stripe.coupons.retrieve(promoCode.toUpperCase())
      
      // Vérifier si le coupon est valide et applicable au produit
      if (coupon.valid && !coupon.redeem_by || (coupon.redeem_by && coupon.redeem_by > Date.now() / 1000)) {
        return NextResponse.json({
          valid: true,
          discount: coupon.percent_off || coupon.amount_off,
          discountType: coupon.percent_off ? 'percent' : 'amount',
        })
      } else {
        return NextResponse.json({
          valid: false,
          error: 'Code promo expiré ou invalide',
        })
      }
    } catch (error) {
      // Code promo non trouvé dans Stripe
      // TODO: Vérifier dans votre base de données si vous avez des codes promo personnalisés
      return NextResponse.json({
        valid: false,
        error: 'Code promo non trouvé',
      })
    }
  } catch (error) {
    console.error('Promo code validation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

