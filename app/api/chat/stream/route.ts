import { NextRequest } from "next/server"

export const runtime = "edge"

// Streams AI chat from a provider specified by env. Supports OpenAI-compatible APIs.
export async function POST(request: NextRequest) {
  const {
    AI_BASE_URL = "https://api.openai.com/v1",
    AI_API_KEY,
    AI_MODEL = "gpt-4o-mini",
  } = process.env as Record<string, string>

  if (!AI_API_KEY) {
    return new Response("AI not configured", { status: 500 })
  }

  const body = await request.json()
  const messages = body?.messages || []

  const resp = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: AI_MODEL,
      messages,
      stream: true,
    }),
  })

  if (!resp.ok || !resp.body) {
    const text = await resp.text().catch(() => "")
    return new Response(`Upstream error: ${text}`, { status: 502 })
  }

  // Proxy the SSE stream directly
  return new Response(resp.body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Transfer-Encoding": "chunked",
    },
  })
}


