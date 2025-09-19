"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Calendar, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function CreateEventPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [eventTime, setEventTime] = useState("")
  const [location, setLocation] = useState("")
  const [maxAttendees, setMaxAttendees] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchUserProfile = async () => {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
        setUserProfile(profile)

        // Check if user can create events
        if (profile && !["university_admin", "super_admin"].includes(profile.role)) {
          router.push("/dashboard/events")
        }
      }
    }

    fetchUserProfile()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || !userProfile) throw new Error("User not authenticated")

      // Combine date and time
      const eventDateTime = new Date(`${eventDate}T${eventTime}`).toISOString()

      const { error } = await supabase.from("events").insert({
        title,
        description: description || null,
        event_date: eventDateTime,
        location: location || null,
        max_attendees: maxAttendees ? Number.parseInt(maxAttendees) : null,
        university_id: userProfile.university_id,
        created_by: user.id,
      })

      if (error) throw error

      router.push("/dashboard/events")
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  if (!userProfile) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/events">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Create Event</h1>
          <p className="text-muted-foreground">Organize a new event for your alumni community</p>
        </div>
      </div>

      <Card className="glass-card border-border/50 max-w-2xl">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Calendar className="h-6 w-6 text-primary" />
            <CardTitle>Event Details</CardTitle>
          </div>
          <CardDescription>Fill in the information for your new event</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  type="text"
                  placeholder="Alumni Networking Night"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-background/50"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Join us for an evening of networking and reconnecting with fellow alumni..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-background/50 min-h-[100px]"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="eventDate">Date</Label>
                  <Input
                    id="eventDate"
                    type="date"
                    required
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="bg-background/50"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="eventTime">Time</Label>
                  <Input
                    id="eventTime"
                    type="time"
                    required
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    className="bg-background/50"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location">Location (Optional)</Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="University Alumni Center, Room 101"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-background/50"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="maxAttendees">Maximum Attendees (Optional)</Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  placeholder="50"
                  value={maxAttendees}
                  onChange={(e) => setMaxAttendees(e.target.value)}
                  className="bg-background/50"
                />
                <p className="text-xs text-muted-foreground">Leave empty for unlimited attendees</p>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <div className="flex space-x-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Event"}
              </Button>
              <Link href="/dashboard/events">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
