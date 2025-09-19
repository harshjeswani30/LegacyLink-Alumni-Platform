import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { GraduationCap } from "lucide-react"
import { ResendVerification } from "@/components/resend-verification"

interface SignUpSuccessPageProps {
  searchParams: Promise<{ email?: string }>
}

export default async function SignUpSuccessPage({ searchParams }: SignUpSuccessPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  
  // Get current user to check if they're already verified
  const { data: { user } } = await supabase.auth.getUser()
  
  // If user is already logged in and verified, redirect to dashboard
  if (user && user.email_confirmed_at) {
    redirect("/dashboard")
  }

  // Get email from URL params or current user
  const email = params.email || user?.email || ""
  
  if (!email) {
    redirect("/auth/sign-up")
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center space-x-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">LegacyLink</span>
          </div>

          <ResendVerification email={email} />

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Having trouble?{" "}
              <a 
                href="/auth/login" 
                className="text-primary hover:underline"
              >
                Back to Login
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
