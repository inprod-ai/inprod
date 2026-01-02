import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock environment variables
process.env.NODE_ENV = 'test'
process.env.ENCRYPTION_SECRET = 'test-secret-key-minimum-32-characters-long'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

