import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

type ContactRequest = {
  name: string
  email: string
  subject: string
  message: string
}

function isEmail(value: string) {
  const trimmed = (value || '').trim()
  if (!trimmed) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
}

async function sendContactEmail(args: {
  fromEmail: string
  fromName: string
  subject: string
  message: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM

  if (!apiKey || !from) {
    throw new Error('Email is not configured (missing RESEND_API_KEY / RESEND_FROM)')
  }

  const toEmail = 'info@orbitalastro.ca'

  const emailBody = `
Nouveau message de contact depuis orbitalastro.ca

De: ${args.fromName} <${args.fromEmail}>
Sujet: ${args.subject}

Message:
${args.message}

---
Cet email a été envoyé depuis le formulaire de contact de orbitalastro.ca
  `.trim()

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [toEmail],
      replyTo: args.fromEmail,
      subject: `[Contact] ${args.subject}`,
      text: emailBody,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Resend error (${response.status}): ${body || response.statusText}`)
  }

  const data = (await response.json().catch(() => null)) as null | { id?: string }
  return data?.id
}

function normalizeOrigin(value: string) {
  return (value || '').trim().replace(/\/+$/, '')
}

function allowedOrigins() {
  const raw = (process.env.ALLOWED_EMAIL_ORIGINS || '').trim()
  const defaults = [
    'https://www.orbitalastro.ca',
    'https://orbitalastro.ca',
    'https://orbitalastro-web.fly.dev',
    'http://localhost:3000',
  ]
  const list = raw ? raw.split(',') : defaults
  return list.map(normalizeOrigin).filter(Boolean)
}

function getClientIp(req: Request) {
  const xff = req.headers.get('x-forwarded-for') || ''
  const first = xff.split(',')[0]?.trim()
  return first || 'unknown'
}

type RateBucket = { count: number; resetAt: number }

function checkRateLimit(key: string, limit: number, windowMs: number) {
  const g = globalThis as unknown as { __orbitalastroContactRate?: Map<string, RateBucket> }
  if (!g.__orbitalastroContactRate) g.__orbitalastroContactRate = new Map()
  const now = Date.now()
  const entry = g.__orbitalastroContactRate.get(key)

  if (!entry || entry.resetAt <= now) {
    g.__orbitalastroContactRate.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count += 1
  g.__orbitalastroContactRate.set(key, entry)
  return { allowed: true, remaining: limit - entry.count }
}

export async function POST(req: Request) {
  try {
    const origin = normalizeOrigin(req.headers.get('origin') || '')
    const allowed = allowedOrigins()
    if (origin && !allowed.includes(origin)) {
      return NextResponse.json({ error: 'Forbidden origin' }, { status: 403 })
    }

    const ip = getClientIp(req)
    const hourly = checkRateLimit(`contact:${ip}:h`, 5, 60 * 60 * 1000)
    if (!hourly.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const data = (await req.json()) as Partial<ContactRequest>

    const name = (data.name || '').trim()
    const email = (data.email || '').trim()
    const subject = (data.subject || '').trim()
    const message = (data.message || '').trim()

    if (!name) {
      return NextResponse.json({ error: 'Le nom est requis' }, { status: 400 })
    }
    if (!isEmail(email)) {
      return NextResponse.json({ error: 'Adresse email invalide' }, { status: 400 })
    }
    if (!subject) {
      return NextResponse.json({ error: 'Le sujet est requis' }, { status: 400 })
    }
    if (!message) {
      return NextResponse.json({ error: 'Le message est requis' }, { status: 400 })
    }

    const perEmail = checkRateLimit(`contact:${email.toLowerCase()}:d`, 3, 24 * 60 * 60 * 1000)
    if (!perEmail.allowed) {
      return NextResponse.json({ error: 'Trop de messages envoyés depuis cette adresse email' }, { status: 429 })
    }

    await sendContactEmail({
      fromEmail: email,
      fromName: name,
      subject,
      message,
    })

    // Sauvegarder l'email dans la base de données (optionnel, pour newsletter)
    try {
      const { getSupabaseAdmin } = await import('@/lib/supabase')
      const supabase = getSupabaseAdmin()
      
      await supabase
        .from('subscribers')
        .upsert(
          {
            email: email.toLowerCase().trim(),
            first_name: name || null,
            source: 'contact',
            subscribed_to_newsletter: true,
            subscribed_to_product_updates: true,
            subscribed_to_promotions: true,
            unsubscribed_at: null,
          },
          {
            onConflict: 'email',
            ignoreDuplicates: false,
          }
        )
      
      console.log('[contact] Subscriber saved to database')
    } catch (dbError) {
      // Ne pas faire échouer la requête si l'enregistrement DB échoue
      console.error('[contact] Failed to save subscriber:', dbError)
    }

    return NextResponse.json({ ok: true, message: 'Message envoyé avec succès' })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[contact] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

