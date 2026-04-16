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
  const { getSupabaseAdmin } = await import('@/lib/supabase')
  
  try {
    const supabase = getSupabaseAdmin()
    const productId = session.metadata?.productId || 'unknown'
    const amount = session.amount_total ? session.amount_total / 100 : 0 // Convertir de centimes
    const currency = session.currency || 'cad'
    const customerEmail = session.customer_email || session.customer_details?.email || ''
    const stripeCustomerId = typeof session.customer === 'string' ? session.customer : null

    // Enregistrer le paiement
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .upsert(
        {
          stripe_session_id: session.id,
          stripe_customer_id: stripeCustomerId,
          customer_email: customerEmail,
          product_id: productId,
          amount_paid: amount,
          currency: currency,
          status: session.payment_status === 'paid' ? 'paid' : 'pending',
        },
        {
          onConflict: 'stripe_session_id',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single()

    if (paymentError) {
      console.error('[webhook/stripe] Failed to record payment:', paymentError)
      return
    }

    // Le trigger automatique créera le subscriber, mais on peut aussi le faire manuellement pour être sûr
    if (session.payment_status === 'paid' && customerEmail) {
      // Récupérer la préférence pour les promotions depuis les metadata
      const acceptPromotions = session.metadata?.acceptPromotions === 'true'
      
      // Le trigger upsert_subscriber_on_payment devrait déjà le faire, mais on le fait aussi ici pour être sûr
      await supabase
        .from('subscribers')
        .upsert(
          {
            email: customerEmail.toLowerCase().trim(),
            stripe_customer_id: stripeCustomerId,
            source: 'checkout',
            subscribed_to_newsletter: true,
            subscribed_to_product_updates: true,
            subscribed_to_promotions: acceptPromotions, // Utiliser la préférence du client
            unsubscribed_at: null,
          },
          {
            onConflict: 'email',
            ignoreDuplicates: false,
          }
        )
    }

    console.log('[webhook/stripe] Payment recorded:', {
      sessionId: session.id,
      productId,
      email: customerEmail,
      paymentId: payment?.id,
    })
  } catch (error) {
    console.error('[webhook/stripe] Error recording payment:', error)
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
