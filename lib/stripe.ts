import Stripe from 'stripe'
import { STRIPE_SECRET_KEY } from './env'

export const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
})

export const PRICE_ID = process.env.STRIPE_PRICE_ID || 'price_test' // Pro monthly subscription price ID
