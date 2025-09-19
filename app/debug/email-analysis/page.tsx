"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface EmailTestResult {
  email: string
  exists: boolean
  profileExists: boolean
  authUserExists: boolean | null
  signupError: string | null
  canLogin: boolean | null
  loginError: string | null
  recommendations: string[]
}

export default function EmailAnalysisPage() {
  const [testEmail] = useState("22BCS15891@cuchd.in")
  const [result, setResult] = useState<EmailTestResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [allProfiles, setAllProfiles] = useState<any[]>([])

  const runComprehensiveTest = async () => {
    const supabase = createClient()
    setLoading(true)
    
    const testResult: EmailTestResult = {
      email: testEmail,
      exists: false,
      profileExists: false,
      authUserExists: null,
      signupError: null,
      canLogin: null,
      loginError: null,
      recommendations: []
    }

    try {
      console.log("🔍 Starting comprehensive email analysis for:", testEmail)

      // 1. Check profiles table
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", testEmail.toLowerCase())

      console.log("📊 Profiles check:", { profiles, profileError })
      testResult.profileExists = profiles ? profiles.length > 0 : false

      // 2. Test signup to see if email is already registered
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: testEmail.toLowerCase(),
        password: "testpassword123_analysis",
        options: { data: { test_analysis: true } }
      })

      console.log("📝 Signup test:", { signupData, signupError })
      testResult.signupError = signupError?.message || null
      testResult.authUserExists = signupError ? (
        signupError.message.toLowerCase().includes("already registered") || 
        signupError.message.toLowerCase().includes("already been registered")
      ) : null

      // 3. Test login
      if (testResult.authUserExists || testResult.profileExists) {
        try {
          const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
            email: testEmail.toLowerCase(),
            password: "testpassword123" // Common test password
          })

          console.log("🔐 Login test:", { loginData, loginError })
          testResult.canLogin = !loginError
          testResult.loginError = loginError?.message || null

          if (loginData.user) {
            // Logout immediately
            await supabase.auth.signOut()
          }
        } catch (loginTestError) {
          console.log("Login test failed:", loginTestError)
          testResult.canLogin = false
          testResult.loginError = "Login test failed"
        }
      }

      // 4. Determine overall existence
      testResult.exists = testResult.profileExists || testResult.authUserExists === true

      // 5. Generate recommendations
      if (!testResult.exists) {
        testResult.recommendations.push("✅ Email is available for new signup")
      } else {
        if (testResult.profileExists && !testResult.authUserExists) {
          testResult.recommendations.push("⚠️ Profile exists but no auth user - data inconsistency")
          testResult.recommendations.push("🔧 Need to clean up orphaned profile or create auth user")
        }
        if (testResult.authUserExists && !testResult.profileExists) {
          testResult.recommendations.push("⚠️ Auth user exists but no profile - missing profile creation")
          testResult.recommendations.push("🔧 Profile should be created during login")
        }
        if (testResult.authUserExists && testResult.profileExists) {
          testResult.recommendations.push("✅ User exists in both auth and profiles")
          if (testResult.canLogin === false) {
            testResult.recommendations.push("🔐 User exists but cannot login - check password or verification status")
          }
        }
      }

    } catch (error) {
      console.error("Comprehensive test failed:", error)
      testResult.recommendations.push("❌ Test failed with error: " + (error as Error).message)
    }

    setResult(testResult)
    setLoading(false)
  }

  const loadAllProfiles = async () => {
    const supabase = createClient()
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20)

    if (!error && profiles) {
      setAllProfiles(profiles)
    }
  }

  useEffect(() => {
    loadAllProfiles()
  }, [])

  const getStatusIcon = (status: boolean | null) => {
    if (status === null) return <AlertCircle className="h-4 w-4 text-yellow-500" />
    if (status === true) return <CheckCircle className="h-4 w-4 text-green-500" />
    return <XCircle className="h-4 w-4 text-red-500" />
  }

  const getStatusText = (status: boolean | null) => {
    if (status === null) return "Unknown"
    if (status === true) return "Yes"
    return "No"
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Existence Analysis: {testEmail}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runComprehensiveTest} disabled={loading} className="w-full">
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Run Comprehensive Analysis
          </Button>

          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.profileExists)}
                      <div>
                        <div className="text-sm font-medium">Profile Exists</div>
                        <div className="text-xs text-muted-foreground">
                          {getStatusText(result.profileExists)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.authUserExists)}
                      <div>
                        <div className="text-sm font-medium">Auth User Exists</div>
                        <div className="text-xs text-muted-foreground">
                          {getStatusText(result.authUserExists)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.canLogin)}
                      <div>
                        <div className="text-sm font-medium">Can Login</div>
                        <div className="text-xs text-muted-foreground">
                          {getStatusText(result.canLogin)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(result.exists)}
                      <div>
                        <div className="text-sm font-medium">Overall Exists</div>
                        <div className="text-xs text-muted-foreground">
                          {getStatusText(result.exists)}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {result.signupError && (
                <Alert>
                  <AlertDescription>
                    <strong>Signup Error:</strong> {result.signupError}
                  </AlertDescription>
                </Alert>
              )}

              {result.loginError && (
                <Alert>
                  <AlertDescription>
                    <strong>Login Error:</strong> {result.loginError}
                  </AlertDescription>
                </Alert>
              )}

              {result.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-1">
                      {result.recommendations.map((rec, index) => (
                        <li key={index} className="text-sm">{rec}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Profiles ({allProfiles.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {allProfiles.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center space-x-2">
                  <Badge variant={profile.verified ? "default" : "secondary"}>
                    {profile.verified ? "Verified" : "Pending"}
                  </Badge>
                  <span className="text-sm font-medium">{profile.email}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {profile.full_name} • {profile.role}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}