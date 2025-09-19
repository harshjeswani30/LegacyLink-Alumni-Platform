"use client"

interface CareerHeatmapProps {
  profile: any
}

export function CareerHeatmap({ profile }: CareerHeatmapProps) {
  return (
    <div className="rounded-lg border p-4">
      <h2 className="text-lg font-semibold mb-2">Career Heatmap</h2>
      <p className="text-sm text-muted-foreground mb-2">Distribution by industries (placeholder). Hook to charts using real data.</p>
      <div className="grid grid-cols-6 gap-1">
        {Array.from({ length: 36 }).map((_, i) => (
          <div key={i} className="h-6 rounded" style={{ backgroundColor: `hsl(210, 70%, ${80 - (i % 10) * 5}%)` }} />
        ))}
      </div>
    </div>
  )
}


