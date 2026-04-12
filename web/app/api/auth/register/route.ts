import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { hashPassword } from '@/lib/password'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    const normalizedEmail = String(email || '').toLowerCase().trim()
    const rawPassword = String(password || '')
    const displayName = String(name || '').trim()

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json({ error: 'Adresse courriel invalide.' }, { status: 400 })
    }

    if (rawPassword.length < 8) {
      return NextResponse.json({ error: 'Le mot de passe doit contenir au moins 8 caractères.' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const passwordHash = hashPassword(rawPassword)

    const { data, error } = await supabase
      .from('auth_users')
      .insert({
        email: normalizedEmail,
        display_name: displayName || null,
        password_hash: passwordHash,
      })
      .select('id, email, display_name')
      .single()

    if (error) {
      const alreadyExists = error.code === '23505' || String(error.message || '').toLowerCase().includes('duplicate')
      if (alreadyExists) {
        return NextResponse.json({ error: 'Un compte existe déjà avec ce courriel.' }, { status: 409 })
      }
      return NextResponse.json({ error: `Erreur de création de compte: ${error.message}` }, { status: 500 })
    }

    return NextResponse.json({ ok: true, user: data })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
