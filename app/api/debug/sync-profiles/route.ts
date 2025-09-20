import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    console.log('🔧 Running profile sync for missing users...')
    
    const supabase = await createClient()
    
    // Call the sync function from the database
    const { data: syncResults, error: syncError } = await supabase
      .rpc('sync_missing_profiles')
    
    if (syncError) {
      console.error('❌ Sync failed:', syncError)
      return NextResponse.json({ 
        error: 'Sync failed', 
        details: syncError 
      })
    }
    
    console.log('✅ Sync completed:', syncResults)
    
    // After sync, get updated stats
    const [
      { data: authUsers, error: authError },
      { data: profileUsers, error: profileError }
    ] = await Promise.all([
      supabase.auth.admin.listUsers(),
      supabase.from('profiles').select('id, email, role, verified').order('created_at', { ascending: false })
    ])
    
    return NextResponse.json({
      success: true,
      syncResults: syncResults || [],
      stats: {
        authUsersCount: authUsers?.users?.length || 0,
        profileUsersCount: profileUsers?.length || 0,
        syncedCount: syncResults?.length || 0
      },
      data: {
        authUsers: authUsers?.users?.map(u => ({ id: u.id, email: u.email, confirmed: u.email_confirmed_at })) || [],
        profileUsers: profileUsers || []
      },
      errors: {
        authError,
        profileError
      }
    })
    
  } catch (error) {
    console.error('❌ Sync API failed:', error)
    return NextResponse.json({ 
      error: 'Sync API failed', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    })
  }
}