import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

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

    const { error: updateErr } = await supabase
      .from("profiles")
      .update({ verified: true, updated_at: new Date().toISOString() })
      .eq("id", targetUserId)

    if (updateErr) {
      return NextResponse.json({ error: "Failed to verify" }, { status: 500 })
    }

    // Optional: award verification badge
    await supabase.from("badges").insert({
      user_id: targetUserId,
      title: "Verified Alumni",
      description: "Profile verified by university administration",
      points: 100,
      badge_type: "profile",
    })

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("admin verify error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


