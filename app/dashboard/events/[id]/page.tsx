import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Calendar, MapPin, Users, Clock, Edit } from "lucide-react"
import Link from "next/link"
import { EventRegistrationButton } from "@/components/event-registration-button"
import { EventDeleteButton } from "@/components/event-delete-button"

interface EventDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Get event details
  const { data: event } = await supabase
    .from("events")
    .select("*, university:universities(*), creator:profiles!created_by(*)")
    .eq("id", id)
    .single()

  if (!event) {
    notFound()
  }

  // Check if user can view this event (same university or admin)
  const canView =
    profile.role === "super_admin" || profile.university_id === event.university_id || event.created_by === user.id

  if (!canView) {
    redirect("/dashboard/events")
  }

  // Get event registrations
  const { data: registrations } = await supabase
    .from("event_registrations")
    .select("*, user:profiles(*)")
    .eq("event_id", id)
    .order("registered_at", { ascending: false })

  // Check if current user is registered
  const userRegistration = registrations?.find((reg) => reg.user_id === user.id)
  const isRegistered = !!userRegistration

  const eventDate = new Date(event.event_date)
  const isUpcoming = eventDate >= new Date()
  const isPast = eventDate < new Date()
  const canEdit = event.created_by === user.id || profile.role === "super_admin"
  const isFull = event.max_attendees ? (registrations?.length || 0) >= event.max_attendees : false

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/events">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Events
          </Button>
        </Link>
      </div>

      {/* Event Header */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <h1 className="text-3xl font-bold text-foreground">{event.title}</h1>
                <Badge variant={isUpcoming ? "default" : "secondary"}>{isUpcoming ? "Upcoming" : "Past Event"}</Badge>
                {isRegistered && <Badge variant="outline">You're Registered</Badge>}
              </div>

              <div className="flex items-center space-x-6 text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5" />
                  <span>{eventDate.toLocaleDateString()}</span>
                  <span>{eventDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                {event.location && (
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>{event.location}</span>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>
                    {registrations?.length || 0} registered
                    {event.max_attendees && ` / ${event.max_attendees} max`}
                  </span>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {event.creator?.full_name?.charAt(0) || "?"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">Organized by {event.creator?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{event.university?.name}</p>
                </div>
              </div>
            </div>

            <div className="flex space-x-2">
              {isUpcoming && !isRegistered && (
                <EventRegistrationButton eventId={event.id} isRegistered={isRegistered} isFull={isFull} />
              )}
              {canEdit && (
                <>
                  <Link href={`/dashboard/events/${event.id}/edit`}>
                    <Button variant="outline" size="sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </Link>
                  <EventDeleteButton eventId={event.id} />
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Event Details */}
        <div className="md:col-span-2 space-y-6">
          {event.description && (
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle>About This Event</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{event.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Attendees */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Attendees ({registrations?.length || 0})</CardTitle>
              <CardDescription>Alumni registered for this event</CardDescription>
            </CardHeader>
            <CardContent>
              {registrations && registrations.length > 0 ? (
                <div className="space-y-3">
                  {registrations.map((registration) => (
                    <div key={registration.id} className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {registration.user?.full_name?.charAt(0) || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{registration.user?.full_name}</p>
                        <p className="text-xs text-muted-foreground">
                          Registered {new Date(registration.registered_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {registration.user?.role?.replace("_", " ")}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No registrations yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Event Info */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Event Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {eventDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {eventDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>

              {event.location && (
                <div className="flex items-start space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-xs text-muted-foreground">{event.location}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Capacity</p>
                  <p className="text-xs text-muted-foreground">
                    {event.max_attendees ? `${event.max_attendees} attendees max` : "Unlimited"}
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground">
                  Created {new Date(event.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          {isUpcoming && (
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!isRegistered && !isFull && (
                  <EventRegistrationButton eventId={event.id} isRegistered={isRegistered} isFull={isFull} />
                )}
                {isRegistered && (
                  <EventRegistrationButton eventId={event.id} isRegistered={isRegistered} isFull={isFull} />
                )}
                {isFull && !isRegistered && (
                  <p className="text-sm text-muted-foreground">This event is at full capacity</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
