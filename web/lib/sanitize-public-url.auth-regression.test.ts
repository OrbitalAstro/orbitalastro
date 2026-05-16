import { describe, expect, it } from 'vitest'
import { sanitizePublicUrl } from '@/lib/sanitize-public-url'

describe('sanitizePublicUrl', () => {
  it('retire les guillemets autour de l’URL', () => {
    expect(sanitizePublicUrl('"https://www.orbitalastro.ca"')).toBe('https://www.orbitalastro.ca')
  })

  it('retourne undefined si invalide', () => {
    expect(sanitizePublicUrl('"https')).toBeUndefined()
    expect(sanitizePublicUrl('')).toBeUndefined()
  })
})
