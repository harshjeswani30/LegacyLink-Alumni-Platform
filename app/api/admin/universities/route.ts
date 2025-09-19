import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name, domain, logo_url } = await request.json()
    if (!name || !domain) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

    // If university exists (by domain), reuse it; else create
    let uniId: string | null = null

    const { data: existing } = await supabase
      .from("universities")
      .select("id")
      .eq("domain", domain)
      .maybeSingle()

    if (existing?.id) {
      uniId = existing.id
    } else {
      const { data: created, error: uniErr } = await supabase
        .from("universities")
        .insert({ name, domain, logo_url, approved: true })
        .select("id")
        .single()
      if (uniErr || !created) return NextResponse.json({ error: "Failed to create university" }, { status: 500 })
      uniId = created.id
    }

    // Promote current user to university_admin for this university
    const { error: updErr } = await supabase
      .from("profiles")
      .update({ role: "university_admin", university_id: uniId, updated_at: new Date().toISOString() })
      .eq("id", user.id)

    if (updErr) return NextResponse.json({ error: "Failed to assign admin role" }, { status: 500 })

    return NextResponse.json({ id: uniId })
  } catch (e) {
    console.error("admin/universities POST error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


