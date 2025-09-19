import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GraduationCap } from "lucide-react"
import { ResendVerification } from "@/components/resend-verification"

export default async function VerifyEmailPage() {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser()
  
  // If no user, redirect to login
  if (!user) {
    redirect("/auth/login")
  }

  // If user is already verified, redirect to dashboard
  if (user.email_confirmed_at) {
    redirect("/dashboard")
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center space-x-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">LegacyLink</span>
          </div>

          <ResendVerification email={user.email || ""} />

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Already verified?{" "}
              <a 
                href="/auth/login" 
                className="text-primary hover:underline"
              >
                Login here
              </a>
            </p>
            <p className="text-sm text-muted-foreground">
              Wrong email?{" "}
              <a 
                href="/auth/sign-up" 
                className="text-primary hover:underline"
              >
                Create new account
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}