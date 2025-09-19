import { NextRequest, NextResponse } from "next/server"
import { mentorshipMatcher } from "@/lib/mentorship-matching"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const matches = await mentorshipMatcher.getRecommendations(user.id)
    return NextResponse.json({ matches })
  } catch (e) {
    console.error("mentorship/recommendations error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


