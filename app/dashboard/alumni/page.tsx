import { createClient } from "@/lib/supabase/server"
import { createServiceRoleClient } from "@/lib/supabase/service"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Search, Briefcase, GraduationCap, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import { AlumniFilters } from "@/components/alumni-filters"
import { AlumniVerificationActions } from "@/components/alumni-verification-actions"

interface SearchParams {
  search?: string
  skills?: string
  graduation_year?: string
  verified?: string
}

interface AlumniPageProps {
  searchParams: Promise<SearchParams>
}

export default async function AlumniPage({ searchParams }: AlumniPageProps) {
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

  // Use service role client for admin users to bypass RLS
  const isAdmin = ["super_admin", "university_admin", "admin"].includes(profile.role)
  const queryClient = isAdmin ? createServiceRoleClient() : supabase

  // Build query for alumni based on user role and filters - FRESH WORKING IMPLEMENTATION
  let query = queryClient
    .from("profiles")
    .select("*, university:universities(*), alumni_profile:alumni_profiles(*)")
    .in("role", ["alumni", "student"]) // Include students for verification queue

  // Role-based filtering for non-admins
  if (!isAdmin && profile.university_id) {
    query = query.eq("university_id", profile.university_id)
  }
  // For university admins, filter by their university
  else if (profile.role === "university_admin" && profile.university_id) {
    query = query.eq("university_id", profile.university_id)
  }
  // Super admins see all (no additional filtering)

  // Apply search filters
  if (params.search) {
    query = query.ilike("full_name", `%${params.search}%`)
  }

  if (params.verified === "true") {
    query = query.eq("verified", true)
  } else if (params.verified === "false") {
    query = query.eq("verified", false)
  }

  const { data: alumni, error: alumniError } = await query.order("created_at", { ascending: false })
  
  if (alumniError) {
    console.error('Alumni query error:', alumniError)
  }

  // Filter by skills and graduation year (client-side for now)
  let filteredAlumni = alumni || []

  if (params.skills) {
    filteredAlumni = filteredAlumni.filter((alum) =>
      alum.alumni_profile?.skills?.some((skill: string) => skill.toLowerCase().includes(params.skills!.toLowerCase())),
    )
  }

  if (params.graduation_year) {
    filteredAlumni = filteredAlumni.filter(
      (alum) => alum.alumni_profile?.graduation_year?.toString() === params.graduation_year,
    )
  }

  const verifiedCount = filteredAlumni.filter((alum) => alum.verified).length
  const pendingCount = filteredAlumni.filter((alum) => !alum.verified).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Alumni Network [FRESH]</h1>
          <p className="text-muted-foreground">
            {profile.role === "super_admin"
              ? "Manage alumni across all universities"
              : `Connect with ${profile.university?.name} alumni`}
          </p>
          {params.verified === "false" && (
            <div className="mt-2">
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                Showing unverified users ({filteredAlumni.length} found)
              </Badge>
            </div>
          )}
        </div>
        {profile.role === "alumni" && (
          <Link href="/dashboard/profile">
            <Button>Complete Profile</Button>
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alumni</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredAlumni.length}</div>
            <p className="text-xs text-muted-foreground">In your network</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verified Alumni</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{verifiedCount}</div>
            <p className="text-xs text-muted-foreground">Profile verified</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Search Alumni</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AlumniFilters />
        </CardContent>
      </Card>

      {/* Alumni Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredAlumni.map((alum) => (
          <Card key={alum.id} className="glass-card border-border/50 hover:border-primary/50 transition-colors">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={alum.alumni_profile?.photo_url || "/placeholder.svg"} />
                    <AvatarFallback className="bg-primary/10 text-primary">{alum.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{alum.full_name}</CardTitle>
                    <CardDescription className="flex items-center space-x-1">
                      <GraduationCap className="h-3 w-3" />
                      <span>Class of {alum.alumni_profile?.graduation_year || "N/A"}</span>
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={alum.verified ? "default" : "secondary"}>
                  {alum.verified ? (
                    <>
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Verified
                    </>
                  ) : (
                    <>
                      <Clock className="mr-1 h-3 w-3" />
                      Pending
                    </>
                  )}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {alum.alumni_profile?.current_job && (
                <div className="flex items-center space-x-2 text-sm">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {alum.alumni_profile.current_job}
                    {alum.alumni_profile.current_company && ` at ${alum.alumni_profile.current_company}`}
                  </span>
                </div>
              )}

              {alum.alumni_profile?.skills && alum.alumni_profile.skills.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {alum.alumni_profile.skills.slice(0, 3).map((skill: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {alum.alumni_profile.skills.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{alum.alumni_profile.skills.length - 3} more
                    </Badge>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {alum.alumni_profile?.available_for_mentoring && (
                    <Badge variant="secondary" className="text-xs bg-green-500/10 text-green-500">
                      Available for Mentoring
                    </Badge>
                  )}
                </div>
                <div className="flex space-x-2">
                  <Link href={`/dashboard/alumni/${alum.id}`}>
                    <Button variant="outline" size="sm">
                      View Profile
                    </Button>
                  </Link>
                  {/* Multi-level verification as per SIH requirements */}
                  {(profile.role === "university_admin" || profile.role === "super_admin") && !alum.verified && (
                    <AlumniVerificationActions alumni={alum} />
                  )}
                  {!alum.verified && alum.id === user.id && (
                    <Link href="/dashboard/profile">
                      <Button variant="outline" size="sm" className="text-blue-600 border-blue-600 hover:bg-blue-50">
                        Complete Verification
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredAlumni.length === 0 && (
        <Card className="glass-card border-border/50">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No alumni found</h3>
            <p className="text-muted-foreground text-center">
              Try adjusting your search criteria or check back later for new alumni registrations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
