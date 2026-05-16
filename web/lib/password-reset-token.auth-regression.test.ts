import { describe, expect, it } from 'vitest'
import { hashResetToken } from '@/lib/password-reset-token'

describe('hashResetToken', () => {
  it('est déterministe (SHA-256 hex)', () => {
    const t = 'token-test-abc'
    expect(hashResetToken(t)).toBe(hashResetToken(t))
    expect(hashResetToken(t)).toMatch(/^[a-f0-9]{64}$/)
  })

  it('différencie deux jetons', () => {
    expect(hashResetToken('a')).not.toBe(hashResetToken('b'))
  })
})
