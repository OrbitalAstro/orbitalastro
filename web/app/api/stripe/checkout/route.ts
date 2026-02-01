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
    const { priceId, productId, email, promoCode } = await request.json()

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      )
    }

    // Déterminer le type de paiement (one-time ou subscription)
    const isSubscription = productId === 'monthly' || productId === 'yearly'
    
    // Déterminer l'URL de base pour les redirections
    // Utiliser NEXT_PUBLIC_APP_URL si défini, sinon utiliser l'origin de la requête
    let baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    
    // Corriger les URLs invalides UNIQUEMENT en développement local
    // Ne pas forcer localhost:3000 en production
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         baseUrl.includes('localhost') || 
                         baseUrl.includes('127.0.0.1') ||
                         baseUrl.includes('0.0.0.0')
    
    if (isDevelopment) {
      // En développement, corriger les URLs invalides vers localhost:3000
      if (baseUrl.includes('0.0.0.0') || baseUrl.includes('127.0.0.1') || baseUrl.includes(':8080')) {
        baseUrl = 'http://localhost:3000'
      }
    }
    
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: isSubscription ? 'subscription' : 'payment', // Abonnement ou paiement unique
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: `${baseUrl}/pricing?success=true&product=${productId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pricing?canceled=true`,
      metadata: {
        productId: productId || 'unknown',
        promoCode: promoCode || '',
      },
      // Collecte du consentement marketing et des termes et conditions dans Stripe Checkout
      consent_collection: {
        marketing_consent: 'required', // Case à cocher obligatoire pour recevoir les promotions
        terms_of_service: 'required', // Case à cocher obligatoire pour accepter les termes et conditions
      },
      // Message d'avertissement pour paiement réel
      custom_text: {
        submit: {
          message: '⚠️ Ce paiement est final et définitif. Vous serez débité immédiatement.',
        },
      },
      // Forcer l'envoi automatique du reçu par email pour les paiements uniques
      ...(email && !isSubscription ? {
        payment_intent_data: {
          receipt_email: email,
        },
      } : {}),
    }

    // Obtenir l'instance Stripe
    const stripe = getStripe()

    // Pour les paiements uniques, appliquer le code promo si fourni
    if (!isSubscription && promoCode) {
      // Vérifier que le code promo existe dans Stripe
      try {
        // D'abord, essayer de trouver un code promotionnel
        const promotionCodes = await stripe.promotionCodes.list({
          code: promoCode,
          limit: 1,
        })
        if (promotionCodes.data.length > 0) {
          sessionConfig.discounts = [{
            promotion_code: promotionCodes.data[0].id,
          }]
        } else {
          // Sinon, chercher parmi tous les codes promotionnels (peut-être casse différente)
          const allPromoCodes = await stripe.promotionCodes.list({ limit: 100 })
          const matchingPromoCode = allPromoCodes.data.find(
            (pc) => pc.code?.toUpperCase() === promoCode.toUpperCase()
          )
          if (matchingPromoCode) {
            sessionConfig.discounts = [{
              promotion_code: matchingPromoCode.id,
            }]
          } else {
            // En dernier recours, chercher par nom de coupon
            const coupons = await stripe.coupons.list({ limit: 100 })
            const matchingCoupon = coupons.data.find(
              (c) => c.name?.toUpperCase() === promoCode.toUpperCase() || 
                     c.id.toUpperCase() === promoCode.toUpperCase()
            )
            if (matchingCoupon) {
              sessionConfig.discounts = [{
                coupon: matchingCoupon.id,
              }]
            }
          }
        }
      } catch (error) {
        console.warn('Erreur lors de la vérification du code promo:', error)
        // Continuer sans le code promo si erreur
      }
    }

    // Pour les abonnements, permettre les codes promo
    if (isSubscription) {
      sessionConfig.allow_promotion_codes = true
    }

    // Vérifier que le Price ID existe avant de créer la session
    try {
      await stripe.prices.retrieve(priceId)
    } catch (error) {
      console.error('Invalid Price ID:', priceId, error)
      return NextResponse.json(
        { 
          error: `Le Price ID "${priceId}" n'existe pas dans Stripe. Veuillez vérifier la configuration du produit "${productId}".` 
        },
        { status: 400 }
      )
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    
    // Message d'erreur plus clair pour l'utilisateur
    let errorMessage = 'Une erreur est survenue lors de l\'initialisation du paiement.'
    if (error instanceof Error) {
      if (error.message.includes('No such price')) {
        errorMessage = `Le produit "${productId}" n'est pas correctement configuré. Veuillez contacter le support.`
      } else {
        errorMessage = error.message
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
