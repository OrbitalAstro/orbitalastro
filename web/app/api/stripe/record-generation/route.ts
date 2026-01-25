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

type RateBucket = { count: number; resetAt: number }

function checkRateLimit(key: string, limit: number, windowMs: number) {
  const g = globalThis as unknown as { __orbitalastroGenRate?: Map<string, RateBucket> }
  if (!g.__orbitalastroGenRate) g.__orbitalastroGenRate = new Map()
  const now = Date.now()
  const entry = g.__orbitalastroGenRate.get(key)

  if (!entry || entry.resetAt <= now) {
    g.__orbitalastroGenRate.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count += 1
  g.__orbitalastroGenRate.set(key, entry)
  return { allowed: true, remaining: limit - entry.count }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, productId, sessionId } = body

    if (!email || !productId) {
      return NextResponse.json(
        { error: 'Email and productId are required' },
        { status: 400 }
      )
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const hourly = checkRateLimit(`gen:${ip}:h`, 20, 60 * 60 * 1000)
    if (!hourly.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    // Enregistrer la génération dans les métadonnées Stripe
    // On utilise une approche simple : on stocke le nombre de générations dans les métadonnées de la session
    if (sessionId) {
      try {
        const stripe = getStripe()
        const session = await stripe.checkout.sessions.retrieve(sessionId)
        
        // Récupérer le nombre actuel de générations depuis les métadonnées
        const currentGenerations = parseInt(session.metadata?.generations || '0', 10)
        const newGenerations = currentGenerations + 1
        
        // Mettre à jour les métadonnées de la session
        await stripe.checkout.sessions.update(sessionId, {
          metadata: {
            ...session.metadata,
            generations: String(newGenerations),
            lastGenerationAt: new Date().toISOString(),
            lastGenerationEmail: email,
          },
        })
        
        return NextResponse.json({
          success: true,
          generations: newGenerations,
        })
      } catch (error) {
        console.error('Error recording generation in Stripe:', error)
        // Ne pas bloquer si l'enregistrement échoue, mais logger l'erreur
        return NextResponse.json({
          success: true,
          generations: 1, // Valeur par défaut
          warning: 'Could not record in Stripe, but generation allowed',
        })
      }
    }

    // Si pas de sessionId, on enregistre quand même (pour compatibilité)
    return NextResponse.json({
      success: true,
      generations: 1,
    })
  } catch (error) {
    console.error('Record generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

