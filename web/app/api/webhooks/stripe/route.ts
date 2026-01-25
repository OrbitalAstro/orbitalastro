import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'

function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set')
  }
  return new Stripe(secretKey, {
    apiVersion: '2024-11-20.acacia',
  })
}

// Vérifier la signature du webhook Stripe
async function verifyWebhookSignature(
  request: NextRequest,
  stripe: Stripe
): Promise<Stripe.Event | null> {
  const body = await request.text()
  const signature = headers().get('stripe-signature')

  if (!signature) {
    return null
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    )
    return event
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return null
  }
}

// Enregistrer un paiement dans la base de données
async function recordPayment(session: Stripe.Checkout.Session) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials not configured')
    return
  }

  try {
    const productId = session.metadata?.productId || 'unknown'
    const amount = session.amount_total ? session.amount_total / 100 : 0 // Convertir de centimes
    const currency = session.currency || 'cad'

    const response = await fetch(`${supabaseUrl}/rest/v1/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        stripe_session_id: session.id,
        stripe_customer_id: session.customer as string || null,
        customer_email: session.customer_email || session.customer_details?.email || '',
        product_id: productId,
        amount_paid: amount,
        currency: currency,
        status: session.payment_status === 'paid' ? 'paid' : 'pending',
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Failed to record payment:', error)
    }
  } catch (error) {
    console.error('Error recording payment:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe()
    const event = await verifyWebhookSignature(request, stripe)

    if (!event) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Gérer les différents types d'événements
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        
        // Enregistrer le paiement dans la base de données
        await recordPayment(session)
        
        console.log('Payment recorded:', {
          sessionId: session.id,
          productId: session.metadata?.productId,
          email: session.customer_email,
        })
        break
      }

      case 'payment_intent.succeeded': {
        // Optionnel : gérer les paiements directs
        console.log('Payment intent succeeded:', event.data.object)
        break
      }

      case 'charge.refunded': {
        // Mettre à jour le statut en cas de remboursement
        const charge = event.data.object as Stripe.Charge
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (supabaseUrl && supabaseKey && charge.payment_intent) {
          // Trouver le paiement et le marquer comme remboursé
          // Note: Vous devrez peut-être stocker payment_intent_id dans la table payments
          console.log('Charge refunded:', charge.id)
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// GET pour vérifier que le webhook est configuré
export async function GET() {
  return NextResponse.json({ 
    message: 'Stripe webhook endpoint is active',
    note: 'Configure this URL in Stripe Dashboard: Webhooks → Add endpoint'
  })
}
