import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { code, redirect_uri } = await request.json()

    if (!code) {
      return NextResponse.json({ error: 'Authorization code is required' }, { status: 400 })
    }

    const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.json({ 
        error: 'LinkedIn OAuth not configured. Missing client credentials.',
        details: 'Please set NEXT_PUBLIC_LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET environment variables.'
      }, { status: 500 })
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri || `${process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000'}/auth/linkedin/callback`,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    })

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('LinkedIn token exchange failed:', errorData)
      return NextResponse.json({ 
        error: 'Failed to exchange code for token',
        details: errorData
      }, { status: 400 })
    }

    const tokenData = await tokenResponse.json()
    console.log('LinkedIn token exchange successful:', {
      expires_in: tokenData.expires_in,
      scope: tokenData.scope
    })
    
    return NextResponse.json({
      access_token: tokenData.access_token,
      expires_in: tokenData.expires_in,
      scope: tokenData.scope
    })

  } catch (error) {
    console.error('LinkedIn token exchange error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

