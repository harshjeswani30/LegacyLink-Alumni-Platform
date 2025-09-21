import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AdminCreateUniversity from "@/components/admin-create-university"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Clock, CheckCircle, Building2, UserPlus, GraduationCap, Heart, TrendingUp, Bot, UserCheck } from "lucide-react"
import Link from "next/link"
import { AlumniVerificationActions } from "@/components/alumni-verification-actions"

export default async function AdminPage() {
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

  // Only allow university admins, super admins, and regular admins
  const isAdmin = ["university_admin", "super_admin", "admin"].includes(profile.role)
  
  if (!isAdmin) {
    redirect("/dashboard")
  }

  // Get pending profiles for multi-level verification (SIH Requirement)
  let pendingQuery = supabase
    .from("profiles")
    .select("*, university:universities(*), alumni_profile:alumni_profiles(*)")
    .eq("verified", false)
    .in("role", ["alumni", "student"])

  // Filter by university for university admins
  if (profile.role === "university_admin" && profile.university_id) {
    pendingQuery = pendingQuery.eq("university_id", profile.university_id)
  }

  const { data: pendingProfiles } = await pendingQuery.order("created_at", { ascending: false })

  // Get stats for SIH dashboard (FIXED: Separate queries to avoid pollution)
  const isUniversityAdmin = profile.role === "university_admin" && profile.university_id

  const statsQueries = [
    // Total users
    isUniversityAdmin 
      ? supabase.from("profiles").select("*", { count: "exact", head: true }).eq("university_id", profile.university_id)
      : supabase.from("profiles").select("*", { count: "exact", head: true }),
    
    // Verified users  
    isUniversityAdmin
      ? supabase.from("profiles").select("*", { count: "exact", head: true }).eq("university_id", profile.university_id).eq("verified", true)
      : supabase.from("profiles").select("*", { count: "exact", head: true }).eq("verified", true),
    
    // Alumni count
    isUniversityAdmin
      ? supabase.from("profiles").select("*", { count: "exact", head: true }).eq("university_id", profile.university_id).eq("role", "alumni")
      : supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "alumni"),
    
    // Pending verifications
    isUniversityAdmin
      ? supabase.from("profiles").select("*", { count: "exact", head: true }).eq("university_id", profile.university_id).eq("verified", false).in("role", ["alumni", "student"])
      : supabase.from("profiles").select("*", { count: "exact", head: true }).eq("verified", false).in("role", ["alumni", "student"]),
    
    // Student count
    isUniversityAdmin
      ? supabase.from("profiles").select("*", { count: "exact", head: true }).eq("university_id", profile.university_id).eq("role", "student")
      : supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
    
    // Mentor count
    isUniversityAdmin
      ? supabase.from("profiles").select("*", { count: "exact", head: true }).eq("university_id", profile.university_id).eq("role", "mentor")
      : supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "mentor")
  ]

  const [
    { count: totalUsers },
    { count: verifiedUsers },
    { count: alumniCount },
    { count: pendingCount },
    { count: studentCount },
    { count: mentorCount }
  ] = await Promise.all(statsQueries)

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">LegacyLink - Admin Dashboard</h1>
        <p className="text-muted-foreground">
          {profile.role === "super_admin" 
            ? "Centralized Alumni Data Management & Engagement Platform" 
            : `${profile.university?.name} - Alumni Network Management`}
        </p>
        <div className="mt-2">
          <Badge variant="outline" className="text-blue-600 border-blue-600">
            SIH 2025 - Problem ID: 25017
          </Badge>
        </div>
      </div>

      {/* SIH Core Features Stats - ENHANCED */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting admin approval</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Alumni</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alumniCount || 0}</div>
            <p className="text-xs text-muted-foreground">Alumni profiles</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <GraduationCap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{studentCount || 0}</div>
            <p className="text-xs text-muted-foreground">Student profiles</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mentors</CardTitle>
            <UserCheck className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mentorCount || 0}</div>
            <p className="text-xs text-muted-foreground">Available mentors</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers || 0}</div>
            <p className="text-xs text-muted-foreground">All registered users</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verification Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalUsers || 0) > 0 ? Math.round(((verifiedUsers || 0) / (totalUsers || 1)) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Users verified</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Admin Scope</CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {profile.role === "super_admin" ? "Platform-wide" : profile.university?.name || "University"}
            </div>
            <p className="text-xs text-muted-foreground">
              {profile.role === "super_admin" ? "All universities" : "Single university"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* SIH Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Alumni Management</span>
            </CardTitle>
            <CardDescription>View and manage alumni profiles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/dashboard/alumni">
                <Button variant="outline" className="w-full">View Alumni Directory</Button>
              </Link>
              <Link href="/dashboard/analytics">
                <Button variant="outline" className="w-full">Career Heatmap</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5" />
              <span>Mentor Management</span>
            </CardTitle>
            <CardDescription>Verify and manage mentor profiles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/admin/mentors">
                <Button variant="outline" className="w-full">Manage Mentors</Button>
              </Link>
              <Link href="/dashboard/mentorship">
                <Button variant="outline" className="w-full">Mentorship System</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Events & Communication</span>
            </CardTitle>
            <CardDescription>Manage reunions, webinars, workshops</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link href="/dashboard/events">
                <Button variant="outline" className="w-full">Manage Events</Button>
              </Link>
              <Link href="/dashboard/events/create">
                <Button variant="outline" className="w-full">Create Event</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building2 className="h-5 w-5" />
              <span>University Settings</span>
            </CardTitle>
            <CardDescription>Platform configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <AdminCreateUniversity />
          </CardContent>
        </Card>
      </div>

      {/* Multi-level Verification Queue (SIH Core Feature) */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <span>Multi-level Verification Queue</span>
          </CardTitle>
          <CardDescription>
            SIH Feature: Email + LinkedIn + Admin Approval verification process
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pendingProfiles && pendingProfiles.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {pendingProfiles.slice(0, 9).map((profile) => (
                <Card key={profile.id} className="border-border/50" data-profile-id={profile.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={profile.alumni_profile?.photo_url || "/placeholder.svg"} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {profile.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{profile.full_name}</CardTitle>
                          <CardDescription className="flex items-center space-x-1">
                            <GraduationCap className="h-3 w-3" />
                            <span>{profile.role === "alumni" ? "Alumni" : "Student"}</span>
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span>Email Verified:</span>
                        <Badge variant="outline" className="text-xs">
                          {profile.email ? "✓" : "✗"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>LinkedIn Synced:</span>
                        <Badge variant="outline" className="text-xs">
                          {profile.linkedin_url ? "✓" : "✗"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Admin Approval:</span>
                        <Badge variant="outline" className="text-xs text-yellow-600">
                          Pending
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <Link href={`/dashboard/alumni/${profile.id}`}>
                        <Button variant="outline" size="sm">
                          View Profile
                        </Button>
                      </Link>
                      <AlumniVerificationActions alumni={profile} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">All Verified!</h3>
              <p className="text-muted-foreground">
                No pending verifications at the moment.
              </p>
            </div>
          )}
          
          {pendingProfiles && pendingProfiles.length > 9 && (
            <div className="pt-4 text-center">
              <Link href="/dashboard/alumni?verified=false">
                <Button variant="outline">
                  View All Pending ({pendingProfiles.length})
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}


