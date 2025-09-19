import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Calendar, Heart, ArrowLeft, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"

interface UniversityDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function UniversityDetailPage({ params }: UniversityDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Check if user is super admin
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile || profile.role !== "super_admin") {
    redirect("/dashboard")
  }

  // Get university details
  const { data: university } = await supabase.from("universities").select("*").eq("id", id).single()

  if (!university) {
    notFound()
  }

  // Get university statistics
  const [
    { count: alumniCount },
    { count: studentsCount },
    { count: eventsCount },
    { count: donationsCount },
    { data: recentAlumni },
    { data: recentEvents },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("university_id", id).eq("role", "alumni"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("university_id", id).eq("role", "student"),
    supabase.from("events").select("*", { count: "exact", head: true }).eq("university_id", id),
    supabase
      .from("donations")
      .select("*", { count: "exact", head: true })
      .eq("university_id", id)
      .eq("payment_status", "completed"),
    supabase
      .from("profiles")
      .select("*")
      .eq("university_id", id)
      .eq("role", "alumni")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("events").select("*").eq("university_id", id).order("created_at", { ascending: false }).limit(5),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/universities">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={university.logo_url || "/placeholder.svg"} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl">{university.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{university.name}</h1>
            <div className="flex items-center space-x-4">
              <p className="text-muted-foreground">{university.domain}</p>
              <Badge variant={university.approved ? "default" : "secondary"}>
                {university.approved ? (
                  <>
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Approved
                  </>
                ) : (
                  <>
                    <Clock className="mr-1 h-3 w-3" />
                    Pending
                  </>
                )}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alumni</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alumniCount || 0}</div>
            <p className="text-xs text-muted-foreground">Registered alumni</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentsCount || 0}</div>
            <p className="text-xs text-muted-foreground">Current students</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventsCount || 0}</div>
            <p className="text-xs text-muted-foreground">Total events</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Donations</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{donationsCount || 0}</div>
            <p className="text-xs text-muted-foreground">Completed donations</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>Recent Alumni</CardTitle>
            <CardDescription>Latest alumni registrations</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentAlumni && recentAlumni.length > 0 ? (
                recentAlumni.map((alumni) => (
                  <div key={alumni.id} className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {alumni.full_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alumni.full_name}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(alumni.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={alumni.verified ? "default" : "secondary"} className="text-xs">
                      {alumni.verified ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No alumni registered yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>Recent Events</CardTitle>
            <CardDescription>Latest events created</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentEvents && recentEvents.length > 0 ? (
                recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center space-x-3">
                    <Calendar className="h-8 w-8 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">{new Date(event.event_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No events created yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
