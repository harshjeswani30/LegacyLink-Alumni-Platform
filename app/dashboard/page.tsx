import { createClient } from "@/lib/supabase/server"
import { RoleBasedDashboard } from "@/components/role-based-dashboard"

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*, university:universities(*)")
    .eq("id", user.id)
    .single()

  if (!profile) return null

  // Get dashboard stats based on role + per-user stats
  let stats = {
    alumniCount: 0,
    eventsCount: 0,
    mentorshipsCount: 0,
    donationsCount: 0,
    universitiesCount: 0,
    pendingApprovals: 0,
    userMentorshipsCountActive: 0,
    userEventsAttendedCount: 0,
    userBadgesCount: 0,
  }

  if (profile.role === "super_admin") {
    // Super admin sees platform-wide stats
    const [
      { count: alumniCount },
      { count: eventsCount },
      { count: mentorshipsCount },
      { count: donationsCount },
      { count: universitiesCount },
      { count: pendingApprovals },
    ] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "alumni"),
      supabase.from("events").select("*", { count: "exact", head: true }),
      supabase.from("mentorships").select("*", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("donations").select("*", { count: "exact", head: true }).eq("payment_status", "completed"),
      supabase.from("universities").select("*", { count: "exact", head: true }),
      supabase.from("profiles").select("*", { count: "exact", head: true }).eq("verified", false).in("role", ["alumni", "student"]),
    ])

    stats = {
      alumniCount: alumniCount || 0,
      eventsCount: eventsCount || 0,
      mentorshipsCount: mentorshipsCount || 0,
      donationsCount: donationsCount || 0,
      universitiesCount: universitiesCount || 0,
      pendingApprovals: pendingApprovals || 0,
      userMentorshipsCountActive: 0,
      userEventsAttendedCount: 0,
      userBadgesCount: 0,
    }
  } else if (profile.role === "university_admin" && profile.university_id) {
    // University admin sees university-specific stats
    const [
      { count: alumniCount }, 
      { count: eventsCount }, 
      { count: mentorshipsCount }, 
      { count: donationsCount },
      { count: pendingApprovals }
    ] = await Promise.all([
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "alumni")
          .eq("university_id", profile.university_id),
        supabase.from("events").select("*", { count: "exact", head: true }).eq("university_id", profile.university_id),
        supabase
          .from("mentorships")
          .select("*, mentor:profiles!mentor_id(university_id)", { count: "exact", head: true })
          .eq("status", "active"),
        supabase
          .from("donations")
          .select("*", { count: "exact", head: true })
          .eq("payment_status", "completed")
          .eq("university_id", profile.university_id),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("verified", false)
          .in("role", ["alumni", "student"])
          .eq("university_id", profile.university_id),
      ])

    stats = {
      alumniCount: alumniCount || 0,
      eventsCount: eventsCount || 0,
      mentorshipsCount: mentorshipsCount || 0,
      donationsCount: donationsCount || 0,
      universitiesCount: 0,
      pendingApprovals: pendingApprovals || 0,
      userMentorshipsCountActive: 0,
      userEventsAttendedCount: 0,
      userBadgesCount: 0,
    }
  } else if (profile.university_id) {
    // Alumni and students see university-specific stats
    const [
      { count: alumniCount }, 
      { count: eventsCount }, 
      { count: mentorshipsCount }, 
      { count: donationsCount },
      { count: pendingApprovals }
    ] = await Promise.all([
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "alumni")
          .eq("university_id", profile.university_id),
        supabase.from("events").select("*", { count: "exact", head: true }).eq("university_id", profile.university_id),
        supabase.from("mentorships").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase
          .from("donations")
          .select("*", { count: "exact", head: true })
          .eq("payment_status", "completed")
          .eq("university_id", profile.university_id),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("verified", false)
          .in("role", ["alumni", "student"])
          .eq("university_id", profile.university_id),
      ])

    stats = {
      alumniCount: alumniCount || 0,
      eventsCount: eventsCount || 0,
      mentorshipsCount: mentorshipsCount || 0,
      donationsCount: donationsCount || 0,
      universitiesCount: 0,
      pendingApprovals: pendingApprovals || 0,
      userMentorshipsCountActive: 0,
      userEventsAttendedCount: 0,
      userBadgesCount: 0,
    }
  }

  // Per-user stats (for all roles)
  const [
    { count: userMentorshipsCountActive },
    { count: userEventsAttendedCount },
    { count: userBadgesCount },
  ] = await Promise.all([
    supabase
      .from("mentorships")
      .select("*", { count: "exact", head: true })
      .eq("status", "active")
      .or(`mentor_id.eq.${user.id},mentee_id.eq.${user.id}`),
    supabase.from("event_registrations").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("badges").select("*", { count: "exact", head: true }).eq("user_id", user.id),
  ])

  stats.userMentorshipsCountActive = userMentorshipsCountActive || 0
  stats.userEventsAttendedCount = userEventsAttendedCount || 0
  stats.userBadgesCount = userBadgesCount || 0

  return <RoleBasedDashboard profile={profile} stats={stats} />
}
