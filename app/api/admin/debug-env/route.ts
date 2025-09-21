import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service"

// Debug endpoint to check environment and service configuration
export async function POST(_request: NextRequest) {
  try {
    console.log('🔍 Debug endpoint called')
    
    // Check environment variables
    const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
    const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('Environment check:', { hasSupabaseUrl, hasAnonKey, hasServiceKey })
    
    // Test regular client
    let regularClientWorking = false
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      regularClientWorking = !!user
      console.log('Regular client working:', regularClientWorking, 'User ID:', user?.id)
    } catch (error) {
      console.error('Regular client error:', error)
    }
    
    // Test service role client
    let serviceClientWorking = false
    try {
      const serviceSupabase = createServiceRoleClient()
      const { data, error } = await serviceSupabase.from('profiles').select('id').limit(1)
      serviceClientWorking = !error
      console.log('Service client working:', serviceClientWorking, 'Error:', error?.message)
    } catch (error) {
      console.error('Service client error:', error)
    }
    
    return NextResponse.json({
      environment: {
        hasSupabaseUrl,
        hasAnonKey,
        hasServiceKey
      },
      clients: {
        regularClientWorking,
        serviceClientWorking
      },
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({ 
      error: "Debug failed", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}