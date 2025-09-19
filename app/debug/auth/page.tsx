"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

export default function AuthDebugPage() {
  const [email, setEmail] = useState("22BCS15891@cuchd.in")
  const [password, setPassword] = useState("testpassword123")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (title: string, data: any, status: "success" | "error" | "info" = "info") => {
    setResults(prev => [...prev, {
      id: Date.now(),
      title,
      data,
      status,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const clearResults = () => setResults([])

  const testEmailExistence = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      addResult("Starting comprehensive email existence check", { email }, "info")

      // 1. Get current user to check auth state
      const { data: { user: currentUser }, error: getCurrentUserError } = await supabase.auth.getUser()
      addResult("Current auth user", { currentUser, getCurrentUserError }, "info")

      // 2. Check profiles table
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email.toLowerCase())

      addResult("Profiles table check", { profiles, profileError }, profileError ? "error" : "success")

      // 3. Test signup attempt (should fail if email exists)
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password: password + "_test",
        options: { data: { test_signup: true } }
      })

      addResult("Test signup attempt", { signupData, signupError }, "info")

      // 4. Summary
      const emailExists = (profiles?.length || 0) > 0 || 
        (signupError && signupError.message.toLowerCase().includes("already registered"))

      addResult("Email existence summary", {
        exists: emailExists,
        profilesCount: profiles?.length || 0,
        signupErrorIndicatesExists: signupError?.message.toLowerCase().includes("already registered"),
        currentUserEmail: currentUser?.email
      }, emailExists ? "error" : "success")

    } catch (error) {
      addResult("Unexpected error", error, "error")
    } finally {
      setLoading(false)
    }
  }

  const testLogin = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      addResult("Testing login", { email }, "info")

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password
      })

      if (error) {
        addResult("Login failed", { error: error.message }, "error")
      } else {
        addResult("Login successful", { 
          user: {
            id: data.user?.id,
            email: data.user?.email,
            confirmed_at: data.user?.confirmed_at,
            email_confirmed_at: data.user?.email_confirmed_at
          }
        }, "success")

        // Check profile after login
        if (data.user) {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", data.user.id)
            .maybeSingle()

          addResult("User profile after login", { profile, profileError }, profileError ? "error" : "success")
        }

        // Logout immediately for testing
        await supabase.auth.signOut()
        addResult("Logged out for testing", {}, "info")
      }
    } catch (error) {
      addResult("Login test error", error, "error")
    } finally {
      setLoading(false)
    }
  }

  const testSignup = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      addResult("Testing signup", { email }, "info")

      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: {
          data: {
            full_name: "Test User",
            role: "alumni",
            test_account: true
          }
        }
      })

      if (error) {
        addResult("Signup failed", { error: error.message }, "error")
      } else {
        addResult("Signup result", { 
          user: data.user ? {
            id: data.user.id,
            email: data.user.email,
            confirmed_at: data.user.confirmed_at
          } : null,
          session: data.session ? "Session created" : "No session"
        }, "success")
      }
    } catch (error) {
      addResult("Signup test error", error, "error")
    } finally {
      setLoading(false)
    }
  }

  const syncUserData = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      addResult("Starting user data sync", {}, "info")

      // Get all auth users (through profiles that might be missing auth data)
      const { data: allProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")

      if (profilesError) {
        addResult("Failed to get profiles", profilesError, "error")
        return
      }

      addResult("Found profiles", { count: allProfiles?.length }, "success")

      // Try to get current user to test auth state
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      addResult("Current auth user", { 
        user: user ? { id: user.id, email: user.email } : null, 
        userError 
      }, "info")

    } catch (error) {
      addResult("Sync error", error, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Debug Center</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={testEmailExistence} disabled={loading}>
              Check Email Existence
            </Button>
            <Button onClick={testLogin} disabled={loading} variant="outline">
              Test Login
            </Button>
            <Button onClick={testSignup} disabled={loading} variant="outline">
              Test Signup
            </Button>
            <Button onClick={syncUserData} disabled={loading} variant="outline">
              Sync User Data
            </Button>
            <Button onClick={clearResults} variant="destructive" size="sm">
              Clear Results
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Test Results ({results.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No tests run yet. Click a button above to start testing.
              </p>
            ) : (
              results.map((result) => (
                <div key={result.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        result.status === "success" ? "default" :
                        result.status === "error" ? "destructive" : "secondary"
                      }>
                        {result.status}
                      </Badge>
                      <span className="font-medium">{result.title}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {result.timestamp}
                    </span>
                  </div>
                  <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}