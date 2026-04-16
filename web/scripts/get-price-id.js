/**
 * Script pour récupérer le Price ID depuis un Product ID
 */

const Stripe = require('stripe')
require('dotenv').config({ path: require('path').join(__dirname, '../..', '.env') })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia',
})

const productId = process.argv[2] || 'prod_TomRXEW7yT0JNm'

async function getPriceId() {
  try {
    console.log(`🔍 Recherche du Price ID pour le produit: ${productId}\n`)

    // Récupérer tous les prix pour ce produit
    const prices = await stripe.prices.list({
      product: productId,
      limit: 100,
    })

    if (prices.data.length === 0) {
      console.error(`❌ Aucun prix trouvé pour le produit ${productId}`)
      console.log('\n💡 Vérifiez que:')
      console.log('   1. Le produit existe dans Stripe Dashboard')
      console.log('   2. Le produit a un prix configuré')
      console.log('   3. Vous êtes dans le bon mode (TEST/LIVE)')
      return
    }

    console.log(`✅ ${prices.data.length} prix trouvé(s):\n`)

    for (const price of prices.data) {
      console.log(`📦 Price ID: ${price.id}`)
      console.log(`   Montant: ${price.unit_amount / 100} ${price.currency.toUpperCase()}`)
      console.log(`   Type: ${price.type}`)
      console.log(`   Actif: ${price.active ? 'Oui ✅' : 'Non ❌'}`)
      if (price.recurring) {
        console.log(`   Intervalle: ${price.recurring.interval}`)
      }
      console.log('')

      // Si c'est un prix unique actif de 9.99 CAD, c'est probablement le bon
      if (
        price.active &&
        price.type === 'one_time' &&
        price.unit_amount === 999 && // 9.99 CAD en centimes
        price.currency === 'cad'
      ) {
        console.log(`🎯 Price ID recommandé pour Lecture 2026: ${price.id}\n`)
      }
    }

    // Afficher le premier prix actif comme recommandation
    const activePrice = prices.data.find(p => p.active)
    if (activePrice) {
      console.log(`\n✅ Price ID à utiliser: ${activePrice.id}`)
      console.log(`\n📝 Mettez à jour web/lib/stripe.ts avec:`)
      console.log(`   stripePriceId: '${activePrice.id}'`)
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    if (error.message.includes('No such product')) {
      console.log('\n💡 Le Product ID n\'existe pas. Vérifiez:')
      console.log('   1. Que vous êtes dans le bon mode (TEST/LIVE)')
      console.log('   2. Que le Product ID est correct')
    }
  }
}

getPriceId()

