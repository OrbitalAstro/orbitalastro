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
  // Dans Next.js, NEXT_PUBLIC_* est disponible côté client via process.env
  // Vérifier d'abord process.env (disponible côté client et serveur)
  const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
  
  // Si la clé commence par pk_live_, on est en mode LIVE
  if (publishableKey && publishableKey.startsWith('pk_live_')) {
    return 'live'
  }
  
  // Si on est en production (NODE_ENV=production) et qu'on n'a pas de clé de test, utiliser LIVE
  if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
    // Côté serveur en production, utiliser LIVE par défaut
    return 'live'
  }
  
  // Par défaut, on est en mode TEST
  return 'test'
}

// Helper pour obtenir le bon Price ID selon l'environnement (au runtime)
// NOTE: Le frontend peut envoyer n'importe quel Price ID, l'API checkout le remplacera par le bon
const getPriceId = (testId: string, liveId?: string) => {
  // Toujours retourner un Price ID valide (même si c'est celui de test)
  // L'API checkout déterminera le bon Price ID côté serveur
  return testId
}

// Base des produits (sans Price IDs)
const baseProducts = [
  {
    id: 'dialogue',
    name: 'Dialogue Avant l\'atterrissage',
    description: 'Génération d\'un Dialogue Avant l\'atterrissage.',
    price: 9.99,
    currency: 'cad',
    testPriceId: 'price_1Sr8qkJOod2H9eSE8QV72G4p', // TEST
    livePriceId: 'price_1Sw9inJp4kRSmzLn7wY3DIUT', // LIVE
    type: 'one-time' as const,
    launchOffer: true,
  },
  {
    id: 'reading-2026',
    name: 'Révolution solaire',
    description: 'Générer le dialogue des quatre saisons à venir.',
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
    livePriceId: 'price_1SrTNsJOod2H9eSEa2Nz1heK', // LIVE (placeholder)
    type: 'one-time' as const,
    launchOffer: false,
  },
]

// Fonction pour obtenir les produits avec les Price IDs calculés au runtime
// Cette fonction est appelée à chaque fois qu'on a besoin des produits
export const getOneTimeProducts = (): Product[] => {
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

// Produits à la pièce (pour compatibilité, mais utiliser getOneTimeProducts() de préférence)
export const oneTimeProducts: Product[] = getOneTimeProducts()

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
      'Dialogues Avant l\'atterrissage',
      'Calculs de thème natal avancés',
      'Progressions et retours solaires',
      'Export PDF de vos analyses',
      'Support prioritaire',
    ],
  },
]

// Tous les produits (pour affichage)
export const allProducts: Product[] = [...oneTimeProducts, ...subscriptions]
