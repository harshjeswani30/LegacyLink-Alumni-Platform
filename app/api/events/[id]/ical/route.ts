import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: event } = await supabase
    .from("events")
    .select("id, title, description, event_date, location")
    .eq("id", params.id)
    .single()

  if (!event) {
    return new Response("Not found", { status: 404 })
  }

  const starts = new Date(event.event_date).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
  const uid = `${event.id}@legacylink`
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LegacyLink//EN",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${starts}`,
    `DTSTART:${starts}`,
    `SUMMARY:${escapeICS(event.title)}`,
    event.location ? `LOCATION:${escapeICS(event.location)}` : "",
    event.description ? `DESCRIPTION:${escapeICS(event.description)}` : "",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n")

  return new Response(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename=event_${event.id}.ics`,
    },
  })
}

function escapeICS(text?: string) {
  if (!text) return ""
  return text.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;")
}


