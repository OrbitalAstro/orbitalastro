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
  // Vérifier côté client (window) et côté serveur (process.env)
  const publishableKey = 
    (typeof window !== 'undefined' 
      ? (window as any).__NEXT_DATA__?.env?.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
      : null) 
    || process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY 
    || ''
  return publishableKey.startsWith('pk_live_') ? 'live' : 'test'
}

// Helper pour obtenir le bon Price ID selon l'environnement (au runtime)
const getPriceId = (testId: string, liveId?: string) => {
  const mode = getStripeMode()
  // Si on est en production (LIVE) et qu'on a un Price ID de production, l'utiliser
  // Sinon, utiliser celui de test (pour le développement local)
  if (mode === 'live' && liveId) {
    return liveId
  }
  return testId
}

// Fonction pour obtenir les produits avec les Price IDs calculés au runtime
const getProductsWithPriceIds = () => {
  const baseProducts = [
    {
      id: 'dialogue',
      name: 'Dialogue pré-incarnation',
      description: 'Génération d\'un dialogue pré-incarnation.',
      price: 9.99,
      currency: 'cad',
      testPriceId: 'price_1Sr8qkJOod2H9eSE8QV72G4p', // TEST
      livePriceId: 'price_1Sw9inJp4kRSmzLn7wY3DIUT', // LIVE
      type: 'one-time' as const,
      launchOffer: true,
    },
    {
      id: 'reading-2026',
      name: 'Lecture 2026',
      description: 'Générer la lecture astrologie de l\'année 2026',
      price: 9.99,
      currency: 'cad',
      testPriceId: 'price_1Sr8sKJOod2H9eSERiPO6965', // TEST
      livePriceId: 'price_1SwAFoJp4kRSmzLnS0MgV7VS', // LIVE
      type: 'one-time' as const,
      launchOffer: true,
    },
    {
      id: 'valentine-2026',
      name: 'Saint-Valentin 2026',
      description: 'Synastrie Saint-Valentin 2026',
      price: 14.00,
      currency: 'cad',
      testPriceId: 'price_1SrTNsJOod2H9eSEa2Nz1heK', // TEST
      livePriceId: undefined, // LIVE (à ajouter après création en production)
      type: 'one-time' as const,
      launchOffer: false,
    },
  ]

  return baseProducts.map(product => ({
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    currency: product.currency,
    stripePriceId: getPriceId(product.testPriceId, product.livePriceId),
    type: product.type,
    launchOffer: product.launchOffer,
  }))
}

// Produits à la pièce (calculés au runtime)
export const oneTimeProducts: Product[] = getProductsWithPriceIds()

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
