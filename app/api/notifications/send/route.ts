import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { to, title, body, channel = "email" } = await request.json()

    if (!to || !title || !body) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // Stub: integrate with email provider or FCM when configured
    // This endpoint simply echoes payload to confirm wiring.
    return NextResponse.json({ success: true, channel, to, title })
  } catch (e) {
    console.error("notifications/send error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


