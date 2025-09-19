import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, MessageCircle, Clock, CheckCircle, Heart, Star } from "lucide-react"
import Link from "next/link"
import { MentorshipRequestButton } from "@/components/mentorship-request-button"
import { MentorshipStatusActions } from "@/components/mentorship-status-actions"

export default async function MentorshipPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  if (!profile) {
    redirect("/auth/login")
  }

  // Get mentorship statistics
  const [
    { count: totalMentors },
    { count: activeMentorships },
    { count: pendingRequests },
    { count: completedMentorships },
  ] = await Promise.all([
    supabase.from("alumni_profiles").select("*", { count: "exact", head: true }).eq("available_for_mentoring", true),
    supabase
      .from("mentorships")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`),
    supabase
      .from("mentorships")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")
      .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`),
    supabase
      .from("mentorships")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`),
  ])

  // Get available mentors (for students)
  const { data: availableMentors } = await supabase
    .from("alumni_profiles")
    .select(`
      *,
      profile:profiles(*)
    `)
    .eq("available_for_mentoring", true)
    .eq("profile.university_id", profile.university_id)
    .limit(6)

  // Get user's mentorships
  const { data: userMentorships } = await supabase
    .from("mentorships")
    .select(`
      *,
      mentor:mentor_id(full_name, email),
      mentee:mentee_id(full_name, email)
    `)
    .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`)
    .order("created_at", { ascending: false })

  const pendingMentorships = userMentorships?.filter((m) => m.status === "pending") || []
  const activeMentorshipsList = userMentorships?.filter((m) => m.status === "active") || []
  const completedMentorshipsList = userMentorships?.filter((m) => m.status === "completed") || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mentorship Hub</h1>
        <p className="text-muted-foreground">Connect with mentors and grow your network</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Mentors</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMentors || 0}</div>
            <p className="text-xs text-muted-foreground">In your university</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Mentorships</CardTitle>
            <MessageCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMentorships || 0}</div>
            <p className="text-xs text-muted-foreground">Ongoing connections</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting response</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedMentorships || 0}</div>
            <p className="text-xs text-muted-foreground">Successful mentorships</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="discover" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="discover">Discover Mentors</TabsTrigger>
          <TabsTrigger value="pending">Pending ({pendingMentorships.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeMentorshipsList.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedMentorshipsList.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-foreground">Available Mentors</h2>
            <Link href="/dashboard/mentorship/discover">
              <Button variant="outline">View All Mentors</Button>
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {availableMentors?.map((mentor) => (
              <Card key={mentor.user_id} className="glass-card border-border/50">
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={mentor.photo_url || "/placeholder.svg"} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {mentor.profile?.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{mentor.profile?.full_name}</CardTitle>
                      <CardDescription>
                        {mentor.current_job} at {mentor.current_company}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-2">{mentor.bio}</p>

                  <div className="flex flex-wrap gap-1">
                    {mentor.skills?.slice(0, 3).map((skill: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {mentor.skills && mentor.skills.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{mentor.skills.length - 3} more
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>Class of {mentor.graduation_year}</span>
                    </div>
                    <MentorshipRequestButton mentorId={mentor.user_id} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pending" className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Pending Requests</h2>

          {pendingMentorships.length === 0 ? (
            <Card className="glass-card border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pending Requests</h3>
                <p className="text-muted-foreground text-center">
                  You don't have any pending mentorship requests at the moment.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingMentorships.map((mentorship) => (
                <Card key={mentorship.id} className="glass-card border-border/50 border-l-4 border-l-yellow-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {mentorship.mentor_id === user.id
                              ? mentorship.mentee?.full_name?.charAt(0)
                              : mentorship.mentor?.full_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">
                            {mentorship.mentor_id === user.id
                              ? `Request from ${mentorship.mentee?.full_name}`
                              : `Request to ${mentorship.mentor?.full_name}`}
                          </CardTitle>
                          <CardDescription>{new Date(mentorship.created_at).toLocaleDateString()}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {mentorship.message && <p className="text-sm text-muted-foreground mb-4">"{mentorship.message}"</p>}
                    {mentorship.mentor_id === user.id && <MentorshipStatusActions mentorship={mentorship} />}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Active Mentorships</h2>

          {activeMentorshipsList.length === 0 ? (
            <Card className="glass-card border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Mentorships</h3>
                <p className="text-muted-foreground text-center">
                  Start connecting with mentors to begin your journey.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeMentorshipsList.map((mentorship) => (
                <Card key={mentorship.id} className="glass-card border-border/50 border-l-4 border-l-green-500">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {mentorship.mentor_id === user.id
                              ? mentorship.mentee?.full_name?.charAt(0)
                              : mentorship.mentor?.full_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">
                            {mentorship.mentor_id === user.id
                              ? `Mentoring ${mentorship.mentee?.full_name}`
                              : `Mentored by ${mentorship.mentor?.full_name}`}
                          </CardTitle>
                          <CardDescription>
                            Started {new Date(mentorship.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="default" className="bg-green-500/10 text-green-500">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Active
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <MessageCircle className="mr-1 h-3 w-3" />
                        Message
                      </Button>
                      <MentorshipStatusActions mentorship={mentorship} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Completed Mentorships</h2>

          {completedMentorshipsList.length === 0 ? (
            <Card className="glass-card border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Heart className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Completed Mentorships</h3>
                <p className="text-muted-foreground text-center">
                  Your completed mentorship connections will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {completedMentorshipsList.map((mentorship) => (
                <Card key={mentorship.id} className="glass-card border-border/50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {mentorship.mentor_id === user.id
                              ? mentorship.mentee?.full_name?.charAt(0)
                              : mentorship.mentor?.full_name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">
                            {mentorship.mentor_id === user.id
                              ? `Mentored ${mentorship.mentee?.full_name}`
                              : `Mentored by ${mentorship.mentor?.full_name}`}
                          </CardTitle>
                          <CardDescription>
                            Completed {new Date(mentorship.updated_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Completed
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
