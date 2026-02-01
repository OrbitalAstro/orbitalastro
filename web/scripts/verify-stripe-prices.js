/**
 * Script pour vérifier que tous les Price IDs existent dans Stripe
 */

const Stripe = require('stripe')
require('dotenv').config({ path: require('path').join(__dirname, '../..', '.env') })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
})

const products = [
  { id: 'dialogue', priceId: 'price_1Sr8qkJOod2H9eSE8QV72G4p', name: 'Dialogue pré-incarnation' },
  { id: 'reading-2026', priceId: 'price_1Sr8sKJOod2H9eSERIPO6965', name: 'Lecture 2026' },
  { id: 'valentine-2026', priceId: 'price_1SrTNsJOod2H9eSEa2Nz1heK', name: 'Saint-Valentin 2026' },
]

async function verifyPrices() {
  console.log('🔍 Vérification des Price IDs dans Stripe...\n')

  for (const product of products) {
    try {
      const price = await stripe.prices.retrieve(product.priceId)
      console.log(`✅ ${product.name}`)
      console.log(`   Price ID: ${product.priceId}`)
      console.log(`   Montant: ${price.unit_amount / 100} ${price.currency.toUpperCase()}`)
      console.log(`   Type: ${price.type}`)
      console.log(`   Actif: ${price.active ? 'Oui' : 'Non'}\n`)
    } catch (error) {
      console.error(`❌ ${product.name}`)
      console.error(`   Price ID: ${product.priceId}`)
      console.error(`   Erreur: ${error.message}\n`)
      
      // Suggérer de vérifier dans Stripe Dashboard
      console.log(`   💡 Action requise:`)
      console.log(`   1. Allez dans Stripe Dashboard → Produits`)
      console.log(`   2. Trouvez le produit "${product.name}"`)
      console.log(`   3. Copiez le nouveau Price ID`)
      console.log(`   4. Mettez à jour web/lib/stripe.ts\n`)
    }
  }

  // Lister tous les produits dans Stripe
  console.log('\n📋 Tous les produits dans votre compte Stripe:\n')
  try {
    const allProducts = await stripe.products.list({ limit: 100 })
    const allPrices = await stripe.prices.list({ limit: 100 })

    for (const product of allProducts.data) {
      console.log(`📦 ${product.name} (${product.id})`)
      const productPrices = allPrices.data.filter(p => p.product === product.id)
      for (const price of productPrices) {
        console.log(`   💰 Price ID: ${price.id}`)
        console.log(`      Montant: ${price.unit_amount / 100} ${price.currency.toUpperCase()}`)
        console.log(`      Type: ${price.type}`)
        console.log(`      Actif: ${price.active ? 'Oui' : 'Non'}`)
      }
      console.log('')
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error.message)
  }
}

verifyPrices().catch(console.error)

