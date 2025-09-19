import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ProfileForm } from "@/components/profile-form"
import { LinkedInConnection } from "@/components/linkedin-connection"
import { SelfVerification } from "@/components/self-verification"

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile with alumni profile data
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
        <h1 className="text-3xl font-bold text-foreground">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your profile information and preferences</p>
      </div>

      {/* Show verification component for alumni and students */}
      {(profile.role === "alumni" || profile.role === "student") && (
        <SelfVerification 
          userId={profile.id}
          userEmail={profile.email}
          isVerified={profile.verified}
        />
      )}

      {/* Quick link to verification page for unverified users */}
      {!user.email_confirmed_at && (
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            📧 Haven't received your verification email?{" "}
            <a 
              href="/auth/verify-email" 
              className="font-semibold text-yellow-800 dark:text-yellow-200 hover:underline"
            >
              Click here to resend it
            </a>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProfileForm profile={profile} />
        <LinkedInConnection profile={profile} />
      </div>
    </div>
  )
}
