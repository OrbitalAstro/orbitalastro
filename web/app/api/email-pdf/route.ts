import { NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import type { Language } from '@/lib/i18n'
import React from 'react'

import DialoguePdf from '@/app/dialogues/DialoguePdf'
import Reading2026Pdf from '@/app/reading-2026/Reading2026Pdf'

export const runtime = 'nodejs'

type PdfKind = 'dialogue' | 'reading-2026'

type EmailPdfRequest = {
  kind: PdfKind
  to: string
  language?: Language
  firstName?: string
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
}

function buildFilename(kind: PdfKind, firstName?: string) {
  const safeName = (firstName || '').trim().replace(/[^\p{L}\p{N}\-_. ]/gu, '').trim()
  const suffix = safeName ? `-${safeName}` : ''
  if (kind === 'dialogue') return `Dialogue-pre-incarnation${suffix}.pdf`
  return `Lecture-2026${suffix}.pdf`
}

export async function POST(req: Request) {
  try {
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

    if (kind !== 'dialogue' && kind !== 'reading-2026') {
      return NextResponse.json({ error: 'Invalid kind' }, { status: 400 })
    }
    if (!isEmail(to)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }
    if (!content) {
      return NextResponse.json({ error: 'Missing content' }, { status: 400 })
    }

    const filename = buildFilename(kind, firstName)

    const doc =
      kind === 'dialogue'
        ? React.createElement(DialoguePdf, {
            dialogue: content,
            language,
            firstName,
            feedbackSurveyUrl: process.env.FEEDBACK_SURVEY_URL || undefined,
          })
        : React.createElement(Reading2026Pdf, {
            reading: content,
            language,
            firstName,
            birthDate: data.birthDate,
            birthTime: data.birthTime,
            birthPlace: data.birthPlace,
          })

    const buffer = await renderToBuffer(doc)
    if (buffer.subarray(0, 4).toString() !== '%PDF') {
      throw new Error('Failed to generate a valid PDF')
    }

    const subject =
      kind === 'dialogue'
        ? 'Votre dialogue pré‑incarnation (PDF)'
        : 'Votre lecture 2026 (PDF)'

    await sendWithResend({
      to,
      subject,
      text: `Bonjour${firstName ? ` ${firstName}` : ''},\n\nVoici votre PDF OrbitalAstro.\n\n— OrbitalAstro`,
      filename,
      contentBase64: buffer.toString('base64'),
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
