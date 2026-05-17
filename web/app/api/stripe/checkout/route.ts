import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import Stripe from 'stripe'
import { authOptions } from '@/lib/auth-options'
import { cartIsMixed, isRecipientComplete, type CartLine } from '@/lib/cart-rules'
import { getProductById } from '@/lib/stripe-catalog'
import { getPriceIdForProduct, isSubscriptionProductId } from '@/lib/stripe-price-ids'
import { cartLinesToStripeMetadata } from '@/lib/cart-stripe-metadata'
import type { CartRecipientProfile } from '@/lib/cart-types'

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

function parseRecipient(raw: unknown): CartRecipientProfile | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const recipient: CartRecipientProfile = {
    label: String(r.label || r.display_name || 'Destinataire'),
    display_name: String(r.display_name || ''),
    birth_date: String(r.birth_date || ''),
    birth_time: String(r.birth_time || ''),
    birth_place: String(r.birth_place || ''),
    latitude: Number(r.latitude) || 0,
    longitude: Number(r.longitude) || 0,
    timezone: String(r.timezone || 'UTC'),
    email: typeof r.email === 'string' ? r.email : undefined,
  }
  if (!recipient.label) return null
  return isRecipientComplete(recipient) ? recipient : null
}

function normalizeCartLines(body: { cartLines?: unknown }): CartLine[] | { error: string } {
  if (!Array.isArray(body.cartLines) || body.cartLines.length === 0) {
    return {
      error:
        'Panier vide. Configurez un produit depuis sa page (informations de naissance), puis ajoutez au panier.',
    }
  }

  const lines: CartLine[] = []
  for (const raw of body.cartLines) {
    if (!raw || typeof raw !== 'object') continue
    const o = raw as Record<string, unknown>
    const id = typeof o.id === 'string' ? o.id : ''
    const productId = typeof o.productId === 'string' ? o.productId : ''
    const recipient = parseRecipient(o.recipient)
    if (!id || !productId || !getProductById(productId) || !recipient) {
      return { error: 'Une ligne du panier est incomplète ou invalide.' }
    }
    lines.push({ id, productId, recipient })
  }

  if (lines.length === 0) return { error: 'Panier vide.' }
  return lines
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

    if (cartIsMixed(lines)) {
      return NextResponse.json(
        {
          error:
            'Les abonnements et les achats à la pièce doivent être payés séparément.',
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
      lineItems.push({ price: actualPriceId, quantity: 1 })
    }

    const baseUrl = resolveBaseUrl(request)
    const stripe = getStripe()

    for (const item of lineItems) {
      if (item.price) await stripe.prices.retrieve(String(item.price))
    }

    const recipientMeta = cartLinesToStripeMetadata(lines)

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      mode: isSubscription ? 'subscription' : 'payment',
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
        // ignore
      }
    }

    if (isSubscription) {
      sessionConfig.allow_promotion_codes = true
      sessionConfig.subscription_data = {
        metadata: { productId: lines[0].productId, productIds: lines.map((l) => l.productId).join(',') },
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
