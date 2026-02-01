// Stripe client pour le frontend (publishable key uniquement)
import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    
    if (!publishableKey) {
      console.warn('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set')
      stripePromise = Promise.resolve(null)
    } else {
      stripePromise = loadStripe(publishableKey)
    }
  }
  
  return stripePromise
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  currency: string
  stripePriceId: string // ID du prix dans Stripe
  type: 'one-time' | 'subscription' // Type de paiement
  interval?: 'month' | 'year' // Pour les abonnements
  launchOffer?: boolean // Offre de lancement
  promoCode?: string // Code promo unique (optionnel)
  features?: string[] // Caractéristiques (pour les abonnements)
}

// Détecter si on utilise les clés LIVE (production) ou TEST (développement)
// On détecte automatiquement selon la clé publishable configurée
const getStripeMode = () => {
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
  return publishableKey.startsWith('pk_live_') ? 'live' : 'test'
}

// Helper pour obtenir le bon Price ID selon l'environnement
const getPriceId = (testId: string, liveId?: string) => {
  const mode = getStripeMode()
  // Si on est en production (LIVE) et qu'on a un Price ID de production, l'utiliser
  // Sinon, utiliser celui de test (pour le développement local)
  if (mode === 'live' && liveId) {
    return liveId
  }
  return testId
}

// Produits à la pièce
// NOTE: Pour passer en production, vous devrez :
// 1. Créer les produits en Live mode dans Stripe
// 2. Récupérer les Price IDs de production
// 3. Les ajouter comme deuxième paramètre dans getPriceId() ci-dessous
export const oneTimeProducts: Product[] = [
  {
    id: 'dialogue',
    name: 'Dialogue pré-incarnation',
    description: 'Génération d\'un dialogue pré-incarnation.',
    price: 9.99,
    currency: 'cad',
    stripePriceId: getPriceId(
      'price_1Sr8qkJOod2H9eSE8QV72G4p', // TEST (utilisé en local)
      // 'price_1VOTRE_PRICE_ID_LIVE_DIALOGUE' // LIVE (à ajouter après création en production)
    ),
    type: 'one-time',
    launchOffer: true,
  },
  {
    id: 'reading-2026',
    name: 'Lecture 2026',
    description: 'Générer la lecture astrologie de l\'année 2026',
    price: 9.99,
    currency: 'cad',
    stripePriceId: getPriceId(
      'price_1Sr8sKJOod2H9eSERiPO6965', // TEST (utilisé en local)
      // 'price_1VOTRE_PRICE_ID_LIVE_READING' // LIVE (à ajouter après création en production)
    ),
    type: 'one-time',
    launchOffer: true,
  },
  {
    id: 'valentine-2026',
    name: 'Saint-Valentin 2026',
    description: 'Synastrie Saint-Valentin 2026',
    price: 14.00,
    currency: 'cad',
    stripePriceId: getPriceId(
      'price_1SrTNsJOod2H9eSEa2Nz1heK', // TEST (utilisé en local)
      // 'price_1VOTRE_PRICE_ID_LIVE_VALENTINE' // LIVE (à ajouter après création en production)
    ),
    type: 'one-time',
    launchOffer: false,
  },
]

// Abonnements (pour plus tard)
export const subscriptions: Product[] = [
  {
    id: 'monthly',
    name: 'Abonnement Mensuel',
    description: 'Accès complet à toutes les fonctionnalités astrologiques.',
    price: 12.99,
    currency: 'cad',
    stripePriceId: '', // ⬅️ À REMPLIR avec votre Price ID Stripe
    type: 'subscription',
    interval: 'month',
    features: [
      'Lectures astrologiques illimitées',
      'Suivi des transits en temps réel',
      'Dialogues pré-incarnation',
      'Calculs de thème natal avancés',
      'Progressions et retours solaires',
      'Export PDF de vos analyses',
      'Support prioritaire',
    ],
  },
]

// Tous les produits (pour affichage)
export const allProducts: Product[] = [...oneTimeProducts, ...subscriptions]
