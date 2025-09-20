import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('🔍 Testing database connection and user data...')
    
    const supabase = await createClient()
    
    // Test 1: Basic connection
    console.log('1. Testing database connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      console.error('❌ Connection failed:', connectionError)
      return NextResponse.json({ error: 'Connection failed', details: connectionError })
    }
    console.log('✅ Database connection successful')
    
    // Test 2: Check all users
    console.log('2. Checking all users in profiles table...')
    const { data: allUsers, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        role,
        university_id,
        verified,
        linkedin_url,
        created_at,
        university:universities(name)
      `)
      .order('created_at', { ascending: false })
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return NextResponse.json({ error: 'Error fetching users', details: usersError })
    }
    
    console.log(`📊 Total users found: ${allUsers?.length || 0}`)
    
    // Test 3: Check pending verifications (what admin sees)
    console.log('3. Checking pending verifications (admin dashboard query)...')
    const { data: pendingUsers, error: pendingError } = await supabase
      .from('profiles')
      .select('*, university:universities(*)')
      .eq('verified', false)
      .in('role', ['alumni', 'student'])
      .order('created_at', { ascending: false })
    
    if (pendingError) {
      console.error('❌ Error fetching pending users:', pendingError)
      return NextResponse.json({ error: 'Error fetching pending users', details: pendingError })
    }
    
    console.log(`📊 Pending verifications: ${pendingUsers?.length || 0}`)
    
    // Test 4: Check universities
    console.log('4. Checking universities...')
    const { data: universities, error: universitiesError } = await supabase
      .from('universities')
      .select('*')
      .order('name')
    
    if (universitiesError) {
      console.error('❌ Error fetching universities:', universitiesError)
      return NextResponse.json({ error: 'Error fetching universities', details: universitiesError })
    }
    
    console.log(`📊 Total universities: ${universities?.length || 0}`)
    
    const results = {
      success: true,
      timestamp: new Date().toISOString(),
      connection: 'successful',
      stats: {
        totalUsers: allUsers?.length || 0,
        pendingVerifications: pendingUsers?.length || 0,
        totalUniversities: universities?.length || 0
      },
      data: {
        allUsers: allUsers || [],
        pendingUsers: pendingUsers || [],
        universities: universities || []
      }
    }
    
    console.log('✅ Database test completed!')
    
    return NextResponse.json(results)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return NextResponse.json({ 
      error: 'Test failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}