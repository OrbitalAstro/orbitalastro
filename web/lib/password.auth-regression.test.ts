import { describe, expect, it } from 'vitest'
import { hashPassword, verifyPassword } from '@/lib/password'

describe('hashPassword / verifyPassword', () => {
  it('vérifie correctement après hachage', () => {
    const stored = hashPassword('monMotDePasse8')
    expect(verifyPassword('monMotDePasse8', stored)).toBe(true)
    expect(verifyPassword('autre', stored)).toBe(false)
  })

  it('rejette un stockage vide ou mal formé', () => {
    expect(verifyPassword('x', '')).toBe(false)
    expect(verifyPassword('x', 'nocolon')).toBe(false)
  })
})
