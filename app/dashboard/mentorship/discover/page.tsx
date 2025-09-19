import { createClient } from "@/lib/supabase/server"
import { MentorshipDiscovery } from "@/components/mentorship-discovery"
import { redirect } from "next/navigation"

export default async function MentorshipDiscoverPage() {
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
    .select("*, university:universities(*), alumni_profile:alumni_profiles(*)")
    .eq("id", user.id)
    .single()

  if (!profile) {
    redirect("/auth/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Find Your Perfect Mentor</h1>
        <p className="text-muted-foreground">
          AI-powered matching connects you with alumni who can guide your career journey
        </p>
      </div>

      <MentorshipDiscovery profile={profile} />
    </div>
  )
}