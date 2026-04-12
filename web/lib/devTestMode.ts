import type { AccessResult } from './checkPayment'

/**
 * Mode test / dev pour les pages produits (dialogues, révolution solaire, etc.)
 *
 * - `?test=true` sur n’importe quel host → bypass paiement (démos).
 * - `?test=false` → désactive le bypass même sur localhost (tester le flux Stripe).
 * - Sur localhost / 127.0.0.1 sans param : même logique que NEXT_PUBLIC_DEV_SKIP_PAYMENT / NODE_ENV
 *   (voir checkPayment.shouldBypassPayment).
 */
export function isDevTestBypass(): boolean {
  if (typeof window === 'undefined') return false

  const params = new URLSearchParams(window.location.search)
  if (params.get('test') === 'false') return false
  if (params.get('test') === 'true') return true

  const host = window.location.hostname
  if (host !== 'localhost' && host !== '127.0.0.1') return false

  if (process.env.NEXT_PUBLIC_DEV_SKIP_PAYMENT === 'false') return false
  if (process.env.NEXT_PUBLIC_DEV_SKIP_PAYMENT === 'true') return true
  return process.env.NODE_ENV === 'development'
}

/** Valeur d’accès utilisée quand isDevTestBypass() est actif */
export const DEV_TEST_ACCESS_RESULT: AccessResult = {
  hasAccess: true,
  quantityPurchased: 999,
  quantityUsed: 0,
  quantityRemaining: 999,
  sessionId: 'dev-test-bypass',
}
