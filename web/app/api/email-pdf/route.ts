import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import type { Language } from '@/lib/i18n'
import React from 'react'
import { randomUUID } from 'crypto'

import DialoguePdf from '@/app/dialogues/DialoguePdf'
import Reading2026Pdf from '@/app/reading-2026/Reading2026Pdf'
import ValentinePdf from '@/app/saint-valentin/ValentinePdf'

export const runtime = 'nodejs'

type PdfKind = 'dialogue' | 'reading-2026' | 'saint-valentin'

type EmailPdfRequest = {
  kind: PdfKind
  to: string
  language?: Language
  firstName?: string
  partnerName?: string
  relationshipContext?: string
  birthDate?: string
  birthTime?: string
  birthPlace?: string
  content: string
}

function isEmail(value: string) {
  const trimmed = (value || '').trim()
  if (!trimmed) return false
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
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
  const g = globalThis as unknown as { __orbitalastroEmailRate?: Map<string, RateBucket> }
  if (!g.__orbitalastroEmailRate) g.__orbitalastroEmailRate = new Map()
  const now = Date.now()
  const entry = g.__orbitalastroEmailRate.get(key)

  if (!entry || entry.resetAt <= now) {
    g.__orbitalastroEmailRate.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt }
  }

  entry.count += 1
  g.__orbitalastroEmailRate.set(key, entry)
  return { allowed: true, remaining: limit - entry.count }
}

