import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    const productId = searchParams.get('product_id')

    if (!email || !productId) {
      return NextResponse.json(
        { error: 'Email and product_id are required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Vérifier l'accès dans la base de données
    const response = await fetch(
      `${supabaseUrl}/rest/v1/active_access?customer_email=eq.${encodeURIComponent(email)}&product_id=eq.${productId}`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      }
    )

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500 }
      )
    }

    const data = await response.json()
    const hasAccess = Array.isArray(data) && data.length > 0

    return NextResponse.json({
      hasAccess,
      productId,
      email,
    })
  } catch (error) {
    console.error('Check access error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

