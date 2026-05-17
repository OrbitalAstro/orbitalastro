'use client'

import { Sparkles, Calendar, Gift, Check, Users, BookOpenText, ShoppingBag } from 'lucide-react'
import { getOneTimeProducts, subscriptions } from '@/lib/stripe'
import Link from 'next/link'
import Starfield from '@/components/Starfield'
import AddToCartButton from '@/components/AddToCartButton'

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-dark via-deep-space to-cosmic-dark text-white py-20 px-4 relative">
      <Starfield />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cosmic-gold to-cosmic-purple bg-clip-text text-transparent">
            Nos Services
          </h1>
          <p className="text-xl text-cosmic-silver mb-6">
            Choisissez un service, entrez les informations de naissance, puis payez depuis le panier.
            Vous pouvez commander le même produit pour plusieurs personnes.
          </p>
          <Link
            href="/checkout"
            className="inline-flex items-center gap-2 rounded-lg border border-cosmic-gold/50 bg-cosmic-gold/10 px-5 py-2.5 text-cosmic-gold font-semibold hover:bg-cosmic-gold/20 transition"
          >
            <ShoppingBag className="h-5 w-5" />
            Voir le panier et payer
          </Link>
        </div>

        <div className="max-w-2xl mx-auto mb-12 p-6 bg-deep-space/50 border border-cosmic-gold/30 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <Gift className="h-6 w-6 text-cosmic-gold" />
            <h3 className="text-xl font-bold text-white">Code promo</h3>
          </div>
          <p className="text-cosmic-silver text-sm">
            Entrez votre code promo à l&apos;étape de paiement sur la page{' '}
            <Link href="/checkout" className="text-cosmic-gold underline">
              panier
            </Link>
            .
          </p>
        </div>

        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-white">Services à la pièce</h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {getOneTimeProducts().map((product) => (
              <div
                key={product.id}
                className="rounded-2xl p-8 bg-gradient-to-br from-cosmic-gold/10 to-cosmic-purple/10 border-2 border-cosmic-gold relative flex flex-col h-full"
              >
                {product.launchOffer && (
                  <div className="absolute top-4 right-4 px-3 py-1 bg-cosmic-gold text-black text-xs font-bold rounded-full">
                    OFFRE DE LANCEMENT
                  </div>
                )}
                <div className="text-center flex-grow flex flex-col justify-start">
                  {product.id === 'dialogue' ? (
                    <Sparkles className="h-12 w-12 text-cosmic-gold mx-auto mb-4" />
                  ) : product.id === 'reading-2026' ? (
                    <Calendar className="h-12 w-12 text-cosmic-gold mx-auto mb-4" />
                  ) : (
                    <Users className="h-12 w-12 text-cosmic-gold mx-auto mb-4" />
                  )}
                  <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
                  <p className="text-cosmic-silver text-sm mb-4">{product.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-cosmic-gold">${product.price}</span>
                    <span className="text-cosmic-silver ml-2">CAD</span>
                  </div>
                </div>
                {product.id === 'valentine-2026' ? (
                  <button
                    disabled
                    className="w-full py-3 px-6 bg-gray-500/50 text-gray-300 font-semibold rounded-lg cursor-not-allowed mt-6"
                  >
                    Bientôt disponible
                  </button>
                ) : (
                  <AddToCartButton productId={product.id} className="mt-6" label="Commander" />
                )}
              </div>
            ))}
          </div>
        </div>

        {subscriptions.length > 0 ? (
          <div>
            <h2 className="text-3xl font-bold text-center mb-8 text-white">
              Journal pilote — abonnement mensuel
            </h2>
            <div className="max-w-3xl mx-auto">
              {subscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="rounded-2xl p-8 bg-gradient-to-br from-cosmic-purple/20 to-cosmic-gold/20 border-2 border-cosmic-purple"
                >
                  <div className="text-center mb-6">
                    <BookOpenText className="h-12 w-12 text-cosmic-purple mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">{subscription.name}</h3>
                    <p className="text-cosmic-silver text-sm mb-4">{subscription.description}</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-5xl font-bold text-cosmic-purple">${subscription.price}</span>
                      <span className="text-cosmic-silver ml-2">CAD / mois</span>
                    </div>
                  </div>
                  {subscription.features ? (
                    <ul className="space-y-3 mb-8">
                      {subscription.features.map((feature) => (
                        <li key={feature} className="flex items-start">
                          <Check className="h-5 w-5 text-cosmic-purple mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-cosmic-silver">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <AddToCartButton
                    productId={subscription.id}
                    label="Configurer l'abonnement"
                    className="w-full py-3 px-6 bg-cosmic-purple hover:bg-cosmic-purple/90 text-white font-semibold rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <p className="text-center mt-12 text-cosmic-silver text-sm">
          Paiement sécurisé par Stripe sur la page{' '}
          <Link href="/checkout" className="text-cosmic-gold hover:underline">
            panier
          </Link>
          .{' '}
          <Link href="/contact" className="text-cosmic-gold hover:underline">
            Questions ?
          </Link>
        </p>
      </div>
    </div>
  )
}
