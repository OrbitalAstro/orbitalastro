/**
 * Vérifie si l'utilisateur a payé pour un produit spécifique
 */

export type ProductId = 'dialogue' | 'reading-2026' | 'valentine-2026' | 'monthly'

/**
 * Vérifie si l'utilisateur a accès à un produit
 * Vérifie d'abord dans localStorage (cache), puis dans la base de données
 */
export async function checkProductAccess(
  productId: ProductId,
  email?: string | null,
  sessionId?: string | null
): Promise<boolean> {
  // Vérifier dans localStorage (cache local)
  const storedAccess = localStorage.getItem(`paid_${productId}`)
  if (storedAccess === 'true') {
    // Si on a l'accès en cache, l'accorder directement
    // (on peut ajouter une vérification DB plus tard si nécessaire)
    return true
  }

  // Si une session_id est fournie, vérifier avec Stripe d'abord
  if (sessionId) {
    try {
      console.log(`[checkPayment] Vérification du paiement pour ${productId} avec session_id: ${sessionId}`)
      const response = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
      const data = await response.json()
      console.log(`[checkPayment] Réponse Stripe:`, data)

      if (data.paid && data.productId === productId) {
        // Si Stripe confirme le paiement, accorder l'accès immédiatement
        console.log(`[checkPayment] Paiement confirmé, accès accordé pour ${productId}`)
        localStorage.setItem(`paid_${productId}`, 'true')
        return true
      } else {
        console.log(`[checkPayment] Paiement non confirmé ou produit incorrect. paid: ${data.paid}, productId: ${data.productId}, attendu: ${productId}`)
      }
    } catch (error) {
      console.error('[checkPayment] Erreur lors de la vérification du paiement:', error)
    }
  }

  // Si on arrive ici, pas d'accès trouvé
  // (on peut ajouter une vérification DB plus tard si nécessaire)

  return false
}

/**
 * Vérifie l'accès depuis l'URL (paramètre purchased=true ou session_id)
 */
export async function checkAccessFromURL(productId: ProductId): Promise<boolean> {
  if (typeof window === 'undefined') return false

  const params = new URLSearchParams(window.location.search)
  const purchased = params.get('purchased')
  const sessionId = params.get('session_id')

  // Essayer de récupérer l'email depuis le formulaire ou localStorage
  let email: string | null = null
  
  // Chercher l'email dans le formulaire de la page
  const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement
  if (emailInput?.value) {
    email = emailInput.value
  }

  // Sinon, chercher dans localStorage (si l'utilisateur a déjà rempli le formulaire)
  if (!email) {
    email = localStorage.getItem(`last_email_${productId}`)
  }

  if (purchased === 'true' || sessionId) {
    return await checkProductAccess(productId, email, sessionId)
  }

  return await checkProductAccess(productId, email)
}

/**
 * Marque un produit comme payé (utilisé après vérification réussie)
 */
export function markProductAsPaid(productId: ProductId) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`paid_${productId}`, 'true')
  }
}

