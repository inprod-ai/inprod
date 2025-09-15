import { validateEnv } from './validation'

// Validate environment variables at startup
export const env = validateEnv()

// Export validated env vars for type safety
export const {
  ANTHROPIC_API_KEY,
  GITHUB_CLIENT_ID,
  GITHUB_CLIENT_SECRET,
  STRIPE_SECRET_KEY,
  DATABASE_URL,
  NEXTAUTH_SECRET,
  NEXTAUTH_URL,
} = env