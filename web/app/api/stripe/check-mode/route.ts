import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Vérifier toutes les variables d'environnement Stripe
    const secretKey = process.env.STRIPE_SECRET_KEY || ''
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
    
    // Afficher toutes les variables d'environnement qui commencent par STRIPE ou NEXT_PUBLIC_STRIPE
    const allEnvVars = Object.keys(process.env)
      .filter(key => key.includes('STRIPE'))
      .reduce((acc, key) => {
        const value = process.env[key] || ''
        acc[key] = {
          exists: !!process.env[key],
          length: value.length,
          preview: value ? `${value.substring(0, 15)}...` : 'Non défini',
          startsWith: {
            sk_live: value.startsWith('sk_live_'),
            sk_test: value.startsWith('sk_test_'),
            pk_live: value.startsWith('pk_live_'),
            pk_test: value.startsWith('pk_test_'),
          }
        }
        return acc
      }, {} as Record<string, any>)
    
    const isLiveMode = secretKey.startsWith('sk_live_')
    const publishableIsLive = publishableKey.startsWith('pk_live_')
    
    // Masquer les clés pour la sécurité (afficher seulement les 15 premiers caractères)
    const secretKeyPreview = secretKey ? `${secretKey.substring(0, 15)}...` : 'Non défini'
    const publishableKeyPreview = publishableKey ? `${publishableKey.substring(0, 15)}...` : 'Non défini'
    
    return NextResponse.json({
      mode: isLiveMode ? 'LIVE' : 'TEST',
      secretKey: {
        preview: secretKeyPreview,
        isLive: isLiveMode,
        length: secretKey.length,
        exists: !!process.env.STRIPE_SECRET_KEY,
      },
      publishableKey: {
        preview: publishableKeyPreview,
        isLive: publishableIsLive,
        length: publishableKey.length,
        exists: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      },
      allStripeEnvVars: allEnvVars,
      message: isLiveMode 
        ? '✅ Mode LIVE détecté - Les Price IDs de production seront utilisés'
        : '⚠️ Mode TEST détecté - Les Price IDs de test seront utilisés',
    })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
