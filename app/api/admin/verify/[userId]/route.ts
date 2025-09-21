import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(
  _request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

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

    console.log(`Admin ${adminProfile.id} attempting to verify user ${targetUserId}`)
    
    // Use service role client to bypass RLS for the update
    const serviceSupabase = createServiceRoleClient()
    
    // Perform the update using service role (bypasses RLS)
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


