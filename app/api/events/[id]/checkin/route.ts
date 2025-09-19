import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { user_id } = await request.json()
    const targetId = user_id || user.id

    const { error } = await supabase.from("event_checkins").insert({
      event_id: params.id,
      user_id: targetId,
    })

    if (error) return NextResponse.json({ error: "Check-in failed" }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("events/checkin error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


