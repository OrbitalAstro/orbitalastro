import type { NextRequest } from 'next/server'
import { PUBLIC_SITE_URL } from '@/lib/site'

/**
 * URL publique pour le lien dans le courriel (doit correspondre au site où l’utilisateur
 * a soumis le formulaire, sinon hôte / cookies différents).
 */
export function passwordResetPublicOrigin(request: NextRequest): string {
  const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const forwardedHost =
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() || request.headers.get('host')?.trim()
  if (forwardedHost) {
    const proto =
      forwardedProto === 'http' || forwardedProto === 'https' ? forwardedProto : 'https'
    return `${proto}://${forwardedHost}`.replace(/\/+$/, '')
  }
  return PUBLIC_SITE_URL.replace(/\/+$/, '')
}
