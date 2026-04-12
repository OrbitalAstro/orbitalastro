import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { getSupabaseAdmin } from '@/lib/supabase'

export const runtime = 'nodejs'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('auth_users')
    .select('id, email, display_name, birth_date, birth_time, birth_place, latitude, longitude, timezone')
    .eq('id', session.user.id)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ profile: data || null })
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const payload = {
      display_name: body.display_name ? String(body.display_name).trim() : null,
      birth_date: body.birth_date ? String(body.birth_date) : null,
      birth_time: body.birth_time ? String(body.birth_time) : null,
      birth_place: body.birth_place ? String(body.birth_place).trim() : null,
      latitude: typeof body.latitude === 'number' ? body.latitude : null,
      longitude: typeof body.longitude === 'number' ? body.longitude : null,
      timezone: body.timezone ? String(body.timezone) : null,
    }

    if (!payload.birth_date || !payload.birth_time || !payload.birth_place) {
      return NextResponse.json(
        { error: 'Les coordonnées de naissance (date, heure, lieu) sont requises.' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('auth_users')
      .update(payload)
      .eq('id', session.user.id)
      .select('id, email, display_name, birth_date, birth_time, birth_place, latitude, longitude, timezone')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, profile: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
