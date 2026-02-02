import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY || ''
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
    
    const isLiveMode = secretKey.startsWith('sk_live_')
    const publishableIsLive = publishableKey.startsWith('pk_live_')
    
    // Masquer les clés pour la sécurité (afficher seulement les 10 premiers caractères)
    const secretKeyPreview = secretKey ? `${secretKey.substring(0, 10)}...` : 'Non défini'
    const publishableKeyPreview = publishableKey ? `${publishableKey.substring(0, 10)}...` : 'Non défini'
    
    return NextResponse.json({
      mode: isLiveMode ? 'LIVE' : 'TEST',
      secretKey: {
        preview: secretKeyPreview,
        isLive: isLiveMode,
        length: secretKey.length,
      },
      publishableKey: {
        preview: publishableKeyPreview,
        isLive: publishableIsLive,
        length: publishableKey.length,
      },
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
