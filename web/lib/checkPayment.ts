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
  // PRIORITÉ 1: Si une session_id est fournie, TOUJOURS vérifier avec Stripe
  if (sessionId) {
    try {
      console.log(`[checkPayment] Vérification du paiement pour ${productId} avec session_id: ${sessionId}`)
      const response = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
      const data = await response.json()
      console.log(`[checkPayment] Réponse Stripe:`, data)

      if (data.paid && data.productId === productId) {
        // Si Stripe confirme le paiement, accorder l'accès et mettre en cache
        console.log(`[checkPayment] Paiement confirmé, accès accordé pour ${productId}`)
        localStorage.setItem(`paid_${productId}`, 'true')
        return true
      } else {
        // Si Stripe dit que le paiement n'est pas valide, retirer du cache
        console.log(`[checkPayment] Paiement non confirmé ou produit incorrect. paid: ${data.paid}, productId: ${data.productId}, attendu: ${productId}`)
        localStorage.removeItem(`paid_${productId}`)
        return false
      }
    } catch (error) {
      console.error('[checkPayment] Erreur lors de la vérification du paiement:', error)
      return false
    }
  }

  // PRIORITÉ 2: Si un email est fourni, vérifier avec Stripe via l'email
  if (email) {
    try {
      console.log(`[checkPayment] Vérification du paiement pour ${productId} avec email: ${email}`)
      const response = await fetch(`/api/stripe/verify-email?email=${encodeURIComponent(email)}&productId=${productId}`)
      const data = await response.json()
      console.log(`[checkPayment] Réponse Stripe (email):`, data)

      if (data.paid) {
        // Si Stripe confirme le paiement, accorder l'accès et mettre en cache
        console.log(`[checkPayment] Paiement confirmé via email, accès accordé pour ${productId}`)
        localStorage.setItem(`paid_${productId}`, 'true')
        return true
      } else {
        // Si Stripe dit que le paiement n'est pas valide, retirer du cache
        console.log(`[checkPayment] Pas de paiement trouvé pour cet email`)
        localStorage.removeItem(`paid_${productId}`)
        return false
      }
    } catch (error) {
      console.error('[checkPayment] Erreur lors de la vérification du paiement par email:', error)
      // En cas d'erreur, ne pas faire confiance au cache
      localStorage.removeItem(`paid_${productId}`)
      return false
    }
  }

  // PRIORITÉ 3: Si pas de session_id ni d'email, vérifier le cache localStorage
  // MAIS seulement comme fallback temporaire - idéalement on devrait toujours avoir un email
  const storedAccess = localStorage.getItem(`paid_${productId}`)
  if (storedAccess === 'true') {
    console.log(`[checkPayment] Accès trouvé dans le cache pour ${productId} (sans vérification Stripe)`)
    // ATTENTION: Ceci est un fallback temporaire. En production, on devrait toujours vérifier avec Stripe.
    // Pour l'instant, on retourne false pour forcer la vérification avec Stripe
    return false
  }

  // Si on arrive ici, pas d'accès trouvé
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

