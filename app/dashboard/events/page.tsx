import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Calendar, MapPin, Users, Clock, Plus, Filter, Settings } from "lucide-react"
import Link from "next/link"
import { EventRegistrationButton } from "@/components/event-registration-button"
import { EventDeleteButton } from "@/components/event-delete-button"

interface SearchParams {
  filter?: "upcoming" | "past" | "my-events"
}

interface EventsPageProps {
  searchParams: Promise<SearchParams>
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, university:universities(*)")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Build events query based on user role and filters
  let eventsQuery = supabase.from("events").select("*, university:universities(*), creator:profiles!created_by(*)")

  // Role-based filtering
  if (profile.role !== "super_admin") {
    if (profile.university_id) {
      eventsQuery = eventsQuery.eq("university_id", profile.university_id)
    }
  }

  // Apply time-based filters
  const now = new Date().toISOString()
  if (params.filter === "upcoming") {
    eventsQuery = eventsQuery.gte("event_date", now)
  } else if (params.filter === "past") {
    eventsQuery = eventsQuery.lt("event_date", now)
  } else if (params.filter === "my-events") {
    eventsQuery = eventsQuery.eq("created_by", user.id)
  }

  const { data: events } = await eventsQuery.order("event_date", { ascending: true })

  // Get registration counts and user registrations
  const eventsWithDetails = await Promise.all(
    (events || []).map(async (event) => {
      const [{ count: registrationCount }, { data: userRegistration }] = await Promise.all([
        supabase.from("event_registrations").select("*", { count: "exact", head: true }).eq("event_id", event.id),
        supabase.from("event_registrations").select("*").eq("event_id", event.id).eq("user_id", user.id).single(),
      ])

      return {
        ...event,
        registrationCount: registrationCount || 0,
        isRegistered: !!userRegistration,
      }
    }),
  )

  const upcomingEvents = eventsWithDetails.filter((event) => new Date(event.event_date) >= new Date())
  const pastEvents = eventsWithDetails.filter((event) => new Date(event.event_date) < new Date())
  const myEvents = eventsWithDetails.filter((event) => event.created_by === user.id)

  const canCreateEvents = profile.role === "university_admin" || profile.role === "super_admin"

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Events</h1>
          <p className="text-muted-foreground">
            {profile.role === "super_admin"
              ? "Manage events across all universities"
              : `Discover and join ${profile.university?.name} events`}
          </p>
        </div>
        {canCreateEvents && (
          <Link href="/dashboard/events/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            <p className="text-xs text-muted-foreground">Events to attend</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {canCreateEvents ? "Total Registrations" : "My Registrations"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {canCreateEvents 
                ? eventsWithDetails.reduce((sum, event) => sum + event.registrationCount, 0)
                : eventsWithDetails.filter((e) => e.isRegistered).length
              }
            </div>
            <p className="text-xs text-muted-foreground">
              {canCreateEvents ? "Across all events" : "Events registered"}
            </p>
          </CardContent>
        </Card>

        {canCreateEvents && (
          <Card className="glass-card border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Events</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{myEvents.length}</div>
              <p className="text-xs text-muted-foreground">Events created</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Filters */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Filter Events</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2">
            <Link href="/dashboard/events">
              <Button variant={!params.filter ? "default" : "outline"} size="sm">
                All Events
              </Button>
            </Link>
            <Link href="/dashboard/events?filter=upcoming">
              <Button variant={params.filter === "upcoming" ? "default" : "outline"} size="sm">
                Upcoming
              </Button>
            </Link>
            <Link href="/dashboard/events?filter=past">
              <Button variant={params.filter === "past" ? "default" : "outline"} size="sm">
                Past Events
              </Button>
            </Link>
            {canCreateEvents && (
              <Link href="/dashboard/events?filter=my-events">
                <Button variant={params.filter === "my-events" ? "default" : "outline"} size="sm">
                  My Events
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {eventsWithDetails.map((event) => {
          const eventDate = new Date(event.event_date)
          const isUpcoming = eventDate >= new Date()
          const isPast = eventDate < new Date()

          return (
            <Card key={event.id} className="glass-card border-border/50 hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg line-clamp-2">{event.title}</CardTitle>
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{eventDate.toLocaleDateString()}</span>
                      <span>{eventDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                  </div>
                  <Badge variant={isUpcoming ? "default" : "secondary"}>{isUpcoming ? "Upcoming" : "Past"}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {event.location && (
                  <div className="flex items-center space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{event.location}</span>
                  </div>
                )}

                {event.description && <p className="text-sm text-muted-foreground line-clamp-3">{event.description}</p>}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {event.registrationCount} registered
                      {event.max_attendees && ` / ${event.max_attendees} max`}
                    </span>
                  </div>
                  {event.isRegistered && <Badge variant="outline">Registered</Badge>}
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {event.creator?.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">by {event.creator?.full_name}</span>
                  </div>
                  <div className="flex space-x-2">
                    <Link href={`/dashboard/events/${event.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                    {/* Show different actions based on user role */}
                    {canCreateEvents ? (
                      // Admin users see management options
                      <div className="flex space-x-2">
                        {event.created_by === user.id && (
                          <>
                            <Link href={`/dashboard/events/${event.id}/edit`}>
                              <Button variant="outline" size="sm">
                                <Settings className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </Link>
                            <EventDeleteButton eventId={event.id} />
                          </>
                        )}
                        <Link href={`/dashboard/events/${event.id}/attendees`}>
                          <Button variant="outline" size="sm">
                            <Users className="h-3 w-3 mr-1" />
                            Attendees ({event.registrationCount})
                          </Button>
                        </Link>
                      </div>
                    ) : (
                      // Regular users see registration options
                      isUpcoming && !event.isRegistered && (
                        <EventRegistrationButton
                          eventId={event.id}
                          isRegistered={event.isRegistered}
                          isFull={event.max_attendees ? event.registrationCount >= event.max_attendees : false}
                        />
                      )
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {eventsWithDetails.length === 0 && (
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No events found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {params.filter === "upcoming"
                ? "No upcoming events at the moment."
                : params.filter === "past"
                  ? "No past events to display."
                  : params.filter === "my-events"
                    ? "You haven't created any events yet."
                    : "No events available in your network."}
            </p>
            {canCreateEvents && (
              <Link href="/dashboard/events/create">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Your First Event
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
