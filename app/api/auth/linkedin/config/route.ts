import { NextResponse } from 'next/server'

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_LINKEDIN_CLIENT_ID
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET

  return NextResponse.json({
    configured: !!(clientId && clientSecret),
    clientId: clientId ? `${clientId.substring(0, 6)}...` : 'NOT_SET',
    clientSecret: clientSecret ? 'SET' : 'NOT_SET',
    message: !!(clientId && clientSecret) 
      ? 'LinkedIn OAuth is properly configured' 
      : 'LinkedIn OAuth is missing credentials'
  })
}