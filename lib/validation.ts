import { z } from 'zod'

// URL validation schema
export const repoUrlSchema = z.string()
  .url('Invalid URL format')
  .refine(url => {
    try {
      const parsed = new URL(url)
      return parsed.hostname === 'github.com' && 
             parsed.pathname.match(/^\/[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+\/?$/)
    } catch {
      return false
    }
  }, 'Must be a valid GitHub repository URL')

// Repository info validation
export const analyzeRequestSchema = z.object({
  repoUrl: repoUrlSchema,
  owner: z.string()
    .min(1, 'Owner is required')
    .max(100, 'Owner name too long')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Invalid owner format'),
  repo: z.string()
    .min(1, 'Repository name is required')
    .max(100, 'Repository name too long')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Invalid repository format')
})

// PDF export validation
export const pdfExportSchema = z.object({
  scanId: z.string().cuid('Invalid scan ID format')
})

// Environment variable validation
export const envSchema = z.object({
  ANTHROPIC_API_KEY: z.string().min(1, 'ANTHROPIC_API_KEY is required'),
  GITHUB_CLIENT_ID: z.string().min(1, 'GITHUB_CLIENT_ID is required'),
  GITHUB_CLIENT_SECRET: z.string().min(1, 'GITHUB_CLIENT_SECRET is required'),
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid URL'),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL').optional(),
})

export function validateEnv() {
  try {
    return envSchema.parse(process.env)
  } catch (error) {
    console.error('❌ Environment validation failed:')
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        console.error(`  ${err.path.join('.')}: ${err.message}`)
      })
    }
    process.exit(1)
  }
}