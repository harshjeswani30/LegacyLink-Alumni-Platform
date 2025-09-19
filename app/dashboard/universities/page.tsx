import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Building2, Users, Calendar, CheckCircle, Clock, Plus } from "lucide-react"
import { UniversityApprovalActions } from "@/components/university-approval-actions"
import Link from "next/link"

export default async function UniversitiesPage() {
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

  // Get all universities
  const { data: universities } = await supabase
    .from("universities")
    .select("*")
    .order("created_at", { ascending: false })

  // Get stats for each university
  const universitiesWithStats = await Promise.all(
    (universities || []).map(async (university) => {
      const [{ count: alumniCount }, { count: eventsCount }, { count: studentsCount }] = await Promise.all([
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("university_id", university.id)
          .eq("role", "alumni"),
        supabase.from("events").select("*", { count: "exact", head: true }).eq("university_id", university.id),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("university_id", university.id)
          .eq("role", "student"),
      ])

      return {
        ...university,
        stats: {
          alumni: alumniCount || 0,
          events: eventsCount || 0,
          students: studentsCount || 0,
        },
      }
    }),
  )

  const approvedUniversities = universitiesWithStats.filter((u) => u.approved)
  const pendingUniversities = universitiesWithStats.filter((u) => !u.approved)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">University Management</h1>
          <p className="text-muted-foreground">Manage universities and approve new registrations</p>
        </div>
        <Link href="/dashboard/universities/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add University
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Universities</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{universitiesWithStats.length}</div>
            <p className="text-xs text-muted-foreground">Registered institutions</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedUniversities.length}</div>
            <p className="text-xs text-muted-foreground">Active universities</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingUniversities.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting review</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      {pendingUniversities.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground">Pending Approvals</h2>
          <div className="grid gap-4">
            {pendingUniversities.map((university) => (
              <Card key={university.id} className="glass-card border-border/50 border-l-4 border-l-yellow-500">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={university.logo_url || "/placeholder.svg"} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {university.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <CardTitle className="text-lg">{university.name}</CardTitle>
                        <CardDescription>{university.domain}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
                      <Clock className="mr-1 h-3 w-3" />
                      Pending
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-6 text-sm text-muted-foreground">
                      <span>Registered: {new Date(university.created_at).toLocaleDateString()}</span>
                    </div>
                    <UniversityApprovalActions university={university} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Approved Universities */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Approved Universities</h2>
        <div className="grid gap-4">
          {approvedUniversities.map((university) => (
            <Card key={university.id} className="glass-card border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={university.logo_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {university.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{university.name}</CardTitle>
                      <CardDescription>{university.domain}</CardDescription>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-green-500/10 text-green-500">
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Approved
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-6 text-sm">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{university.stats.alumni} Alumni</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{university.stats.students} Students</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{university.stats.events} Events</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Link href={`/dashboard/universities/${university.id}`}>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
