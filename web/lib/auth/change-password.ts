import { isAuthPasswordLongEnough } from '@/lib/auth/validation'

export type ChangePasswordInput = {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export type ChangePasswordClientError =
  | 'MISMATCH'
  | 'SHORT'
  | 'MISSING_CURRENT'
  | 'MISSING_NEW'

/** Validation côté client ou serveur (sans vérifier l'ancien mot de passe). */
export function validateChangePasswordInput(
  input: ChangePasswordInput,
): ChangePasswordClientError | null {
  if (!String(input.currentPassword).length) return 'MISSING_CURRENT'
  if (!String(input.newPassword).length) return 'MISSING_NEW'
  if (!isAuthPasswordLongEnough(input.newPassword)) return 'SHORT'
  if (input.newPassword !== input.confirmPassword) return 'MISMATCH'
  return null
}
