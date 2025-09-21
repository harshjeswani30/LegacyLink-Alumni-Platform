import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service"

// Debug endpoint to check why admin queue is empty
export async function POST(_request: NextRequest) {
  try {
    console.log('🔍 Debug admin queue endpoint called')
    
    const supabase = await createClient()
    const serviceSupabase = createServiceRoleClient()

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Get admin profile
    const { data: adminProfile, error: adminError } = await supabase
      .from("profiles")
      .select("*, university:universities(*)")
      .eq("id", user.id)
      .single()

    if (adminError || !adminProfile) {
      return NextResponse.json({ error: "Admin profile not found" }, { status: 404 })
    }

    // Test 1: Get ALL unverified profiles (using service role to bypass RLS)
    const { data: allUnverified, error: allError } = await serviceSupabase
      .from("profiles")
      .select("*, university:universities(*)")
      .eq("verified", false)
      .in("role", ["alumni", "student"])
      .order("created_at", { ascending: false })

    // Test 2: Get unverified profiles using regular client (what admin page sees)
    let pendingQuery = supabase
      .from("profiles")
      .select("*, university:universities(*)")
      .eq("verified", false)
      .in("role", ["alumni", "student"])

    // Apply university filter if needed
    if (adminProfile.role === "university_admin" && adminProfile.university_id) {
      pendingQuery = pendingQuery.eq("university_id", adminProfile.university_id)
    }

    const { data: visibleToAdmin, error: visibleError } = await pendingQuery.order("created_at", { ascending: false })

    // Test 3: Check specific users
    const { data: specificUsers, error: specificError } = await serviceSupabase
      .from("profiles")
      .select("*, university:universities(*)")
      .in("email", ["rosej66843@cnguopin.com", "harsh@jxpomup.com", "potomal263@cerisun.com"])

    return NextResponse.json({
      adminProfile: {
        id: adminProfile.id,
        email: adminProfile.email,
        role: adminProfile.role,
        university_id: adminProfile.university_id,
        university_name: adminProfile.university?.name
      },
      allUnverifiedCount: allUnverified?.length || 0,
      visibleToAdminCount: visibleToAdmin?.length || 0,
      allUnverified: allUnverified || [],
      visibleToAdmin: visibleToAdmin || [],
      specificUsers: specificUsers || [],
      errors: {
        allError: allError?.message,
        visibleError: visibleError?.message,
        specificError: specificError?.message
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Debug admin queue error:', error)
    return NextResponse.json({ 
      error: "Debug failed", 
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}