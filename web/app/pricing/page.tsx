'use client'

import { useState, useEffect } from 'react'
import { Loader2, CreditCard, Sparkles, Calendar, Gift, Check, Heart, Infinity } from 'lucide-react'
import { oneTimeProducts, subscriptions, type Product } from '@/lib/stripe'
import { useRouter } from 'next/navigation'
import Starfield from '@/components/Starfield'

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)
  const [sessionStatus, setSessionStatus] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [acceptPromotions, setAcceptPromotions] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const canceled = params.get('canceled')
    const product = params.get('product')

    if (success) {
      setSessionStatus('success')
      const sessionId = params.get('session_id')
      
      // Rediriger vers la page du produit acheté
      let redirectUrl = ''
      if (product === 'dialogue') {
        redirectUrl = `/dialogues?purchased=true${sessionId ? `&session_id=${sessionId}` : ''}`
      } else if (product === 'reading-2026') {
        redirectUrl = `/reading-2026?purchased=true${sessionId ? `&session_id=${sessionId}` : ''}`
      } else if (product === 'valentine-2026') {
        redirectUrl = `/saint-valentin?purchased=true${sessionId ? `&session_id=${sessionId}` : ''}`
      } else if (product === 'monthly') {
        redirectUrl = '/dashboard?subscribed=true'
      }
      
      // Utiliser window.location.href pour une redirection immédiate
      if (redirectUrl) {
        window.location.href = redirectUrl
      } else {
        // Si pas de produit spécifique, juste nettoyer l'URL
        window.history.replaceState({}, '', '/pricing')
      }
    } else if (canceled) {
      setSessionStatus('canceled')
      window.history.replaceState({}, '', '/pricing')
    }
  }, [router])

  const handlePurchase = async (product: Product) => {
    if (!product.stripePriceId) {
      alert('Ce produit n\'est pas encore configuré. Veuillez contacter le support.')
      return
    }

    setLoading(product.id)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: product.stripePriceId,
          productId: product.id,
          email: email || undefined,
          promoCode: appliedPromo || promoCode || undefined,
          acceptPromotions: acceptPromotions,
        }),
      })

      const { url, error } = await response.json()

      if (error) {
        alert(`Erreur: ${error}`)
        setLoading(null)
        return
      }

      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Une erreur est survenue lors de l\'initialisation du paiement.')
      setLoading(null)
    }
  }

  const handlePromoCode = () => {
    if (promoCode.trim()) {
      setAppliedPromo(promoCode.trim().toUpperCase())
      alert('Code promo appliqué ! Il sera utilisé lors du paiement.')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-cosmic-dark via-deep-space to-cosmic-dark text-white py-20 px-4 relative">
      <Starfield />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-cosmic-gold to-cosmic-purple bg-clip-text text-transparent">
            Nos Services
          </h1>
          <p className="text-xl text-cosmic-silver mb-4">
            Offre de lancement - Prix spéciaux
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cosmic-gold/20 border border-cosmic-gold/50 rounded-lg">
            <Sparkles className="h-5 w-5 text-cosmic-gold" />
            <span className="text-cosmic-gold font-semibold">Offre de lancement</span>
          </div>
        </div>

        {sessionStatus === 'success' && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-green-900/30 border border-green-500 rounded-lg">
            <p className="text-green-400 text-center">
              ✅ Paiement réussi ! Vous allez être redirigé vers votre produit.
            </p>
          </div>
        )}

        {sessionStatus === 'canceled' && (
          <div className="max-w-2xl mx-auto mb-8 p-4 bg-yellow-900/30 border border-yellow-500 rounded-lg">
            <p className="text-yellow-400 text-center">
              ⚠️ Paiement annulé. Vous pouvez réessayer à tout moment.
            </p>
          </div>
        )}

        {/* Code promo pour Lecture 2026 */}
        <div className="max-w-2xl mx-auto mb-12 p-6 bg-deep-space/50 border border-cosmic-gold/30 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <Gift className="h-6 w-6 text-cosmic-gold" />
            <h3 className="text-xl font-bold text-white">Vous avez un code promo ?</h3>
          </div>
          <p className="text-cosmic-silver mb-4 text-sm">
            Si vous avez répondu à notre sondage, vous avez reçu un code promo unique pour la <strong>Lecture 2026</strong> (50% de rabais).
          </p>
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Entrez votre code promo"
              className="flex-1 px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-cosmic-silver focus:outline-none focus:border-cosmic-gold focus:ring-1 focus:ring-cosmic-gold"
            />
            <button
              onClick={handlePromoCode}
              className="px-6 py-2 bg-cosmic-gold hover:bg-cosmic-gold/90 text-black font-semibold rounded-lg transition"
            >
              Appliquer
            </button>
          </div>
          {appliedPromo && (
            <p className="text-green-400 text-sm">
              ✓ Code promo appliqué : {appliedPromo} (50% de rabais sur la Lecture 2026)
            </p>
          )}
        </div>

        {/* Produits à la pièce */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-white">
            Services à la pièce
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {oneTimeProducts.map((product) => (
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
                    <Heart className="h-12 w-12 text-cosmic-gold mx-auto mb-4" />
                  )}
                  <h3 className="text-2xl font-bold mb-2">{product.name}</h3>
                  <p className="text-cosmic-silver text-sm mb-4">{product.description}</p>
                  <div className="flex items-baseline justify-center">
                    <span className="text-5xl font-bold text-cosmic-gold">
                      ${product.price}
                    </span>
                    <span className="text-cosmic-silver ml-2">CAD</span>
                  </div>
                  {product.launchOffer && (
                    <p className="text-sm text-cosmic-gold mt-2">
                      Prix de lancement
                    </p>
                  )}
                  {product.id === 'reading-2026' && appliedPromo && (
                    <p className="text-sm text-green-400 mt-2">
                      ✓ Code promo appliqué (50% de rabais)
                    </p>
                  )}
                </div>

                {/* Message d'avertissement pour paiement réel */}
                <div className="mt-4 p-4 bg-yellow-500/20 border-2 border-yellow-500/50 rounded-lg">
                  <p className="text-yellow-200 text-sm font-semibold text-center">
                    ⚠️ Paiement final et définitif
                  </p>
                  <p className="text-yellow-300/80 text-xs text-center mt-1">
                    Ce paiement sera débité immédiatement de votre carte bancaire.
                  </p>
                </div>

                {/* Case à cocher pour accepter les promotions */}
                <div className="mt-4 flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                  <input
                    type="checkbox"
                    id={`promotions-${product.id}`}
                    checked={acceptPromotions}
                    onChange={(e) => setAcceptPromotions(e.target.checked)}
                    className="mt-1 h-4 w-4 rounded border-white/30 bg-white/10 text-cosmic-gold focus:ring-2 focus:ring-cosmic-gold focus:ring-offset-0 cursor-pointer"
                  />
                  <label
                    htmlFor={`promotions-${product.id}`}
                    className="text-sm text-cosmic-silver cursor-pointer flex-1"
                  >
                    J'accepte de recevoir des promotions et offres spéciales par email
                  </label>
                </div>

                <button
                  onClick={() => handlePurchase(product)}
                  disabled={loading === product.id}
                  className="w-full py-3 px-6 bg-cosmic-gold hover:bg-cosmic-gold/90 text-black font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                >
                  {loading === product.id ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Chargement...
                    </>
                  ) : (
                    <>
                      <CreditCard className="h-5 w-5" />
                      Acheter maintenant
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Abonnements */}
        {subscriptions.some(sub => sub.stripePriceId) && (
          <div>
            <h2 className="text-3xl font-bold text-center mb-8 text-white">
              Abonnement
            </h2>
            <div className="grid md:grid-cols-1 gap-8 max-w-3xl mx-auto">
              {subscriptions.map((subscription) => (
                <div
                  key={subscription.id}
                  className="rounded-2xl p-8 bg-gradient-to-br from-cosmic-purple/20 to-cosmic-gold/20 border-2 border-cosmic-purple relative"
                >
                  <div className="text-center mb-6">
                    <Infinity className="h-12 w-12 text-cosmic-purple mx-auto mb-4" />
                    <h3 className="text-2xl font-bold mb-2">{subscription.name}</h3>
                    <p className="text-cosmic-silver text-sm mb-4">{subscription.description}</p>
                    <div className="flex items-baseline justify-center">
                      <span className="text-5xl font-bold text-cosmic-purple">
                        ${subscription.price}
                      </span>
                      <span className="text-cosmic-silver ml-2">CAD / {subscription.interval === 'month' ? 'mois' : 'an'}</span>
                    </div>
                  </div>

                  {subscription.features && (
                    <ul className="space-y-3 mb-8">
                      {subscription.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <Check className="h-5 w-5 text-cosmic-purple mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-cosmic-silver">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Message d'avertissement pour paiement réel */}
                  <div className="mb-6 p-4 bg-yellow-500/20 border-2 border-yellow-500/50 rounded-lg">
                    <p className="text-yellow-200 text-sm font-semibold text-center">
                      ⚠️ Paiement final et définitif
                    </p>
                    <p className="text-yellow-300/80 text-xs text-center mt-1">
                      Ce paiement sera débité immédiatement de votre carte bancaire.
                    </p>
                  </div>

                  {/* Case à cocher pour accepter les promotions */}
                  <div className="mb-6 flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
                    <input
                      type="checkbox"
                      id={`promotions-${subscription.id}`}
                      checked={acceptPromotions}
                      onChange={(e) => setAcceptPromotions(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-white/30 bg-white/10 text-cosmic-purple focus:ring-2 focus:ring-cosmic-purple focus:ring-offset-0 cursor-pointer"
                    />
                    <label
                      htmlFor={`promotions-${subscription.id}`}
                      className="text-sm text-cosmic-silver cursor-pointer flex-1"
                    >
                      J'accepte de recevoir des promotions et offres spéciales par email
                    </label>
                  </div>

                  <button
                    onClick={() => handlePurchase(subscription)}
                    disabled={loading === subscription.id}
                    className="w-full py-3 px-6 bg-cosmic-purple hover:bg-cosmic-purple/90 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading === subscription.id ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-5 w-5" />
                        S'abonner maintenant
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-12 text-cosmic-silver">
          <p className="mb-2">
            Paiement sécurisé par Stripe. Aucune information de carte n'est stockée sur nos serveurs.
          </p>
          <p className="text-sm">
            Questions ?{' '}
            <a href="/about" className="text-cosmic-gold hover:underline">
              Contactez-nous
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
