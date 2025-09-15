import Stripe from 'stripe'

// Validate required environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-08-27.basil',
  typescript: true,
})

export const PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_test' // Pro monthly subscription price ID
