import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, currency = "INR", receipt } = body || {}

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 })
    }

    // Demo-only mock order (no external calls)
    const order = {
      id: `order_demo_${Date.now()}`,
      amount: Math.round(Number(amount) * 100),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
      status: "created",
      notes: { demo: true },
    }
    return NextResponse.json(order)
  } catch (e) {
    console.error("donations/order error", e)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}


