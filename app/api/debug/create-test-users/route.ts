import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    console.log('🧪 Creating test users to test admin dashboard visibility...')
    
    const supabase = await createClient()
    
    // First, get a university to associate users with
    const { data: universities, error: uniError } = await supabase
      .from('universities')
      .select('id, name, domain')
      .limit(1)
    
    if (uniError || !universities || universities.length === 0) {
      return NextResponse.json({ 
        error: 'No universities found. Please create a university first.',
        details: uniError 
      })
    }
    
    const university = universities[0]
    
    // Create test users directly in profiles table (simulating completed signup)
    const testUsers = [
      {
        id: crypto.randomUUID(),
        email: 'test.alumni@' + university.domain,
        full_name: 'Test Alumni User',
        role: 'alumni',
        university_id: university.id,
        verified: false // This should make them appear in admin dashboard
      },
      {
        id: crypto.randomUUID(),
        email: 'test.student@' + university.domain,
        full_name: 'Test Student User',
        role: 'student',
        university_id: university.id,
        verified: false // This should make them appear in admin dashboard
      }
    ]
    
    // Insert test users
    const { data: insertedUsers, error: insertError } = await supabase
      .from('profiles')
      .insert(testUsers)
      .select()
    
    if (insertError) {
      console.error('❌ Insert failed:', insertError)
      return NextResponse.json({ 
        error: 'Failed to create test users', 
        details: insertError 
      })
    }
    
    // Now check what admin dashboard query would return
    const { data: pendingUsers, error: pendingError } = await supabase
      .from('profiles')
      .select('*, university:universities(*)')
      .eq('verified', false)
      .in('role', ['alumni', 'student'])
      .order('created_at', { ascending: false })
    
    // Also test university-specific query (what university admin would see)
    const { data: universityPendingUsers, error: uniPendingError } = await supabase
      .from('profiles')
      .select('*, university:universities(*)')
      .eq('verified', false)
      .eq('university_id', university.id)
      .in('role', ['alumni', 'student'])
      .order('created_at', { ascending: false })
    
    return NextResponse.json({
      success: true,
      testUsersCreated: testUsers.length,
      university: {
        id: university.id,
        name: university.name,
        domain: university.domain
      },
      results: {
        insertedUsers: insertedUsers || [],
        allPendingUsers: pendingUsers || [],
        universityPendingUsers: universityPendingUsers || []
      },
      verification: {
        shouldAppearInAdmin: testUsers.length,
        actuallyAppearing: pendingUsers?.length || 0,
        universitySpecific: universityPendingUsers?.length || 0
      },
      errors: {
        insertError,
        pendingError,
        uniPendingError
      }
    })
    
  } catch (error) {
    console.error('❌ Test creation failed:', error)
    return NextResponse.json({ 
      error: 'Test creation failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}