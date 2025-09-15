import { NextRequest, NextResponse } from 'next/server'
import { auth } from './lib/auth'

export async function middleware(request: NextRequest) {
  // Skip middleware for static files and public API routes
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname === '/favicon.ico' ||
    request.nextUrl.pathname.startsWith('/public')
  ) {
    return NextResponse.next()
  }

  // Add security headers to all responses
  const response = NextResponse.next()
  
  // Security headers
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')
  
  // CSP for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    response.headers.set('Content-Security-Policy', "default-src 'none'")
  }

  // Protected API routes require authentication
  const protectedApiRoutes = ['/api/analyze', '/api/export']
  const isProtectedApi = protectedApiRoutes.some(route => 
    request.nextUrl.pathname.startsWith(route)
  )

  if (isProtectedApi) {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
