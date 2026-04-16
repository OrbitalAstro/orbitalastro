/**
 * Script pour créer les produits Stripe directement via l'API
 * 
 * Usage: node scripts/create-stripe-products.js
 * 
 * Assurez-vous d'avoir STRIPE_SECRET_KEY dans votre fichier .env
 */

const Stripe = require('stripe')
const fs = require('fs')
const path = require('path')

// Charger les variables d'environnement depuis .env (à la racine du projet)
const envPath = path.join(__dirname, '../..', '.env')
console.log('📁 Chargement du .env depuis:', envPath)
require('dotenv').config({ path: envPath })

const secretKey = process.env.STRIPE_SECRET_KEY
if (!secretKey) {
  console.error('❌ ERREUR: STRIPE_SECRET_KEY n\'est pas défini dans le fichier .env')
  console.error('   Vérifiez que le fichier .env contient: STRIPE_SECRET_KEY=sk_test_...')
  process.exit(1)
}

console.log('✅ Clé secrète trouvée:', secretKey.substring(0, 20) + '...\n')

const stripe = new Stripe(secretKey, {
  apiVersion: '2024-11-20.acacia',
})

async function createProducts() {
  console.log('🚀 Création des produits Stripe...\n')

  const products = [
    {
      name: 'Dialogue Pré-Incarnation',
      description: 'Générez votre dialogue symbolique entre votre âme et le conseil cosmique avant votre naissance.',
      price: 9.99,
      currency: 'cad',
      type: 'one-time',
    },
    {
      name: 'Lecture 2026',
      description: 'Votre lecture astrologique complète pour l\'année 2026, basée sur votre thème natal et les transits à venir.',
      price: 9.99,
      currency: 'cad',
      type: 'one-time',
    },
    {
      name: 'Abonnement Mensuel',
      description: 'Accès complet à toutes les fonctionnalités astrologiques.',
      price: 12.99,
      currency: 'cad',
      type: 'subscription',
      interval: 'month',
    },
  ]

  const results = []

  for (const product of products) {
    try {
      console.log(`📦 Création de: ${product.name}...`)

      // Créer le produit
      const stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description,
      })

      // Créer le prix
      const priceData = {
        product: stripeProduct.id,
        unit_amount: Math.round(product.price * 100), // Convertir en centimes
        currency: product.currency,
      }

      if (product.type === 'subscription') {
        priceData.recurring = {
          interval: product.interval,
        }
      }

      const price = await stripe.prices.create(priceData)

      console.log(`✅ Créé avec succès!`)
      console.log(`   Product ID: ${stripeProduct.id}`)
      console.log(`   Price ID: ${price.id}\n`)

      results.push({
        name: product.name,
        productId: stripeProduct.id,
        priceId: price.id,
        type: product.type,
      })
    } catch (error) {
      console.error(`❌ Erreur pour ${product.name}:`, error.message)
    }
  }

  // Afficher le résumé
  console.log('\n📋 RÉSUMÉ DES PRODUITS CRÉÉS:\n')
  console.log('Copiez ces Price IDs dans web/lib/stripe.ts:\n')
  
  results.forEach((result, index) => {
    const productType = result.type === 'one-time' ? 'oneTimeProducts' : 'subscriptions'
    const productIndex = result.type === 'one-time' 
      ? results.filter(r => r.type === 'one-time').indexOf(result)
      : results.filter(r => r.type === 'subscription').indexOf(result)
    
    console.log(`${result.name}:`)
    console.log(`  stripePriceId: '${result.priceId}'`)
    console.log(`  (À mettre dans ${productType}[${productIndex}].stripePriceId)\n`)
  })

  // Sauvegarder dans un fichier
  const outputPath = path.join(__dirname, 'stripe-products.json')
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2))
  console.log(`💾 Résultats sauvegardés dans: ${outputPath}`)
}

// Exécuter
createProducts().catch(console.error)

