import { createClient } from '@supabase/supabase-js'

// Client Supabase pour le serveur (utilise Service Role Key)
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// Types pour la base de données
export interface Subscriber {
  id: string
  email: string
  first_name?: string | null
  language: 'fr' | 'en' | 'es'
  subscribed_to_newsletter: boolean
  subscribed_to_product_updates: boolean
  subscribed_to_promotions: boolean
  source?: string | null
  stripe_customer_id?: string | null
  created_at: string
  updated_at: string
  last_email_sent_at?: string | null
  email_verified: boolean
  unsubscribed_at?: string | null
}

export interface Generation {
  id: string
  customer_email: string
  product_id: string
  stripe_session_id?: string | null
  payment_id?: string | null
  generated_at: string
  content_preview?: string | null
  metadata?: Record<string, any> | null
}

export interface Payment {
  id: string
  stripe_session_id: string
  stripe_customer_id?: string | null
  customer_email: string
  product_id: string
  amount_paid: number
  currency: string
  status: string
  created_at: string
  updated_at: string
}

