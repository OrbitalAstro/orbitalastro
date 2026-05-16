import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Stripe from 'stripe'
import { authOptions } from '@/lib/auth-options'
import { validateCheckoutConsent } from '@/lib/checkout-consent'
import { cartIsMixed, type CartLine } from '@/lib/cart-rules'
import { getProductById } from '@/lib/stripe-catalog'
import { getPriceIdForProduct, isSubscriptionProductId } from '@/lib/stripe-price-ids'

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

function normalizeItems(body: {
  items?: unknown
  productId?: string
  quantity?: number
}): CartLine[] | { error: string } {
  if (Array.isArray(body.items) && body.items.length > 0) {
    const lines: CartLine[] = []
    for (const raw of body.items) {
      if (!raw || typeof raw !== 'object') continue
      const productId = (raw as { productId?: string }).productId
      const quantity = Number((raw as { quantity?: number }).quantity) || 1
      if (!productId || !getProductById(productId)) {
        return { error: `Produit invalide dans le panier.` }
      }
      lines.push({ productId, quantity: Math.max(1, Math.min(quantity, 10)) })
    }
    if (lines.length === 0) return { error: 'Panier vide.' }
    return lines
  }

  if (body.productId && getProductById(body.productId)) {
    return [{ productId: body.productId, quantity: Math.max(1, Number(body.quantity) || 1) }]
  }

  return { error: 'Panier vide ou produit invalide.' }
}

export async function POST(request: NextRequest) {
  let productIdsLabel = ''
  try {
    const body = await request.json()
    const {
      priceId: priceIdFromClient,
      email,
      promoCode,
      acceptTerms,
      confirmBirthData,
    } = body

    const consentError = validateCheckoutConsent({ acceptTerms, confirmBirthData })
    if (consentError) {
      return NextResponse.json({ error: consentError }, { status: 400 })
    }

    const normalized = normalizeItems(body)
    if ('error' in normalized) {
      return NextResponse.json({ error: normalized.error }, { status: 400 })
    }
    const lines = normalized

    if (cartIsMixed(lines)) {
      return NextResponse.json(
        {
          error:
            'Les abonnements et les achats à la pièce doivent être payés séparément. Videz le panier ou retirez un type de produit.',
        },
        { status: 400 },
      )
    }

    const sessionAuth = await getServerSession(authOptions)
    const checkoutEmail =
      (typeof email === 'string' && email.trim()) || sessionAuth?.user?.email || undefined

    const isSubscription = lines.some((l) => isSubscriptionProductId(l.productId))
    if (isSubscription && !sessionAuth?.user?.email) {
      return NextResponse.json(
        { error: 'Connectez-vous pour souscrire au Journal pilote.' },
        { status: 401 },
      )
    }

    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
    for (const line of lines) {
      const actualPriceId = getPriceIdForProduct(line.productId) || priceIdFromClient
      if (!actualPriceId) {
        return NextResponse.json(
          { error: `Le produit « ${line.productId} » n'est pas configuré dans Stripe.` },
          { status: 400 },
        )
      }
      lineItems.push({ price: actualPriceId, quantity: line.quantity })
    }

    const productIds = lines.map((l) => l.productId)
    productIdsLabel = productIds.join(',')
    const primaryProductId = productIds[0]

    const baseUrl = resolveBaseUrl(request)
    const stripe = getStripe()

    for (const item of lineItems) {
      if (item.price) await stripe.prices.retrieve(String(item.price))
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: isSubscription ? 'subscription' : 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      customer_email: checkoutEmail,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout?canceled=1`,
      metadata: {
        productId: primaryProductId,
        productIds: productIdsLabel,
        promoCode: promoCode || '',
        acceptTerms: 'true',
        confirmBirthData: 'true',
        consentAt: new Date().toISOString(),
      },
      custom_text: {
        submit: {
          message:
            '⚠️ Ce paiement est final et définitif.\n\n📅 Votre date et heure de naissance exactes sont requises pour utiliser nos services astrologiques.',
        },
      },
      ...(checkoutEmail && !isSubscription
        ? { payment_intent_data: { receipt_email: checkoutEmail } }
        : {}),
    }

    if (!isSubscription && promoCode) {
      try {
        const promotionCodes = await stripe.promotionCodes.list({ code: promoCode, limit: 1 })
        if (promotionCodes.data.length > 0) {
          sessionConfig.discounts = [{ promotion_code: promotionCodes.data[0].id }]
        }
      } catch {
        // ignore promo errors
      }
    }

    if (isSubscription) {
      sessionConfig.allow_promotion_codes = true
      sessionConfig.subscription_data = {
        metadata: { productId: primaryProductId, productIds: productIdsLabel },
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)
    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error('Stripe checkout error:', error)
    let errorMessage = "Une erreur est survenue lors de l'initialisation du paiement."
    if (error instanceof Error) {
      if (error.message.includes('No such price')) {
        errorMessage = `Un produit du panier n'est pas correctement configuré. Contactez le support.`
      } else {
        errorMessage = error.message
      }
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
