import Stripe from 'stripe'

export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-08-27.basil',
      typescript: true,
    })
  : null as any

export const PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_test' // Pro monthly subscription price ID
