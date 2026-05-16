import {
  getOneTimeProducts,
  journalMonthlySubscription,
  subscriptions,
  type Product,
} from '@/lib/stripe'

const catalog: Product[] = [
  ...getOneTimeProducts(),
  ...subscriptions,
]

export function getProductById(productId: string): Product | undefined {
  return catalog.find((p) => p.id === productId)
}

export function getAllSellableProducts(): Product[] {
  return catalog.filter((p) => p.id !== 'valentine-2026')
}

export function getProductDestination(productId: string): string {
  switch (productId) {
    case 'dialogue':
      return '/dialogues?purchased=true'
    case 'reading-2026':
      return '/reading-2026?purchased=true'
    case 'valentine-2026':
      return '/saint-valentin?purchased=true'
    case 'journal-monthly':
    case 'monthly':
      return '/journal-pilot?subscribed=true'
    default:
      return '/pricing'
  }
}
