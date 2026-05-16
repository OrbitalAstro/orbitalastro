import { NextRequest, NextResponse } from 'next/server'
import { isAuthPasswordLongEnough } from '@/lib/auth/validation'
import { getSupabaseAdmin } from '@/lib/supabase'
import { hashPassword } from '@/lib/password'
import { hashResetToken } from '@/lib/password-reset-token'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const rawToken = String(body.token || '').trim()
    const password = String(body.password || '')

    if (!rawToken || rawToken.length < 20) {
      return NextResponse.json({ error: 'INVALID' }, { status: 400 })
    }

    if (!isAuthPasswordLongEnough(password)) {
      return NextResponse.json({ error: 'SHORT' }, { status: 400 })
    }

    const tokenHash = hashResetToken(rawToken)
    const supabase = getSupabaseAdmin()

    const { data: row, error: findErr } = await supabase
      .from('auth_password_reset_tokens')
      .select('id, user_id, expires_at')
      .eq('token_hash', tokenHash)
      .maybeSingle()

    if (findErr || !row?.user_id) {
      return NextResponse.json({ error: 'INVALID' }, { status: 400 })
    }

    const exp = new Date(row.expires_at).getTime()
    if (!Number.isFinite(exp) || exp < Date.now()) {
      await supabase.from('auth_password_reset_tokens').delete().eq('id', row.id)
      return NextResponse.json({ error: 'INVALID' }, { status: 400 })
    }

    const passwordHash = hashPassword(password)

    const { error: updErr } = await supabase
      .from('auth_users')
      .update({ password_hash: passwordHash })
      .eq('id', row.user_id)

    if (updErr) {
      console.error('[reset-password] update user', updErr)
      return NextResponse.json({ error: 'SERVER' }, { status: 500 })
    }

    await supabase.from('auth_password_reset_tokens').delete().eq('user_id', row.user_id)

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[reset-password]', e)
    return NextResponse.json({ error: 'SERVER' }, { status: 500 })
  }
}
