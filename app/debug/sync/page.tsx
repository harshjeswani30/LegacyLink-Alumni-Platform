"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertTriangle, CheckCircle } from "lucide-react"

interface SyncResult {
  type: "success" | "error" | "info"
  message: string
  data?: any
}

export default function AuthSyncPage() {
  const [results, setResults] = useState<SyncResult[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (type: SyncResult["type"], message: string, data?: any) => {
    setResults(prev => [...prev, { type, message, data }])
  }

  const clearResults = () => setResults([])

  const testSpecificEmail = async () => {
    const email = "22BCS15891@cuchd.in"
    const supabase = createClient()
    setLoading(true)

    try {
      addResult("info", `🔍 Testing specific email: ${email}`)

      // 1. Check profiles table
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email.toLowerCase())

      if (profileError) {
        addResult("error", "Failed to check profiles table", profileError)
      } else {
        addResult("info", `Found ${profiles?.length || 0} profiles with this email`, profiles)
      }

      // 2. Test signup to see what Supabase says
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password: "test123456",
        options: { data: { test_signup: true } }
      })

      if (signupError) {
        addResult("info", `Signup error: ${signupError.message}`, signupError)
        
        // Check if error indicates existing user
        const errorMsg = signupError.message.toLowerCase()
        if (errorMsg.includes("already") || errorMsg.includes("registered") || errorMsg.includes("exist")) {
          addResult("success", "✅ Email is already registered (detected via signup error)")
        } else {
          addResult("info", "❓ Signup error doesn't indicate existing user")
        }
      } else {
        addResult("success", "Signup succeeded (email was available)", signupData)
        
        // If signup succeeded, clean up the test user
        if (signupData.user) {
          addResult("info", "Cleaning up test signup...")
          // Note: We can't easily delete the test user from client side
        }
      }

      // 3. Test login with common passwords
      const testPasswords = ["testpassword123", "password123", "test123456", "123456"]
      
      for (const testPassword of testPasswords) {
        try {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: email.toLowerCase(),
            password: testPassword
          })

          if (loginError) {
            if (loginError.message.toLowerCase().includes("invalid login") || 
                loginError.message.toLowerCase().includes("invalid email or password")) {
              addResult("info", `❌ Login failed with password "${testPassword}" - wrong password`)
            } else if (loginError.message.toLowerCase().includes("email not confirmed")) {
              addResult("success", `✅ User exists but email not confirmed (password: ${testPassword})`)
              break
            } else {
              addResult("info", `Login error with "${testPassword}": ${loginError.message}`)
            }
          } else {
            addResult("success", `✅ Login successful with password "${testPassword}"`, loginData.user)
            // Logout immediately
            await supabase.auth.signOut()
            break
          }
        } catch (e) {
          addResult("error", `Login test failed with "${testPassword}"`, e)
        }
      }

    } catch (error) {
      addResult("error", "Test failed with unexpected error", error)
    } finally {
      setLoading(false)
    }
  }

  const syncAllData = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      addResult("info", "🔄 Starting comprehensive data sync...")

      // Get all profiles
      const { data: allProfiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (profilesError) {
        addResult("error", "Failed to fetch profiles", profilesError)
        return
      }

      addResult("info", `Found ${allProfiles?.length || 0} profiles in database`)

      // Check current auth state
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (user) {
        addResult("info", `Current authenticated user: ${user.email}`, user)
        
        // Check if current user has a profile
        const userProfile = allProfiles?.find(p => p.id === user.id)
        if (!userProfile) {
          addResult("error", "Current user missing profile - should create one")
        } else {
          addResult("success", "Current user has profile", userProfile)
        }
      } else {
        addResult("info", "No currently authenticated user")
      }

      // Look for profiles that might have sync issues
      const duplicateEmails = new Map<string, any[]>()
      allProfiles?.forEach(profile => {
        const email = profile.email.toLowerCase()
        if (!duplicateEmails.has(email)) {
          duplicateEmails.set(email, [])
        }
        duplicateEmails.get(email)!.push(profile)
      })

      for (const [email, profiles] of duplicateEmails) {
        if (profiles.length > 1) {
          addResult("error", `Duplicate profiles found for ${email}`, profiles)
        }
      }

      addResult("success", "✅ Data sync analysis complete")

    } catch (error) {
      addResult("error", "Sync failed with unexpected error", error)
    } finally {
      setLoading(false)
    }
  }

  const createMissingProfile = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (!user) {
        addResult("error", "No authenticated user to create profile for")
        return
      }

      addResult("info", `Creating profile for user: ${user.email}`)

      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle()

      if (existingProfile) {
        addResult("info", "Profile already exists", existingProfile)
        return
      }

      // Create profile
      const { data: newProfile, error: createError } = await supabase
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "Unknown User",
          role: user.user_metadata?.role || "alumni",
          university_id: user.user_metadata?.university_id || null,
          verified: false
        })
        .select()
        .single()

      if (createError) {
        addResult("error", "Failed to create profile", createError)
      } else {
        addResult("success", "✅ Profile created successfully", newProfile)
      }

    } catch (error) {
      addResult("error", "Profile creation failed", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Data Sync Utility</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button onClick={testSpecificEmail} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Problematic Email
            </Button>
            <Button onClick={syncAllData} disabled={loading} variant="outline">
              Sync All Data
            </Button>
            <Button onClick={createMissingProfile} disabled={loading} variant="outline">
              Create Missing Profile
            </Button>
            <Button onClick={clearResults} variant="destructive" size="sm">
              Clear Results
            </Button>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This tool helps debug authentication issues by testing email existence and data consistency.
              Use "Test Problematic Email" to check the specific email that's having issues.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sync Results ({results.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No sync operations run yet. Click a button above to start.
              </p>
            ) : (
              results.map((result, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={
                      result.type === "success" ? "default" :
                      result.type === "error" ? "destructive" : "secondary"
                    }>
                      {result.type === "success" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {result.type === "error" && <AlertTriangle className="h-3 w-3 mr-1" />}
                      {result.type}
                    </Badge>
                    <span className="text-sm font-medium">{result.message}</span>
                  </div>
                  {result.data && (
                    <pre className="bg-muted p-2 rounded text-xs overflow-x-auto mt-2">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}