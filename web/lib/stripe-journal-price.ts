/** Price IDs Stripe pour l'abonnement journal (serveur uniquement). */
export function getJournalMonthlyStripePriceId(): string | null {
  const secretKey = process.env.STRIPE_SECRET_KEY || ''
  const isLive = secretKey.startsWith('sk_live_')
  const id = isLive
    ? process.env.STRIPE_PRICE_JOURNAL_MONTHLY_LIVE?.trim()
    : process.env.STRIPE_PRICE_JOURNAL_MONTHLY_TEST?.trim()
  return id || null
}

export function isJournalMonthlyCheckoutConfigured(): boolean {
  return Boolean(getJournalMonthlyStripePriceId())
}
