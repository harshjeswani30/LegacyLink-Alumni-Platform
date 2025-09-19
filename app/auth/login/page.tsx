"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { GraduationCap } from "lucide-react"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    console.log("Attempting login with email:", email.toLowerCase())

    try {
      const redirectBase =
        process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL ||
        process.env.NEXT_PUBLIC_APP_BASE_URL ||
        `${window.location.origin}`

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password,
      })

      console.log("Login result:", { data, error })

      if (error) throw error

      // Successful login - ensure user has a profile
      if (data.user) {
        console.log("Login successful, checking/creating profile...")
        
        // Check if user has a profile
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle()

        console.log("Profile check:", { profile, profileError })

        // Create profile if it doesn't exist
        if (!profile && !profileError) {
          console.log("Creating missing profile for logged-in user...")
          
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              id: data.user.id,
              email: data.user.email,
              full_name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || "Unknown User",
              role: data.user.user_metadata?.role || "alumni",
              university_id: data.user.user_metadata?.university_id || null,
              verified: false
            })
            .select()
            .single()

          console.log("Profile creation result:", { newProfile, createError })
        }
      }

      router.push("/dashboard")
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred"
      console.error("Login error:", error)
      console.error("Full error object:", JSON.stringify(error, null, 2))
      
      // Handle specific login errors with more detailed analysis
      const lowerError = errorMessage.toLowerCase()
      
      if (lowerError.includes("invalid login credentials")) {
        // This is the most common error - could be wrong password OR unconfirmed email
        setError("Login failed. This could be due to incorrect password or unverified email. Please check your password or verify your email first.")
      } else if (lowerError.includes("email not confirmed") || lowerError.includes("confirm your email")) {
        setError("Please verify your email address before signing in. Check your inbox for a verification link.")
      } else if (lowerError.includes("user not found")) {
        setError("No account found with this email address. Please sign up first or check your email.")
      } else if (lowerError.includes("invalid email or password")) {
        setError("Invalid email or password. Please check your credentials and try again.")
      } else if (lowerError.includes("invalid login")) {
        setError("Login failed. Please check your credentials or verify your email address.")
      } else {
        // Show the actual error message for debugging
        setError(`${errorMessage} (If you're sure your credentials are correct, your email might need verification)`)
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-center space-x-2">
            <GraduationCap className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">LegacyLink</span>
          </div>

          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="text-2xl">Welcome back</CardTitle>
              <CardDescription>Sign in to your alumni network</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin}>
                <div className="flex flex-col gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="alumni@university.edu"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                  {error && <p className="text-sm text-destructive">{error}</p>}
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm space-y-2">
                  <div>
                    Don't have an account?{" "}
                    <Link href="/auth/sign-up" className="underline underline-offset-4 text-primary">
                      Sign up
                    </Link>
                  </div>
                  <div>
                    Need to verify your email?{" "}
                    <Link href="/debug/login" className="underline underline-offset-4 text-primary">
                      Debug login issues
                    </Link>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
