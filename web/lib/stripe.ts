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

// Produits à la pièce
export const oneTimeProducts: Product[] = [
  {
    id: 'dialogue',
    name: 'Dialogue pré-incarnation',
    description: 'Génération d\'un dialogue pré-incarnation.',
    price: 9.99,
    currency: 'cad',
    stripePriceId: 'price_1Sr8qkJOod2H9eSE8QV72G4p',
    type: 'one-time',
    launchOffer: true,
  },
  {
    id: 'reading-2026',
    name: 'Lecture 2026',
    description: 'Générer la lecture astrologie de l\'année 2026',
    price: 9.99,
    currency: 'cad',
    stripePriceId: 'price_1Sr8sKJOod2H9eSERiPO6965',
    type: 'one-time',
    launchOffer: true,
  },
  {
    id: 'valentine-2026',
    name: 'Saint-Valentin 2026',
    description: 'Synastrie Saint-Valentin 2026',
    price: 14.00,
    currency: 'cad',
    stripePriceId: 'price_1SrTNsJOod2H9eSEa2Nz1heK',
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
