import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const q = (url.searchParams.get('q') || '').trim()
  const limitRaw = url.searchParams.get('limit') || '5'
  const limit = Math.min(10, Math.max(1, Number.parseInt(limitRaw, 10) || 5))

  if (q.length < 3) {
    return NextResponse.json([], { status: 200 })
  }

  const nominatimUrl =
    `https://nominatim.openstreetmap.org/search?` +
    `q=${encodeURIComponent(q)}&` +
    `format=json&` +
    `limit=${limit}&` +
    `addressdetails=1&` +
    `extratags=1`

  try {
    const response = await fetch(nominatimUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'OrbitalAstro/1.0 (+https://orbitalastro.com)',
      },
      cache: 'no-store',
    })

    if (!response.ok) {
      return NextResponse.json([], { status: 200 })
    }

    const data = await response.json()
    if (!Array.isArray(data)) {
      return NextResponse.json([], { status: 200 })
    }

    return NextResponse.json(data, { status: 200 })
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

