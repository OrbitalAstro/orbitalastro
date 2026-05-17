import { describe, expect, it } from 'vitest'
import { validateChangePasswordInput } from '@/lib/auth/change-password'

describe('validateChangePasswordInput', () => {
  it('accepte des mots de passe valides', () => {
    expect(
      validateChangePasswordInput({
        currentPassword: 'ancien123',
        newPassword: 'nouveau456',
        confirmPassword: 'nouveau456',
      }),
    ).toBeNull()
  })

  it('refuse si confirmation différente', () => {
    expect(
      validateChangePasswordInput({
        currentPassword: 'ancien123',
        newPassword: 'nouveau456',
        confirmPassword: 'autre789',
      }),
    ).toBe('MISMATCH')
  })

  it('refuse si nouveau trop court', () => {
    expect(
      validateChangePasswordInput({
        currentPassword: 'ancien123',
        newPassword: 'court',
        confirmPassword: 'court',
      }),
    ).toBe('SHORT')
  })
})
