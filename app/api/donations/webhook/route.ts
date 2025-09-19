import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

// Demo-only webhook: accepts any payload, marks donation completed for showcase
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const supabase = await createClient()

    const donorId = body?.notes?.donor_id || body?.donor_id
    const universityId = body?.notes?.university_id || body?.university_id
    const amount = body?.amount ? Number(body.amount) : 0
    const paymentId = body?.id || `pay_demo_${Date.now()}`

    if (donorId && universityId && amount) {
      await supabase.from("donations").insert({
        donor_id: donorId,
        university_id: universityId,
        amount: amount / 100,
        payment_status: "completed",
        payment_id: paymentId,
        receipt_url: null,
      })
    }

    return NextResponse.json({ received: true, demo: true })
  } catch (e) {
    console.error("donations/webhook demo error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


