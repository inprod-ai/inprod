import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { randomBytes } from 'crypto'

// CLI auth flow:
// 1. CLI calls GET /api/cli/auth?port=9876
// 2. We redirect to GitHub OAuth
// 3. After OAuth, redirect to localhost:9876/callback?token=xxx
// 4. CLI saves token locally

export async function GET(request: NextRequest) {
  const port = request.nextUrl.searchParams.get('port')
  
  if (!port) {
    return NextResponse.json({ error: 'Port required' }, { status: 400 })
  }

  // Validate port is a number
  const portNum = parseInt(port)
  if (isNaN(portNum) || portNum < 1024 || portNum > 65535) {
    return NextResponse.json({ error: 'Invalid port' }, { status: 400 })
  }

  // Store the port in a temporary state for the callback
  const state = randomBytes(32).toString('hex')
  
  // Store state -> port mapping (expires in 5 minutes)
  await prisma.rateLimit.create({
    data: {
      key: `cli_auth_${state}`,
      count: portNum,
      resetAt: new Date(Date.now() + 5 * 60 * 1000)
    }
  })

  // Redirect to GitHub OAuth with our callback
  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize')
  githubAuthUrl.searchParams.set('client_id', process.env.GITHUB_CLIENT_ID!)
  githubAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXTAUTH_URL}/api/cli/auth/callback`)
  githubAuthUrl.searchParams.set('scope', 'read:user user:email')
  githubAuthUrl.searchParams.set('state', state)

  return NextResponse.redirect(githubAuthUrl.toString())
}

// Callback from GitHub OAuth
export async function POST(request: NextRequest) {
  // This is called internally to complete the auth flow
  // Used by the callback route to create a session token
  
  try {
    const body = await request.json()
    const { userId, port } = body

    if (!userId || !port) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create a CLI session token
    const sessionToken = randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await prisma.session.create({
      data: {
        sessionToken,
        userId,
        expires
      }
    })

    return NextResponse.json({ 
      token: sessionToken,
      expires: expires.toISOString()
    })

  } catch (error) {
    console.error('CLI auth error:', error)
    return NextResponse.json({ error: 'Auth failed' }, { status: 500 })
  }
}

