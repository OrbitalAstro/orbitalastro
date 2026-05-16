import { describe, expect, it } from 'vitest'
import { isAuthPasswordLongEnough, parseNormalizedAuthEmail } from '@/lib/auth/validation'

describe('parseNormalizedAuthEmail', () => {
  it('accepte un courriel valide et le normalise', () => {
    expect(parseNormalizedAuthEmail('  User@Example.COM ')).toBe('user@example.com')
  })

  it('rejette les formats invalides', () => {
    expect(parseNormalizedAuthEmail('')).toBeNull()
    expect(parseNormalizedAuthEmail('sans-arobase')).toBeNull()
    expect(parseNormalizedAuthEmail('@nodomain')).toBeNull()
    expect(parseNormalizedAuthEmail('a@b')).toBeNull()
    expect(parseNormalizedAuthEmail(null)).toBeNull()
  })
})

describe('isAuthPasswordLongEnough', () => {
  it('exige au moins 8 caractères par défaut', () => {
    expect(isAuthPasswordLongEnough('1234567')).toBe(false)
    expect(isAuthPasswordLongEnough('12345678')).toBe(true)
  })
})
