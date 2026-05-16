import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { parseNormalizedAuthEmail } from '@/lib/auth/validation'
import { getSupabaseAdmin } from '@/lib/supabase'
import { hashResetToken } from '@/lib/password-reset-token'
import { passwordResetPublicOrigin } from '@/lib/password-reset-origin'
import { sendPasswordResetEmail } from '@/lib/send-password-reset-email'

export const runtime = 'nodejs'

const TOKEN_BYTES = 32
const EXPIRY_MS = 60 * 60 * 1000 // 1 h

type RateBucket = { count: number; resetAt: number }

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const g = globalThis as unknown as { __orbitalForgotPwRate?: Map<string, RateBucket> }
  if (!g.__orbitalForgotPwRate) g.__orbitalForgotPwRate = new Map()
  const now = Date.now()
  const entry = g.__orbitalForgotPwRate.get(key)
  if (!entry || entry.resetAt <= now) {
    g.__orbitalForgotPwRate.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (entry.count >= limit) return false
  entry.count += 1
  return true
}

function siteBaseUrl(request: NextRequest): string {
  return passwordResetPublicOrigin(request)
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit(`ip:${ip}`, 15, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: true })
  }

  let body: { email?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: true })
  }

  const email = parseNormalizedAuthEmail(body.email)
  if (!email) {
    return NextResponse.json({ ok: true })
  }

  if (!checkRateLimit(`em:${email}`, 4, 60 * 60 * 1000)) {
    return NextResponse.json({ ok: true })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { data: user, error: userErr } = await supabase
      .from('auth_users')
      .select('id, email')
      .eq('email', email)
      .maybeSingle()

    if (userErr || !user?.id) {
      return NextResponse.json({ ok: true })
    }

    const rawToken = randomBytes(TOKEN_BYTES).toString('base64url')
    const tokenHash = hashResetToken(rawToken)
    const expiresAt = new Date(Date.now() + EXPIRY_MS).toISOString()

    await supabase.from('auth_password_reset_tokens').delete().eq('user_id', user.id)

    const { error: insErr } = await supabase.from('auth_password_reset_tokens').insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    })

    if (insErr) {
      console.error('[forgot-password] insert token', insErr)
      return NextResponse.json({ ok: false, code: 'RESET_DB' }, { status: 503 })
    }

    const base = siteBaseUrl(request)
    const resetUrl = `${base}/auth/reset-password?token=${encodeURIComponent(rawToken)}`

    try {
      await sendPasswordResetEmail({ to: email, resetUrl })
    } catch (e) {
      console.error('[forgot-password] email', e)
      await supabase.from('auth_password_reset_tokens').delete().eq('token_hash', tokenHash)
      return NextResponse.json({ ok: false, code: 'EMAIL_SEND' }, { status: 503 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[forgot-password] unexpected', e)
    return NextResponse.json({ ok: false, code: 'SERVER' }, { status: 503 })
  }
}
