import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ArrowLeft, CheckCircle, Clock, Briefcase, GraduationCap, Award, UserCheck, ExternalLink } from "lucide-react"
import Link from "next/link"

interface AlumniDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function AlumniDetailPage({ params }: AlumniDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get current user profile
  const { data: currentProfile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!currentProfile) {
    redirect("/auth/login")
  }

  // Get alumni profile with extended information
  const { data: alumni } = await supabase
    .from("profiles")
    .select("*, university:universities(*), alumni_profile:alumni_profiles(*)")
    .eq("id", id)
    .single()

  if (!alumni) {
    notFound()
  }

  // Check if current user can view this profile (same university or admin)
  const canView =
    currentProfile.role === "super_admin" ||
    (currentProfile.university_id === alumni.university_id && currentProfile.university_id) ||
    currentProfile.id === alumni.id

  if (!canView) {
    redirect("/dashboard/alumni")
  }

  // Get alumni badges
  const { data: badges } = await supabase
    .from("badges")
    .select("*")
    .eq("user_id", id)
    .order("earned_at", { ascending: false })

  // Check if there's an existing mentorship request
  const { data: existingMentorship } = await supabase
    .from("mentorships")
    .select("*")
    .eq("mentor_id", id)
    .eq("mentee_id", user.id)
    .single()

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/alumni">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Alumni
          </Button>
        </Link>
      </div>

      {/* Profile Header */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-6">
              <Avatar className="h-24 w-24">
                <AvatarImage src={alumni.alumni_profile?.photo_url || "/placeholder.svg"} />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                  {alumni.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold text-foreground">{alumni.full_name}</h1>
                  <Badge variant={alumni.verified ? "default" : "secondary"}>
                    {alumni.verified ? (
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
                <div className="flex items-center space-x-4 text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <GraduationCap className="h-4 w-4" />
                    <span>{alumni.university?.name}</span>
                  </div>
                  {alumni.alumni_profile?.graduation_year && (
                    <div className="flex items-center space-x-1">
                      <span>Class of {alumni.alumni_profile.graduation_year}</span>
                    </div>
                  )}
                </div>
                {alumni.alumni_profile?.current_job && (
                  <div className="flex items-center space-x-1 text-foreground">
                    <Briefcase className="h-4 w-4" />
                    <span>
                      {alumni.alumni_profile.current_job}
                      {alumni.alumni_profile.current_company && ` at ${alumni.alumni_profile.current_company}`}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              {alumni.linkedin_url && (
                <Link href={alumni.linkedin_url} target="_blank">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    LinkedIn
                  </Button>
                </Link>
              )}
              {currentProfile.role === "student" &&
                alumni.alumni_profile?.available_for_mentoring &&
                !existingMentorship && (
                  <Link href={`/dashboard/mentorship/request/${id}`}>
                    <Button>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Request Mentorship
                    </Button>
                  </Link>
                )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Profile Information */}
        <div className="md:col-span-2 space-y-6">
          {/* About */}
          {alumni.alumni_profile?.bio && (
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{alumni.alumni_profile.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Skills */}
          {alumni.alumni_profile?.skills && alumni.alumni_profile.skills.length > 0 && (
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle>Skills & Expertise</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {alumni.alumni_profile.skills.map((skill, index) => (
                    <Badge key={index} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Achievements */}
          {alumni.alumni_profile?.achievements && (
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle>Achievements</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{alumni.alumni_profile.achievements}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Quick Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {alumni.alumni_profile?.degree && (
                <div className="flex items-center space-x-2">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{alumni.alumni_profile.degree}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">Joined:</span>
                <span className="text-sm">{new Date(alumni.created_at).toLocaleDateString()}</span>
              </div>
              {alumni.alumni_profile?.available_for_mentoring && (
                <Badge variant="secondary" className="bg-green-500/10 text-green-500">
                  Available for Mentoring
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Badges */}
          {badges && badges.length > 0 && (
            <Card className="glass-card border-border/50">
              <CardHeader>
                <CardTitle>Badges & Recognition</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {badges.map((badge) => (
                  <div key={badge.id} className="flex items-center space-x-3">
                    <Award className="h-5 w-5 text-yellow-500" />
                    <div>
                      <p className="font-medium text-sm">{badge.title}</p>
                      {badge.description && <p className="text-xs text-muted-foreground">{badge.description}</p>}
                      <p className="text-xs text-muted-foreground">{badge.points} points</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
