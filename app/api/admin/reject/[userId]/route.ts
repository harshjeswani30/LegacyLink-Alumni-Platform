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

    // Ensure caller is a university_admin, super_admin, or admin
    const { data: adminProfile, error: adminErr } = await supabase
      .from("profiles")
      .select("id, role, university_id")
      .eq("id", user.id)
      .single()

    if (adminErr || !adminProfile || !["university_admin", "super_admin", "admin"].includes(adminProfile.role)) {
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

    // For university_admin, ensure same university
    if (adminProfile.role === "university_admin" && targetProfile.university_id !== adminProfile.university_id) {
      return NextResponse.json({ error: "Cross-university action not allowed" }, { status: 403 })
    }

    // Use service role client to bypass RLS for the update
    const serviceSupabase = createServiceRoleClient()
    
    // Mark as rejected (you could add a rejection_reason field in the future)
    const { error: updateErr } = await serviceSupabase
      .from("profiles")
      .update({ 
        verified: false, 
        updated_at: new Date().toISOString()
      })
      .eq("id", targetUserId)

    if (updateErr) {
      return NextResponse.json({ error: "Failed to reject" }, { status: 500 })
    }

    return NextResponse.json({ success: true, action: "rejected" })
  } catch (e) {
    console.error("admin reject error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}