import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Stripe from 'stripe'
import { authOptions } from '@/lib/auth-options'
import { normalizeCartLines } from '@/lib/cart-checkout-normalize'
import {
  buildSubscriptionCheckoutMetadata,
  getStripeCheckoutMode,
  resolveCheckoutPriceIds,
  validateCheckoutAuth,
} from '@/lib/cart-checkout-plan'
import { cartLinesToStripeMetadata } from '@/lib/cart-stripe-metadata'

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) throw new Error('STRIPE_SECRET_KEY is not set')
  return new Stripe(secretKey, { apiVersion: '2024-11-20.acacia' })
}

function resolveBaseUrl(request: NextRequest): string {
  let baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const isDevelopment =
    process.env.NODE_ENV === 'development' ||
    baseUrl.includes('localhost') ||
    baseUrl.includes('127.0.0.1') ||
    baseUrl.includes('0.0.0.0')
  if (
    isDevelopment &&
    (baseUrl.includes('0.0.0.0') || baseUrl.includes('127.0.0.1') || baseUrl.includes(':8080'))
  ) {
    baseUrl = 'http://localhost:3000'
  }
  return baseUrl
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { priceId: priceIdFromClient, email, promoCode } = body

    const normalized = normalizeCartLines(body)
    if ('error' in normalized) {
      return NextResponse.json({ error: normalized.error }, { status: 400 })
    }
    const lines = normalized

    const sessionAuth = await getServerSession(authOptions)
    const checkoutEmail =
      (typeof email === 'string' && email.trim()) || sessionAuth?.user?.email || undefined

    const authError = validateCheckoutAuth(lines, sessionAuth?.user?.email)
    if (authError) {
      return NextResponse.json({ error: authError }, { status: 401 })
    }

    const priceResult = resolveCheckoutPriceIds(lines, priceIdFromClient)
    if ('error' in priceResult) {
      return NextResponse.json({ error: priceResult.error }, { status: 400 })
    }

    const checkoutMode = getStripeCheckoutMode(lines)
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = priceResult.priceIds.map(
      (price) => ({ price, quantity: 1 }),
    )

    const baseUrl = resolveBaseUrl(request)
    const stripe = getStripe()

    for (const item of lineItems) {
      if (item.price) await stripe.prices.retrieve(String(item.price))
    }

    const recipientMeta = cartLinesToStripeMetadata(lines)

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: checkoutMode,
      payment_method_types: ['card'],
      line_items: lineItems,
      customer_email: checkoutEmail,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout?canceled=1`,
      metadata: {
        ...recipientMeta,
        promoCode: promoCode || '',
      },
      consent_collection: {
        terms_of_service: 'required',
      },
      custom_text: {
        terms_of_service_acceptance: {
          message:
            'J’accepte les conditions générales d’OrbitalAstro (termes et politique de confidentialité).',
        },
        submit: {
          message: '⚠️ Paiement final. Vérifiez vos informations de carte avant de confirmer.',
        },
      },
      ...(checkoutEmail && checkoutMode === 'payment'
        ? { payment_intent_data: { receipt_email: checkoutEmail } }
        : {}),
    }

    if (checkoutMode === 'payment' && promoCode) {
      try {
        const promotionCodes = await stripe.promotionCodes.list({ code: promoCode, limit: 1 })
        if (promotionCodes.data.length > 0) {
          sessionConfig.discounts = [{ promotion_code: promotionCodes.data[0].id }]
        }
      } catch {
        // ignore
      }
    }

    if (checkoutMode === 'subscription') {
      sessionConfig.allow_promotion_codes = true
      sessionConfig.subscription_data = {
        metadata: buildSubscriptionCheckoutMetadata(lines),
      }
    }

    let session: Stripe.Checkout.Session
    try {
      session = await stripe.checkout.sessions.create(sessionConfig)
    } catch (stripeErr) {
      const msg = stripeErr instanceof Error ? stripeErr.message : ''
      if (msg.includes('terms of service') || msg.includes('Terms of Service')) {
        return NextResponse.json(
          {
            error:
              'Configurez l’URL des termes et conditions dans le tableau de bord Stripe (Paramètres publics → Conditions d’utilisation), par ex. https://www.orbitalastro.ca/terms',
          },
          { status: 400 },
        )
      }
      throw stripeErr
    }

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de l'initialisation du paiement.",
      },
      { status: 500 },
    )
  }
}
