"use client"

import { useEffect, useRef } from "react"

interface AlumniMapProps {
  profile: any
}

export function AlumniMap({ profile }: AlumniMapProps) {
  const ref = useRef<HTMLIFrameElement>(null)
  useEffect(() => {
    // Placeholder; replace with Google Maps JS SDK if API key configured
  }, [])

  return (
    <div className="rounded-lg border p-4">
      <h2 className="text-lg font-semibold mb-2">Alumni Map</h2>
      <div className="aspect-[16/9] w-full overflow-hidden rounded">
        <iframe
          ref={ref}
          title="Alumni Map"
          src="https://www.openstreetmap.org/export/embed.html?bbox=68.0%2C6.0%2C97.0%2C35.0&layer=mapnik"
          className="w-full h-full border-0"
        />
      </div>
    </div>
  )
}


