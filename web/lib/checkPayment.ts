/**
 * Vérifie si l'utilisateur a payé pour un produit spécifique
 */

export type ProductId = 'dialogue' | 'reading-2026' | 'valentine-2026' | 'monthly'

/**
 * Résultat de la vérification d'accès avec les quantités
 */
export interface AccessResult {
  hasAccess: boolean
  quantityPurchased: number
  quantityUsed: number
  quantityRemaining: number
  sessionId?: string
}

/**
 * Vérifie si l'utilisateur a accès à un produit et combien d'unités il peut encore générer
 */
export async function checkProductAccess(
  productId: ProductId,
  email?: string | null,
  sessionId?: string | null
): Promise<AccessResult> {
  // PRIORITÉ 1: Si une session_id est fournie, TOUJOURS vérifier avec Stripe
  if (sessionId) {
    try {
      console.log(`[checkPayment] Vérification du paiement pour ${productId} avec session_id: ${sessionId}`)
      const response = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
      const data = await response.json()
      console.log(`[checkPayment] Réponse Stripe:`, data)

      if (data.paid && data.productId === productId) {
        const quantityPurchased = data.quantity || 1
        const quantityUsed = data.generations || 0
        const quantityRemaining = quantityPurchased - quantityUsed
        
        // Mettre en cache les informations
        localStorage.setItem(`paid_${productId}`, 'true')
        localStorage.setItem(`quantity_${productId}`, String(quantityPurchased))
        localStorage.setItem(`used_${productId}`, String(quantityUsed))
        localStorage.setItem(`session_${productId}`, sessionId)
        
        return {
          hasAccess: quantityRemaining > 0,
          quantityPurchased,
          quantityUsed,
          quantityRemaining,
          sessionId,
        }
      } else {
        console.log(`[checkPayment] Paiement non confirmé ou produit incorrect. paid: ${data.paid}, productId: ${data.productId}, attendu: ${productId}`)
        localStorage.removeItem(`paid_${productId}`)
        return {
          hasAccess: false,
          quantityPurchased: 0,
          quantityUsed: 0,
          quantityRemaining: 0,
        }
      }
    } catch (error) {
      console.error('[checkPayment] Erreur lors de la vérification du paiement:', error)
      return {
        hasAccess: false,
        quantityPurchased: 0,
        quantityUsed: 0,
        quantityRemaining: 0,
      }
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
        const quantityPurchased = data.quantity || 1
        // Pour l'email, on doit récupérer le nombre de générations depuis toutes les sessions
        // Pour simplifier, on utilise le localStorage comme cache
        const cachedUsed = parseInt(localStorage.getItem(`used_${productId}`) || '0', 10)
        const quantityRemaining = quantityPurchased - cachedUsed
        
        // Mettre en cache
        localStorage.setItem(`paid_${productId}`, 'true')
        localStorage.setItem(`quantity_${productId}`, String(quantityPurchased))
        localStorage.setItem(`used_${productId}`, String(cachedUsed))
        if (data.sessionId) {
          localStorage.setItem(`session_${productId}`, data.sessionId)
        }
        
        return {
          hasAccess: quantityRemaining > 0,
          quantityPurchased,
          quantityUsed: cachedUsed,
          quantityRemaining,
          sessionId: data.sessionId,
        }
      } else {
        console.log(`[checkPayment] Pas de paiement trouvé pour cet email`)
        localStorage.removeItem(`paid_${productId}`)
        return {
          hasAccess: false,
          quantityPurchased: 0,
          quantityUsed: 0,
          quantityRemaining: 0,
        }
      }
    } catch (error) {
      console.error('[checkPayment] Erreur lors de la vérification du paiement par email:', error)
      localStorage.removeItem(`paid_${productId}`)
      return {
        hasAccess: false,
        quantityPurchased: 0,
        quantityUsed: 0,
        quantityRemaining: 0,
      }
    }
  }

  // PRIORITÉ 3: Si pas de session_id ni d'email, vérifier le cache localStorage
  const storedAccess = localStorage.getItem(`paid_${productId}`)
  if (storedAccess === 'true') {
    const cachedQuantity = parseInt(localStorage.getItem(`quantity_${productId}`) || '0', 10)
    const cachedUsed = parseInt(localStorage.getItem(`used_${productId}`) || '0', 10)
    const quantityRemaining = cachedQuantity - cachedUsed
    
    // ATTENTION: Ceci est un fallback temporaire. En production, on devrait toujours vérifier avec Stripe.
    // Pour l'instant, on retourne false pour forcer la vérification avec Stripe
    return {
      hasAccess: false, // Forcer la vérification avec Stripe
      quantityPurchased: cachedQuantity,
      quantityUsed: cachedUsed,
      quantityRemaining,
    }
  }

  // Si on arrive ici, pas d'accès trouvé
  return {
    hasAccess: false,
    quantityPurchased: 0,
    quantityUsed: 0,
    quantityRemaining: 0,
  }
}

/**
 * Vérifie l'accès depuis l'URL (paramètre purchased=true ou session_id)
 */
export async function checkAccessFromURL(productId: ProductId): Promise<AccessResult> {
  if (typeof window === 'undefined') {
    return {
      hasAccess: false,
      quantityPurchased: 0,
      quantityUsed: 0,
      quantityRemaining: 0,
    }
  }

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
 * Enregistre qu'une génération a été effectuée
 */
export async function recordGeneration(
  productId: ProductId,
  email: string,
  sessionId?: string | null
): Promise<void> {
  try {
    // Récupérer la sessionId depuis localStorage si non fournie
    const storedSessionId = sessionId || localStorage.getItem(`session_${productId}`)
    
    if (storedSessionId) {
      await fetch('/api/stripe/record-generation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          productId,
          sessionId: storedSessionId,
        }),
      })
    }
    
    // Mettre à jour le cache local
    const currentUsed = parseInt(localStorage.getItem(`used_${productId}`) || '0', 10)
    localStorage.setItem(`used_${productId}`, String(currentUsed + 1))
    
    console.log(`[checkPayment] Génération enregistrée pour ${productId}, utilisé: ${currentUsed + 1}`)
  } catch (error) {
    console.error('[checkPayment] Erreur lors de l\'enregistrement de la génération:', error)
    // Ne pas bloquer si l'enregistrement échoue
  }
}

/**
 * Marque un produit comme payé (utilisé après vérification réussie)
 */
export function markProductAsPaid(productId: ProductId) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`paid_${productId}`, 'true')
  }
}

