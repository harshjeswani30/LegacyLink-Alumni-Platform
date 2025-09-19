import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID
    const baseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL || 'http://localhost:3000'
    const redirectUri = `${baseUrl}/auth/linkedin/callback`
    
    if (!clientId) {
      return NextResponse.json({
        success: false,
        error: 'LinkedIn client ID not configured',
        redirectUri,
        baseUrl
      })
    }

    // Generate the LinkedIn OAuth URL
    const scope = 'r_liteprofile r_emailaddress'
    const state = Math.random().toString(36).substring(2, 15)
    
    const authUrl = `https://www.linkedin.com/oauth/v2/authorization?` +
      `response_type=code&` +
      `client_id=${encodeURIComponent(clientId)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scope)}&` +
      `state=${state}`

    return NextResponse.json({
      success: true,
      configured: true,
      clientId: `${clientId.substring(0, 6)}...`,
      redirectUri,
      baseUrl,
      authUrl,
      message: 'LinkedIn OAuth is ready to use!'
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to generate LinkedIn OAuth URL',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}