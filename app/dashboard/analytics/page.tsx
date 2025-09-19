import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { CareerHeatmap } from "@/components/career-heatmap"
import { AlumniMap } from "@/components/alumni-map"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"

export default async function AnalyticsPage() {
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

  // Get analytics data based on user role
  let analyticsData = {
    totalAlumni: 0,
    totalEvents: 0,
    totalMentorships: 0,
    totalDonations: 0,
    alumniByIndustry: [],
    alumniByLocation: [],
    alumniByGraduationYear: [],
    topSkills: [],
    recentActivity: []
  }

  if (profile.role === "super_admin") {
    // Super admin sees platform-wide analytics
    const [
      { count: totalAlumni },
      { count: totalEvents },
      { count: totalMentorships },
      { count: totalDonations }
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "alumni"),
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("mentorships").select("*", { count: "exact", head: true }),
      supabase.from("donations").select("*", { count: "exact", head: true })
    ])

    analyticsData.totalAlumni = totalAlumni || 0
    analyticsData.totalEvents = totalEvents || 0
    analyticsData.totalMentorships = totalMentorships || 0
    analyticsData.totalDonations = totalDonations || 0
  } else if (profile.role === "university_admin" && profile.university_id) {
    // University admin sees university-specific analytics
    const [
      { count: totalAlumni },
      { count: totalEvents },
      { count: totalMentorships },
      { count: totalDonations }
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "alumni").eq("university_id", profile.university_id),
      supabase.from("events").select("*", { count: "exact", head: true }).eq("university_id", profile.university_id),
      supabase.from("mentorships").select("*", { count: "exact", head: true }),
      supabase.from("donations").select("*", { count: "exact", head: true }).eq("university_id", profile.university_id)
    ])

    analyticsData.totalAlumni = totalAlumni || 0
    analyticsData.totalEvents = totalEvents || 0
    analyticsData.totalMentorships = totalMentorships || 0
    analyticsData.totalDonations = totalDonations || 0
  } else if (profile.university_id) {
    // Alumni and students see university-specific analytics
    const [
      { count: totalAlumni },
      { count: totalEvents },
      { count: totalMentorships },
      { count: totalDonations }
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "alumni").eq("university_id", profile.university_id),
      supabase.from("events").select("*", { count: "exact", head: true }).eq("university_id", profile.university_id),
      supabase.from("mentorships").select("*", { count: "exact", head: true }),
      supabase.from("donations").select("*", { count: "exact", head: true }).eq("university_id", profile.university_id)
    ])

    analyticsData.totalAlumni = totalAlumni || 0
    analyticsData.totalEvents = totalEvents || 0
    analyticsData.totalMentorships = totalMentorships || 0
    analyticsData.totalDonations = totalDonations || 0
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Analytics & Insights</h1>
        <p className="text-muted-foreground">
          Explore alumni distribution, career paths, and network insights
        </p>
      </div>

      <AnalyticsDashboard data={analyticsData} profile={profile} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CareerHeatmap profile={profile} />
        <AlumniMap profile={profile} />
      </div>
    </div>
  )
}

