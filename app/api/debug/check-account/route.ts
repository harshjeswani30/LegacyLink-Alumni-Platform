import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email.toLowerCase())
      .maybeSingle()

    // Try to resend verification to check account status
    const { data: resendData, error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email.toLowerCase()
    })

    return NextResponse.json({
      email: email.toLowerCase(),
      profile_exists: !!profile,
      profile_data: profile ? {
        id: profile.id,
        email: profile.email,
        verified: profile.verified,
        full_name: profile.full_name,
        created_at: profile.created_at
      } : null,
      profile_error: profileError?.message,
      resend_result: resendError ? {
        error: resendError.message,
        likely_meaning: resendError.message.toLowerCase().includes('already confirmed') 
          ? 'Email is verified - account exists'
          : resendError.message.toLowerCase().includes('user not found')
          ? 'No account with this email'
          : 'Other issue'
      } : 'Verification email sent',
      recommendations: resendError?.message.toLowerCase().includes('already confirmed') 
        ? ['Your email is verified', 'Try password reset if you forgot password', 'Check for typos in password']
        : resendError?.message.toLowerCase().includes('user not found')
        ? ['No account found', 'You need to sign up first', 'Check if you used a different email']
        : ['Verification email sent', 'Check your inbox', 'Click verification link then try login']
    })

  } catch (error) {
    console.error('Account check error:', error)
    return NextResponse.json(
      { error: 'Failed to check account status' },
      { status: 500 }
    )
  }
}