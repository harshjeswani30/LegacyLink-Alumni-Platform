import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Award, Trophy, Star, Target, TrendingUp, Calendar } from "lucide-react"

export default async function AchievementsPage() {
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

  // Get user's badges
  const { data: userBadges } = await supabase
    .from("badges")
    .select("*")
    .eq("user_id", user.id)
    .order("earned_at", { ascending: false })

  // Get badge statistics
  const totalPoints = userBadges?.reduce((sum, badge) => sum + badge.points, 0) || 0
  const badgesByType =
    userBadges?.reduce(
      (acc, badge) => {
        acc[badge.badge_type] = (acc[badge.badge_type] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    ) || {}

  // Get recent achievements (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentBadges = userBadges?.filter((badge) => new Date(badge.earned_at) >= thirtyDaysAgo) || []

  // Get leaderboard data (top users by points in the same university)
  const { data: leaderboard } = await supabase
    .from("badges")
    .select(`
      user_id,
      points,
      profiles!inner(full_name, university_id)
    `)
    .eq("profiles.university_id", profile.university_id)
    .order("points", { ascending: false })
    .limit(10)

  // Calculate user's rank
  const userRank = leaderboard?.findIndex((entry) => entry.user_id === user.id) + 1 || 0

  // Available badge types with descriptions
  const badgeTypes = [
    {
      type: "mentorship",
      icon: Award,
      title: "Mentorship",
      description: "Earned through mentoring activities",
      color: "text-blue-500",
    },
    {
      type: "donation",
      icon: Trophy,
      title: "Philanthropy",
      description: "Earned through donations and giving back",
      color: "text-green-500",
    },
    {
      type: "event",
      icon: Calendar,
      title: "Community",
      description: "Earned through event participation",
      color: "text-purple-500",
    },
    {
      type: "profile",
      icon: Star,
      title: "Profile",
      description: "Earned through profile completion",
      color: "text-yellow-500",
    },
    {
      type: "community",
      icon: Target,
      title: "Engagement",
      description: "Earned through community engagement",
      color: "text-red-500",
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Achievements</h1>
        <p className="text-muted-foreground">Track your progress and celebrate your accomplishments</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Badges</CardTitle>
            <Award className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userBadges?.length || 0}</div>
            <p className="text-xs text-muted-foreground">Achievements earned</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Points</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPoints}</div>
            <p className="text-xs text-muted-foreground">Achievement points</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">University Rank</CardTitle>
            <Trophy className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">#{userRank || "N/A"}</div>
            <p className="text-xs text-muted-foreground">Among peers</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Badges</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentBadges.length}</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="badges" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="badges">My Badges ({userBadges?.length || 0})</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="badges" className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Your Achievements</h2>

          {!userBadges || userBadges.length === 0 ? (
            <Card className="glass-card border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Badges Yet</h3>
                <p className="text-muted-foreground text-center">
                  Start participating in activities to earn your first badge!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {userBadges.map((badge) => {
                const badgeType = badgeTypes.find((type) => type.type === badge.badge_type)
                const IconComponent = badgeType?.icon || Award

                return (
                  <Card key={badge.id} className="glass-card border-border/50">
                    <CardHeader>
                      <div className="flex items-center space-x-4">
                        <div className={`p-3 rounded-full bg-primary/10 ${badgeType?.color || "text-primary"}`}>
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{badge.title}</CardTitle>
                          <CardDescription>{badge.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="capitalize">
                          {badge.badge_type.replace("_", " ")}
                        </Badge>
                        <div className="text-right">
                          <div className="text-sm font-semibold">{badge.points} points</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(badge.earned_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">Achievement Progress</h2>

          <div className="grid gap-6 md:grid-cols-2">
            {badgeTypes.map((badgeType) => {
              const count = badgesByType[badgeType.type] || 0
              const IconComponent = badgeType.icon

              return (
                <Card key={badgeType.type} className="glass-card border-border/50">
                  <CardHeader>
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-full bg-primary/10 ${badgeType.color}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{badgeType.title}</CardTitle>
                        <CardDescription>{badgeType.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Badges Earned</span>
                        <span>{count} / 10</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.min((count / 10) * 100, 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {count === 0
                          ? "Get started to earn your first badge!"
                          : `${10 - count} more to reach the next milestone`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">University Leaderboard</h2>

          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle>Top Contributors</CardTitle>
              <CardDescription>Leading alumni and students in your university</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {leaderboard?.slice(0, 10).map((entry, index) => (
                  <div
                    key={entry.user_id}
                    className={`flex items-center space-x-4 p-3 rounded-lg ${
                      entry.user_id === user.id ? "bg-primary/10 border border-primary/20" : "hover:bg-accent/50"
                    }`}
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
                      <span className="text-sm font-bold">#{index + 1}</span>
                    </div>
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {entry.profiles?.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="font-medium">
                        {entry.profiles?.full_name}
                        {entry.user_id === user.id && (
                          <Badge variant="outline" className="ml-2">
                            You
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{entry.points} points</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
