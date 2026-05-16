import { JOURNAL_MONTHLY_PRODUCT_ID } from '@/lib/journal-subscription'
import { getJournalMonthlyStripePriceId } from '@/lib/stripe-journal-price'

export function getPriceIdForProduct(productId: string): string | null {
  const secretKey = process.env.STRIPE_SECRET_KEY || ''
  const isLiveMode = secretKey.startsWith('sk_live_')

  const priceIdMap: Record<string, { test: string; live: string }> = {
    dialogue: {
      test: 'price_1Sr8qkJOod2H9eSE8QV72G4p',
      live: 'price_1Sw9inJp4kRSmzLn7wY3DIUT',
    },
    'reading-2026': {
      test: 'price_1Sr8sKJOod2H9eSERiPO6965',
      live: 'price_1SwAFoJp4kRSmzLnS0MgV7VS',
    },
    'valentine-2026': {
      test: 'price_1SrTNsJOod2H9eSEa2Nz1heK',
      live: 'price_1SrTNsJOod2H9eSEa2Nz1heK',
    },
    [JOURNAL_MONTHLY_PRODUCT_ID]: {
      test: process.env.STRIPE_PRICE_JOURNAL_MONTHLY_TEST || 'price_1TXmKzJOod2H9eSELhFz3A3S',
      live: process.env.STRIPE_PRICE_JOURNAL_MONTHLY_LIVE || '',
    },
    monthly: {
      test: process.env.STRIPE_PRICE_JOURNAL_MONTHLY_TEST || 'price_1TXmKzJOod2H9eSELhFz3A3S',
      live: process.env.STRIPE_PRICE_JOURNAL_MONTHLY_LIVE || '',
    },
  }

  if (productId === JOURNAL_MONTHLY_PRODUCT_ID || productId === 'monthly') {
    return getJournalMonthlyStripePriceId()
  }

  const product = priceIdMap[productId]
  if (!product) return null
  return (isLiveMode ? product.live : product.test) || null
}

export function isSubscriptionProductId(productId: string): boolean {
  return (
    productId === 'monthly' ||
    productId === 'yearly' ||
    productId === JOURNAL_MONTHLY_PRODUCT_ID
  )
}
