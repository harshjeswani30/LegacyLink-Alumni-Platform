"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Users,
  Calendar,
  Heart,
  UserCheck,
  Building2,
  Award,
  TrendingUp,
  CheckCircle,
  Clock,
  AlertCircle,
  GraduationCap,
} from "lucide-react"
import type { Profile } from "@/lib/types"
import Link from "next/link"

interface RoleBasedDashboardProps {
  profile: Profile
  stats: {
    alumniCount: number
    eventsCount: number
    mentorshipsCount: number
    donationsCount: number
    universitiesCount?: number
    pendingApprovals?: number
    userMentorshipsCountActive?: number
    userEventsAttendedCount?: number
    userBadgesCount?: number
  }
}

export function RoleBasedDashboard({ profile, stats }: RoleBasedDashboardProps) {
  if (profile.role === "super_admin") {
    return <SuperAdminDashboard profile={profile} stats={stats} />
  }

  if (profile.role === "university_admin") {
    return <UniversityAdminDashboard profile={profile} stats={stats} />
  }

  if (profile.role === "alumni") {
    return <AlumniDashboard profile={profile} stats={stats} />
  }

  if (profile.role === "student") {
    return <StudentDashboard profile={profile} stats={stats} />
  }

  return null
}

function SuperAdminDashboard({ profile, stats }: RoleBasedDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage the entire LegacyLink platform</p>
      </div>

      {/* Super Admin Stats (live counts) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Universities</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.universitiesCount || 0}</div>
            <p className="text-xs text-muted-foreground">Registered institutions</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingApprovals || 0}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alumni</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.alumniCount || 0}</div>
            <p className="text-xs text-muted-foreground">Across all universities</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eventsCount || 0}</div>
            <p className="text-xs text-muted-foreground">Live events count</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>Platform Management</CardTitle>
            <CardDescription>Manage universities and system-wide settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/universities">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <Building2 className="mr-2 h-4 w-4" />
                Manage Universities
              </Button>
            </Link>
            <Link href="/dashboard/analytics">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <TrendingUp className="mr-2 h-4 w-4" />
                Platform Analytics
              </Button>
            </Link>
            <Link href="/dashboard/settings">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <Award className="mr-2 h-4 w-4" />
                System Settings
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Platform-wide activity overview</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Live platform metrics shown above.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function UniversityAdminDashboard({ profile, stats }: RoleBasedDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">University Admin Dashboard</h1>
        <p className="text-muted-foreground">{profile.university?.name} • Manage your university's alumni network</p>
      </div>

      {/* University Admin Stats (live counts) */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alumni Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.alumniCount || 0}</div>
            <p className="text-xs text-muted-foreground">In your university</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eventsCount || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mentorships</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mentorshipsCount || 0}</div>
            <p className="text-xs text-muted-foreground">Active connections</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Donations</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.donationsCount || 0}k</div>
            <p className="text-xs text-muted-foreground">Total raised</p>
          </CardContent>
        </Card>
      </div>

      {/* University Admin Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>University Management</CardTitle>
            <CardDescription>Manage your university's alumni community</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/alumni">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Manage Alumni
              </Button>
            </Link>
            <Link href="/dashboard/events">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Create Events
              </Button>
            </Link>
            <Link href="/dashboard/donations">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <Heart className="mr-2 h-4 w-4" />
                View Donations
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>Alumni verification requests</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  <p className="text-sm">{stats.pendingApprovals || 0} alumni pending verification</p>
                </div>
                <Badge variant="secondary">Pending</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <p className="text-sm">{stats.alumniCount || 0} alumni verified total</p>
                </div>
                <Badge variant="default">Completed</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function AlumniDashboard({ profile, stats }: RoleBasedDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome back, {profile.full_name.split(" ")[0]}!</h1>
        <p className="text-muted-foreground">{profile.university?.name} Alumni • Connect, mentor, and give back</p>
      </div>

      {/* Alumni Progress (using live badge and activity counts) */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle>Profile Completion</CardTitle>
          <CardDescription>Complete your profile to unlock all features</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Profile Progress</span>
              <span className="text-sm text-muted-foreground">
                {Math.min(100, (stats.userBadgesCount || 0) * 10)}%
              </span>
            </div>
            <Progress value={Math.min(100, (stats.userBadgesCount || 0) * 10)} className="h-2" />
            <div className="grid gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{(stats.userBadgesCount || 0) >= 1 ? 'Basic information completed' : 'Complete basic information'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{profile.university ? 'University verified' : 'Verify your university'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span>{(stats.userMentorshipsCountActive || 0) > 0 ? 'Mentoring in progress' : 'Start mentoring'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span>{(stats.userEventsAttendedCount || 0) > 0 ? 'Event participation recorded' : 'Join an event'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alumni Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Size</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.alumniCount || 0}</div>
            <p className="text-xs text-muted-foreground">Alumni in your network</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Attended</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userEventsAttendedCount || 0}</div>
            <p className="text-xs text-muted-foreground">Events attended</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mentoring</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userMentorshipsCountActive || 0}</div>
            <p className="text-xs text-muted-foreground">Active mentorships</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Impact Points</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userBadgesCount || 0}</div>
            <p className="text-xs text-muted-foreground">Badges earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Alumni Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>Get Involved</CardTitle>
            <CardDescription>Ways to engage with your alumni community</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/mentorship">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <UserCheck className="mr-2 h-4 w-4" />
                Become a Mentor
              </Button>
            </Link>
            <Link href="/dashboard/events">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Join Events
              </Button>
            </Link>
            <Link href="/dashboard/donations">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <Heart className="mr-2 h-4 w-4" />
                Make a Donation
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>Recent Achievements</CardTitle>
            <CardDescription>Your latest contributions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Your recent achievements will appear here as you earn badges.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function StudentDashboard({ profile, stats }: RoleBasedDashboardProps) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Welcome, {profile.full_name.split(" ")[0]}!</h1>
        <p className="text-muted-foreground">
          {profile.university?.name} Student • Connect with alumni and grow your network
        </p>
      </div>

      {/* Student Progress */}
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>Complete these steps to make the most of LegacyLink</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Onboarding Progress</span>
              <span className="text-sm text-muted-foreground">60%</span>
            </div>
            <Progress value={60} className="h-2" />
            <div className="grid gap-2 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Profile created</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>University verified</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span>Find your first mentor</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span>Join an alumni event</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Mentors</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.floor((stats.alumniCount || 0) * 0.3)}</div>
            <p className="text-xs text-muted-foreground">Ready to help</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.eventsCount || 0}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alumni Network</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.alumniCount || 0}</div>
            <p className="text-xs text-muted-foreground">In your university</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Learning Points</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">150</div>
            <p className="text-xs text-muted-foreground">Engagement score</p>
          </CardContent>
        </Card>
      </div>

      {/* Student Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>Start Your Journey</CardTitle>
            <CardDescription>Connect with alumni and accelerate your career</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/dashboard/mentorship">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <UserCheck className="mr-2 h-4 w-4" />
                Find a Mentor
              </Button>
            </Link>
            <Link href="/dashboard/alumni">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <Users className="mr-2 h-4 w-4" />
                Browse Alumni
              </Button>
            </Link>
            <Link href="/dashboard/events">
              <Button className="w-full justify-start bg-transparent" variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                Join Events
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>Recommended for You</CardTitle>
            <CardDescription>Personalized opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 rounded-lg border border-border/50 p-3">
                <UserCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Software Engineering Mentor</p>
                  <p className="text-sm text-muted-foreground">Sarah Chen, Google</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 rounded-lg border border-border/50 p-3">
                <Calendar className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">Tech Career Fair</p>
                  <p className="text-sm text-muted-foreground">Next Friday, 2:00 PM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
