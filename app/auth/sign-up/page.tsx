"use client"

import type React from "react"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { GraduationCap } from "lucide-react"
import type { University } from "@/lib/types"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [role, setRole] = useState<"alumni" | "student">("alumni")
  const [universityId, setUniversityId] = useState("")
  const [universities, setUniversities] = useState<University[]>([])
  const [error, setError] = useState<string | null>(null)
  const [universitiesError, setUniversitiesError] = useState<string | null>(null)
  const [isUniversitiesLoading, setIsUniversitiesLoading] = useState<boolean>(true)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  // Pre-fill email from URL params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search)
    const emailParam = urlParams.get('email')
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [])

  useEffect(() => {
    const fetchUniversities = async () => {
      setIsUniversitiesLoading(true)
      setUniversitiesError(null)
      const supabase = createClient()
      try {
        // First try: only approved universities
        const { data: approvedData, error: approvedError } = await supabase
          .from("universities")
          .select("*")
          .eq("approved", true)
          .order("name")

        if (approvedError) {
          console.error("Universities (approved) fetch error:", approvedError)
        }

        if (approvedData && approvedData.length > 0) {
          setUniversities(approvedData)
          return
        }

        // No approved universities found
        setUniversities([])
        setUniversitiesError("No approved universities available. Please ensure some are approved in the dashboard.")
      } catch (e) {
        console.error("Unexpected error fetching universities:", e)
        setUniversitiesError("Unexpected error loading universities.")
        setUniversities([])
      } finally {
        setIsUniversitiesLoading(false)
      }
    }
    fetchUniversities()
  }, [])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    const supabase = createClient()
    setIsLoading(true)
    setError(null)

    // Basic validation
    if (!email || !password || !fullName || !universityId) {
      setError("Please fill in all required fields")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setIsLoading(false)
      return
    }

    try {
      // Comprehensive email check - check both profiles table and attempt auth signup
      console.log("Checking email:", email.toLowerCase())
      
      // First check profiles table
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id, email, verified")
        .eq("email", email.toLowerCase())
        .maybeSingle()

      console.log("Profile check result:", { existingProfile, checkError })

      if (existingProfile) {
        // Email exists in profiles table
        if (existingProfile.verified) {
          setError("This email is already registered and verified. Please try logging in instead.")
        } else {
          setError("This email is already registered but not verified. Please check your email for verification link or resend it.")
        }
        setIsLoading(false)
        return
      }

      // Proceed with actual signup - Supabase will handle duplicate detection

      const redirectBase =
        process.env.NEXT_PUBLIC_SUPABASE_REDIRECT_URL ||
        process.env.NEXT_PUBLIC_APP_BASE_URL ||
        `${window.location.origin}`

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${redirectBase.replace(/\/$/, '')}/dashboard`,
          data: {
            full_name: fullName,
            role,
            university_id: universityId,
          },
        },
      })

      if (authError) throw authError

      router.push(`/auth/sign-up-success?email=${encodeURIComponent(email)}`)
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred"
      console.error("Sign up error:", error)
      
      // Handle specific Supabase error cases
      const lowerError = errorMessage.toLowerCase()
      console.log("Processing error:", lowerError)
      
      if (lowerError.includes("user already registered") || 
          lowerError.includes("email already exists") ||
          lowerError.includes("already registered") ||
          lowerError.includes("email address already registered") ||
          lowerError.includes("user with this email already exists") ||
          lowerError.includes("email address already") ||
          lowerError.includes("already been registered") ||
          lowerError.includes("email is already registered")) {
        setError("This email is already registered. Please try logging in instead.")
      } else if (lowerError.includes("email not confirmed") ||
                 lowerError.includes("signup requires email confirmation") ||
                 lowerError.includes("confirm your email")) {
        setError("This email is already registered but not verified. Please check your email for verification link.")
      } else if (lowerError.includes("invalid email")) {
        setError("Please enter a valid email address.")
      } else if (lowerError.includes("password")) {
        setError("Password must be at least 6 characters long.")
      } else {
        // Show the raw error message for debugging
        setError(`${errorMessage} (Please try logging in if you already have an account)`)
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
              <CardTitle className="text-2xl">Join your network</CardTitle>
              <CardDescription>Create your alumni profile</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignUp}>
                <div className="flex flex-col gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-background/50"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="john@university.edu"
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
                  <div className="grid gap-2">
                    <Label htmlFor="role">I am a</Label>
                    <Select value={role} onValueChange={(value: "alumni" | "student") => setRole(value)}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alumni">Alumni</SelectItem>
                        <SelectItem value="student">Current Student</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="university">University</Label>
                    <Select value={universityId} onValueChange={setUniversityId} disabled={isUniversitiesLoading || !!universitiesError || universities.length === 0}>
                      <SelectTrigger className="bg-background/50">
                        <SelectValue placeholder={isUniversitiesLoading ? "Loading universities..." : "Select your university"} />
                      </SelectTrigger>
                      <SelectContent>
                        {isUniversitiesLoading && (
                          <SelectItem value="__loading__" disabled>
                            Loading universities...
                          </SelectItem>
                        )}
                        {!isUniversitiesLoading && universitiesError && (
                          <SelectItem value="__error__" disabled>
                            {universitiesError}
                          </SelectItem>
                        )}
                        {!isUniversitiesLoading && !universitiesError && universities.length === 0 && (
                          <SelectItem value="__empty__" disabled>
                            No universities found
                          </SelectItem>
                        )}
                        {!isUniversitiesLoading && !universitiesError && universities.length > 0 && (
                          <>
                            {universities.map((university) => (
                              <SelectItem key={university.id} value={university.id}>
                                {university.name}
                              </SelectItem>
                            ))}
                          </>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  {error && (
                    <div className="space-y-2">
                      <p className="text-sm text-destructive">{error}</p>
                      {(error.toLowerCase().includes("already registered") || 
                        error.toLowerCase().includes("email already exists") ||
                        error.toLowerCase().includes("not verified")) && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                            It looks like you already have an account with this email.
                          </p>
                          <div className="flex space-x-2">
                            <Link href="/auth/login" className="flex-1">
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                className="w-full text-blue-600 border-blue-600 hover:bg-blue-50"
                              >
                                Go to Login
                              </Button>
                            </Link>
                            <Link href="/auth/verify-email" className="flex-1">
                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm" 
                                className="w-full"
                              >
                                Resend Verification
                              </Button>
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={isLoading || !universityId}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </div>
                <div className="mt-4 text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="underline underline-offset-4 text-primary">
                    Sign in
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
