import { prisma } from './prisma'

interface RateLimitResult {
  success: boolean
  reset: number
  remaining: number
}

export async function rateLimit(
  identifier: string,
  limit: number = 5,
  windowMs: number = 24 * 60 * 60 * 1000 // 24 hours
): Promise<RateLimitResult> {
  const now = Date.now()
  const windowStart = now - windowMs

  try {
    // Clean up old entries
    await prisma.$executeRaw`
      DELETE FROM "RateLimit" 
      WHERE "createdAt" < ${new Date(windowStart)}
    `

    // Count requests in current window
    const count = await prisma.rateLimit.count({
      where: {
        identifier,
        createdAt: {
          gte: new Date(windowStart)
        }
      }
    })

    if (count >= limit) {
      return {
        success: false,
        reset: Math.ceil(windowStart + windowMs),
        remaining: 0
      }
    }

    // Record this request
    await prisma.rateLimit.create({
      data: {
        identifier
      }
    })

    return {
      success: true,
      reset: Math.ceil(windowStart + windowMs),
      remaining: limit - count - 1
    }
  } catch (error) {
    console.error('Rate limiting error:', error)
    // Fail open in case of database issues
    return {
      success: true,
      reset: now + windowMs,
      remaining: limit - 1
    }
  }
}