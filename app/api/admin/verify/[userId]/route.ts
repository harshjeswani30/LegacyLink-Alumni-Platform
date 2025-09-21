import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  console.log('🔍 Verification endpoint called for user:', params.userId)
  
  try {
    // Check if service role key exists first
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment')
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
    }

    console.log('🔍 Creating supabase client...')
    const supabase = await createClient()

    console.log('🔍 Getting current user...')
    // Get current user
    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('❌ Error getting user:', userError)
      return NextResponse.json({ error: "Authentication error", details: userError.message }, { status: 401 })
    }

    if (!user) {
      console.error('❌ No user found in session')
      return NextResponse.json({ error: "Unauthorized - no user session" }, { status: 401 })
    }

    console.log('✅ User authenticated:', user.id)

    // Ensure caller is a university_admin in same university as target
    const { data: adminProfile, error: adminErr } = await supabase
      .from("profiles")
      .select("id, role, university_id")
      .eq("id", user.id)
      .single()

    if (adminErr || !adminProfile || adminProfile.role !== "university_admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const targetUserId = params.userId

    const { data: targetProfile, error: targetErr } = await supabase
      .from("profiles")
      .select("id, university_id, verified")
      .eq("id", targetUserId)
      .single()

    if (targetErr || !targetProfile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (targetProfile.university_id !== adminProfile.university_id) {
      return NextResponse.json({ error: "Cross-university action not allowed" }, { status: 403 })
    }

    console.log(`✅ Admin ${adminProfile.id} attempting to verify user ${targetUserId}`)
    
    // Use service role client to bypass RLS for the update
    console.log('🔍 Creating service role client...')
    let serviceSupabase
    try {
      serviceSupabase = createServiceRoleClient()
      console.log('✅ Service role client created successfully')
    } catch (serviceError) {
      console.error('❌ Failed to create service role client:', serviceError)
      return NextResponse.json({ 
        error: "Service configuration error", 
        details: serviceError instanceof Error ? serviceError.message : "Unknown service error"
      }, { status: 500 })
    }
    
    // Perform the update using service role (bypasses RLS)
    console.log('🔍 Updating user verification status...')
    const { error: updateErr } = await serviceSupabase
      .from("profiles")
      .update({ verified: true, updated_at: new Date().toISOString() })
      .eq("id", targetUserId)

    if (updateErr) {
      console.error("Database update error:", updateErr)
      return NextResponse.json({ 
        error: "Failed to verify", 
        details: updateErr.message 
      }, { status: 500 })
    }

    console.log("Verification update completed successfully")
    
    // Verify the update by fetching the user again (using service role)
    const { data: verifiedUser, error: fetchErr } = await serviceSupabase
      .from("profiles")
      .select("id, full_name, email, verified, updated_at")
      .eq("id", targetUserId)
      .single()

    if (fetchErr) {
      console.error("Error fetching verified user:", fetchErr)
      // Still return success since the update worked
    } else {
      console.log("Verified user data:", verifiedUser)
    }

    // Optional: award verification badge (using service role)
    try {
      const { data: badgeData, error: badgeErr } = await serviceSupabase.from("badges").insert({
        user_id: targetUserId,
        title: "Verified Alumni",
        description: "Profile verified by university administration",
        points: 100,
        badge_type: "profile",
      }).select()
      
      if (badgeErr) {
        console.warn("Badge creation failed:", badgeErr)
      } else {
        console.log("Badge created:", badgeData)
      }
    } catch (badgeError) {
      console.warn("Badge creation exception:", badgeError)
    }

    return NextResponse.json({ 
      success: true, 
      verified_user: verifiedUser || null,
      timestamp: new Date().toISOString()
    })
  } catch (e) {
    console.error("admin verify error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


