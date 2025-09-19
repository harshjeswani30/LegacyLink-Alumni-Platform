import type React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"

export default async function Layout({ children }: { children: React.ReactNode }) {
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
    // Validate university_id from metadata against existing universities to satisfy FK
    const universityIdFromMeta = (user.user_metadata?.university_id as string | undefined) || undefined
    let safeUniversityId: string | null = null

    if (universityIdFromMeta) {
      const { data: uniExists } = await supabase
        .from("universities")
        .select("id")
        .eq("id", universityIdFromMeta)
        .maybeSingle()
      if (uniExists?.id) {
        safeUniversityId = uniExists.id
      } else {
        safeUniversityId = null
      }
    }

    // Create or update profile idempotently to avoid duplicate key race conditions
    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || "Unknown User",
          role: user.user_metadata?.role || "alumni",
          university_id: safeUniversityId,
        },
        { onConflict: "id" },
      )

    if (upsertError) {
      console.error("Error creating profile:", upsertError)
      redirect("/auth/login")
    }

    // Fetch the profile after upsert
    const { data: newProfile } = await supabase
      .from("profiles")
      .select("*, university:universities(*)")
      .eq("id", user.id)
      .single()

    if (!newProfile) {
      redirect("/auth/login")
    }

    return <DashboardLayout profile={newProfile} user={user}>{children}</DashboardLayout>
  }

  return <DashboardLayout profile={profile} user={user}>{children}</DashboardLayout>
}
