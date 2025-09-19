import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const peerId = searchParams.get("peerId")
    if (!peerId) return NextResponse.json({ error: "peerId required" }, { status: 400 })

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},recipient_id.eq.${peerId}),and(sender_id.eq.${peerId},recipient_id.eq.${user.id})`)
      .order("created_at", { ascending: true })

    if (error) return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 })
    return NextResponse.json({ messages: data })
  } catch (e) {
    console.error("chat/messages GET error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { recipient_id, content } = await request.json()
    if (!recipient_id || !content) return NextResponse.json({ error: "Missing fields" }, { status: 400 })

    const { data, error } = await supabase.from("messages").insert({
      sender_id: user.id,
      recipient_id,
      content,
    })

    if (error) return NextResponse.json({ error: "Failed to send" }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error("chat/messages POST error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


