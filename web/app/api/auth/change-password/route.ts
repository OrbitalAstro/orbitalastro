import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-options'
import { validateChangePasswordInput } from '@/lib/auth/change-password'
import { getSupabaseAdmin } from '@/lib/supabase'
import { hashPassword, verifyPassword } from '@/lib/password'
import { sendPasswordChangedEmail } from '@/lib/send-password-changed-email'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const email = session?.user?.email?.toLowerCase().trim()
    if (!email) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    const body = await request.json()
    const currentPassword = String(body.currentPassword || '')
    const newPassword = String(body.newPassword || '')
    const confirmPassword = String(body.confirmPassword ?? newPassword)

    const validationError = validateChangePasswordInput({
      currentPassword,
      newPassword,
      confirmPassword,
    })
    if (validationError) {
      const status = validationError === 'MISSING_CURRENT' || validationError === 'MISSING_NEW' ? 400 : 400
      return NextResponse.json({ error: validationError }, { status })
    }

    const supabase = getSupabaseAdmin()
    const { data: user, error: findErr } = await supabase
      .from('auth_users')
      .select('id, password_hash')
      .eq('email', email)
      .maybeSingle()

    if (findErr || !user?.id) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
    }

    if (!verifyPassword(currentPassword, user.password_hash || '')) {
      return NextResponse.json({ error: 'WRONG_CURRENT' }, { status: 401 })
    }

    if (verifyPassword(newPassword, user.password_hash || '')) {
      return NextResponse.json({ error: 'SAME_PASSWORD' }, { status: 400 })
    }

    const passwordHash = hashPassword(newPassword)
    const { error: updErr } = await supabase
      .from('auth_users')
      .update({ password_hash: passwordHash })
      .eq('id', user.id)

    if (updErr) {
      console.error('[change-password] update user', updErr)
      return NextResponse.json({ error: 'SERVER' }, { status: 500 })
    }

    await supabase.from('auth_password_reset_tokens').delete().eq('user_id', user.id)

    try {
      await sendPasswordChangedEmail({ to: email })
    } catch (emailErr) {
      console.error('[change-password] notification email failed', emailErr)
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('[change-password]', e)
    return NextResponse.json({ error: 'SERVER' }, { status: 500 })
  }
}