async function sendWithResend(args: {
  to: string
  subject: string
  text: string
  filename: string
  contentBase64: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM

  if (!apiKey || !from) {
    throw new Error('Email is not configured (missing RESEND_API_KEY / RESEND_FROM)')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [args.to],
      subject: args.subject,
      text: args.text,
      attachments: [
        {
          filename: args.filename,
          content: args.contentBase64,
          contentType: 'application/pdf',
        },
      ],
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw new Error(`Resend error (${response.status}): ${body || response.statusText}`)
  }

  const data = (await response.json().catch(() => null)) as null | { id?: string }
  return data?.id
}

function maskEmail(email: string) {
  const trimmed = (email || '').trim()
  const at = trimmed.indexOf('@')
  if (at <= 1) return '<redacted>'
  const name = trimmed.slice(0, at)
  const domain = trimmed.slice(at + 1)
  return `${name[0]}***@${domain}`
}

function extractEmail(fromValue: string) {
  const match = (fromValue || '').match(/<([^>]+)>/)
  return (match?.[1] || fromValue || '').trim()
}

function buildMessage(args: { kind: PdfKind; language: Language; firstName?: string; supportEmail: string }) {
  const { kind, language, firstName, supportEmail } = args
  const nameLine = firstName ? ` ${firstName}` : ''

  const subjectFr =
    kind === 'dialogue'
      ? 'Votre Dialogue Avant l\'atterrissage (PDF)'
      : kind === 'reading-2026'
        ? 'Votre Dialogue Quatre saisons à venir (PDF)'
        : 'Votre synastrie Saint-Valentin (PDF)'
  const subjectEn =
    kind === 'dialogue'
      ? 'Your Dialogue Before landing (PDF)'
      : kind === 'reading-2026'
        ? 'Your Dialogue Four seasons to come (PDF)'
        : 'Your Valentine synastry (PDF)'
  const subjectEs =
    kind === 'dialogue'
      ? 'Tu Diálogo Antes del aterrizaje (PDF)'
      : kind === 'reading-2026'
        ? 'Tu Diálogo Cuatro estaciones por venir (PDF)'
        : 'Tu sinastría de San Valentín (PDF)'

  const subject = language === 'en' ? subjectEn : language === 'es' ? subjectEs : subjectFr

  const introFr = `Bonjour${nameLine},\n\nVoici votre PDF OrbitalAstro en pièce jointe.`
  const introEn = `Hi${nameLine},\n\nHere is your OrbitalAstro PDF attached.`
  const introEs = `Hola${nameLine},\n\nAquí tienes tu PDF de OrbitalAstro adjunto.`

  const helpFr = `\n\nBesoin d'aide? Écrivez-nous: ${supportEmail}`
  const helpEn = `\n\nNeed help? Email us: ${supportEmail}`
  const helpEs = `\n\n¿Necesitas ayuda? Escríbenos: ${supportEmail}`

  const legalFr =
    "\n\nVous recevez ce courriel parce qu'une demande de PDF a été faite sur orbitalastro.ca. Si ce n'était pas vous, ignorez ce message."
  const legalEn =
    '\n\nYou received this email because a PDF was requested on orbitalastro.ca. If this was not you, you can ignore this message.'
  const legalEs =
    '\n\nRecibiste este correo porque se solicitó un PDF en orbitalastro.ca. Si no fuiste tú, puedes ignorar este mensaje.'

  const signature = '\n\n- OrbitalAstro'

  const intro = language === 'en' ? introEn : language === 'es' ? introEs : introFr
  const help = language === 'en' ? helpEn : language === 'es' ? helpEs : helpFr
  const legal = language === 'en' ? legalEn : language === 'es' ? legalEs : legalFr

  return { subject, text: `${intro}${help}${legal}${signature}` }
}

function buildFilename(kind: PdfKind, firstName?: string) {
  const safeName = (firstName || '').trim().replace(/[^\p{L}\p{N}\-_. ]/gu, '').trim()
  const suffix = safeName ? `-${safeName}` : ''
  if (kind === 'dialogue') return `Dialogue-Avant-atterrissage${suffix}.pdf`
  if (kind === 'reading-2026') return `Dialogue-Quatre-saisons-a-venir${suffix}.pdf`
  return `Synastrie-Saint-Valentin${suffix}.pdf`
}

export async function POST(req: Request) {
  try {
    const requestId = randomUUID()
    const origin = normalizeOrigin(req.headers.get('origin') || '')
    const allowed = allowedOrigins()
    if (origin && !allowed.includes(origin)) {
      return NextResponse.json({ error: 'Forbidden origin' }, { status: 403 })
    }

    const ip = getClientIp(req)
    const hourly = checkRateLimit(`email:${ip}:h`, 10, 60 * 60 * 1000)
    if (!hourly.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const data = (await req.json()) as Partial<EmailPdfRequest>

    const kind = data.kind
    const to = (data.to || '').trim()
    const content = (data.content || '').trim()
    const language = (data.language || 'fr') as Language
    const firstName = (data.firstName || '').trim() || undefined

    if (kind !== 'dialogue' && kind !== 'reading-2026' && kind !== 'saint-valentin') {
      return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
    }
    if (!isEmail(to)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }
    if (!content) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 })
    }

    const perRecipient = checkRateLimit(`email:${to.toLowerCase()}:d`, 5, 24 * 60 * 60 * 1000)
    if (!perRecipient.allowed) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
    }

    const filename = buildFilename(kind, firstName)
    console.log(`[email-pdf] ${requestId} start kind=${kind} to=${maskEmail(to)} origin=${origin || 'n/a'}`)

    const doc =
      kind === 'dialogue'
        ? React.createElement(DialoguePdf, {
            dialogue: content,
            language,
            firstName,
            feedbackSurveyUrl: process.env.FEEDBACK_SURVEY_URL || undefined,
          })
        : kind === 'reading-2026'
          ? React.createElement(Reading2026Pdf, {
              reading: content,
              language,
              firstName,
              birthDate: data.birthDate,
              birthTime: data.birthTime,
              birthPlace: data.birthPlace,
            })
          : React.createElement(ValentinePdf, {
              content,
              language,
              youName: firstName,
              partnerName: (data.partnerName || '').trim() || undefined,
              relationshipContext: (data.relationshipContext || '').trim() || undefined,
            })

    console.log(`[email-pdf] ${requestId} Generating PDF for kind=${kind}...`)
    let buffer: Buffer
    try {
      buffer = await renderToBuffer(doc)
      console.log(`[email-pdf] ${requestId} PDF generated, size=${buffer.length} bytes`)
    } catch (pdfError) {
      console.error(`[email-pdf] ${requestId} PDF generation failed:`, pdfError)
      throw new Error(`PDF generation failed: ${pdfError instanceof Error ? pdfError.message : String(pdfError)}`)
    }
    
    if (buffer.subarray(0, 4).toString() !== '%PDF') {
      console.error(`[email-pdf] ${requestId} Invalid PDF header: ${buffer.subarray(0, 10).toString()}`)
      throw new Error('Failed to generate a valid PDF')
    }

    const fromValue = process.env.RESEND_FROM || ''
    const supportEmail = (process.env.SUPPORT_EMAIL || extractEmail(fromValue) || 'support@orbitalastro.ca').trim()
    const message = buildMessage({ kind, language, firstName, supportEmail })

    console.log(`[email-pdf] ${requestId} Sending email via Resend...`)
    console.log(`[email-pdf] ${requestId} Resend config: from=${fromValue ? 'set' : 'missing'}, apiKey=${process.env.RESEND_API_KEY ? 'set' : 'missing'}`)
    
    let resendId: string | undefined
    try {
      resendId = await sendWithResend({
        to,
        subject: message.subject,
        text: message.text,
        filename,
        contentBase64: buffer.toString('base64'),
      })
      console.log(`[email-pdf] ${requestId} Email sent successfully, resendId=${resendId || 'n/a'}`)
    } catch (resendError) {
      console.error(`[email-pdf] ${requestId} Resend error:`, resendError)
      throw new Error(`Email sending failed: ${resendError instanceof Error ? resendError.message : String(resendError)}`)
    }

    console.log(`[email-pdf] ${requestId} sent kind=${kind} to=${maskEmail(to)} resendId=${resendId || 'n/a'}`)

    // Mettre à jour last_email_sent_at dans la base de données
    try {
      const { getSupabaseAdmin } = await import('@/lib/supabase')
      const supabase = getSupabaseAdmin()
      
      await supabase
        .from('subscribers')
        .update({ last_email_sent_at: new Date().toISOString() })
        .eq('email', to.toLowerCase().trim())
      
      console.log(`[email-pdf] ${requestId} Updated last_email_sent_at for ${maskEmail(to)}`)
    } catch (dbError) {
      // Ne pas faire échouer la requête si la mise à jour DB échoue
      console.error(`[email-pdf] ${requestId} Failed to update last_email_sent_at:`, dbError)
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    const stack = error instanceof Error ? error.stack : undefined
    console.error(`[email-pdf] ${requestId || 'unknown'} Error:`, message, stack)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
