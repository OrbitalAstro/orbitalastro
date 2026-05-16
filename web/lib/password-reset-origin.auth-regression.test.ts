import { describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/site', () => ({
  PUBLIC_SITE_URL: 'https://fallback.example',
}))

import { passwordResetPublicOrigin } from '@/lib/password-reset-origin'

function req(url: string, headers: Record<string, string> = {}) {
  return new NextRequest(url, { headers })
}

describe('passwordResetPublicOrigin', () => {
  it('priorise x-forwarded-host et x-forwarded-proto', () => {
    const r = req('http://internal:8080/api', {
      'x-forwarded-host': 'www.orbitalastro.ca',
      'x-forwarded-proto': 'https',
    })
    expect(passwordResetPublicOrigin(r)).toBe('https://www.orbitalastro.ca')
  })

  it('prend le premier host de la liste forwarded', () => {
    const r = req('http://x', {
      'x-forwarded-host': 'a.com, b.com',
      'x-forwarded-proto': 'http, https',
    })
    expect(passwordResetPublicOrigin(r)).toBe('http://a.com')
  })

  it('utilise host si pas de x-forwarded-host', () => {
    const r = req('http://localhost:3000', { host: 'localhost:3000' })
    expect(passwordResetPublicOrigin(r)).toBe('https://localhost:3000')
  })

  it('retombe sur PUBLIC_SITE_URL sans hôte', () => {
    const r = new NextRequest('http://127.0.0.1/')
    expect(passwordResetPublicOrigin(r)).toBe('https://fallback.example')
  })
})
