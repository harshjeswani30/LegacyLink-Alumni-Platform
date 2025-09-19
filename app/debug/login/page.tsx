"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, AlertTriangle, CheckCircle, Info } from "lucide-react"

export default function LoginDebugPage() {
  const [email, setEmail] = useState("22BCS15891@cuchd.in")
  const [password, setPassword] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (title: string, data: any, type: "success" | "error" | "info" = "info") => {
    setResults(prev => [...prev, {
      id: Date.now(),
      title,
      data,
      type,
      timestamp: new Date().toLocaleTimeString()
    }])
  }

  const clearResults = () => setResults([])

  const testLogin = async () => {
    const supabase = createClient()
    setLoading(true)
    clearResults()

    try {
      addResult("Starting login test", { email, passwordLength: password.length }, "info")

      // Step 1: Check if user exists in profiles
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email.toLowerCase())
        .maybeSingle()

      addResult("Profile check", { profile, profileError }, profileError ? "error" : "info")

      // Step 2: Try actual login
      console.log("Attempting login with:", email.toLowerCase())
      
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password
      })

      console.log("Raw login result:", { loginData, loginError })

      if (loginError) {
        addResult("Login failed - Raw error", {
          message: loginError.message,
          status: loginError.status,
          name: loginError.name
        }, "error")

        // Analyze the specific error
        const errorMsg = loginError.message.toLowerCase()
        if (errorMsg.includes("invalid login credentials")) {
          addResult("Error Analysis", "This typically means either wrong password OR email not confirmed", "error")
        } else if (errorMsg.includes("email not confirmed")) {
          addResult("Error Analysis", "User exists but email is not verified", "error")
        } else if (errorMsg.includes("user not found")) {
          addResult("Error Analysis", "No user exists with this email in auth.users", "error")
        } else {
          addResult("Error Analysis", `Unknown error pattern: ${loginError.message}`, "error")
        }
      } else {
        addResult("Login successful!", {
          user: {
            id: loginData.user?.id,
            email: loginData.user?.email,
            confirmed_at: loginData.user?.confirmed_at,
            email_confirmed_at: loginData.user?.email_confirmed_at,
            last_sign_in_at: loginData.user?.last_sign_in_at
          }
        }, "success")

        // Logout immediately for testing
        await supabase.auth.signOut()
        addResult("Logged out (for testing)", {}, "info")
      }

      // Step 3: Check user confirmation status (if we know they exist)
      if (profile && loginError?.message.toLowerCase().includes("invalid login credentials")) {
        addResult("Checking confirmation status", "Since profile exists but login failed, checking auth status...", "info")
        
        // Try to get user info
        const { data: { user }, error: getUserError } = await supabase.auth.getUser()
        addResult("Current auth state", { user, getUserError }, "info")
      }

    } catch (error) {
      addResult("Unexpected error", error, "error")
    } finally {
      setLoading(false)
    }
  }

  const testEmailConfirmation = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      addResult("Testing email confirmation", { email }, "info")

      // Try to resend confirmation
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: email.toLowerCase()
      })

      if (error) {
        addResult("Resend confirmation result", {
          error: error.message,
          analysis: error.message.toLowerCase().includes("already confirmed") ? 
            "Email is already confirmed" : 
            "Email might not exist or other issue"
        }, "error")
      } else {
        addResult("Resend confirmation successful", data, "success")
      }

    } catch (error) {
      addResult("Confirmation test error", error, "error")
    } finally {
      setLoading(false)
    }
  }

  const testPasswordReset = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      addResult("Testing password reset", { email }, "info")

      const { data, error } = await supabase.auth.resetPasswordForEmail(email.toLowerCase())

      if (error) {
        addResult("Password reset result", {
          error: error.message,
          analysis: "Check if this gives us clues about user existence"
        }, "error")
      } else {
        addResult("Password reset sent", data, "success")
      }

    } catch (error) {
      addResult("Password reset error", error, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Login Debug Tool</CardTitle>
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
            <Button onClick={testLogin} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Test Login
            </Button>
            <Button onClick={testEmailConfirmation} disabled={loading} variant="outline">
              Test Email Confirmation
            </Button>
            <Button onClick={testPasswordReset} disabled={loading} variant="outline">
              Test Password Reset
            </Button>
            <Button onClick={clearResults} variant="destructive" size="sm">
              Clear Results
            </Button>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              This tool shows the actual error messages from Supabase to help diagnose login issues.
              Try entering your correct email and password, then click "Test Login".
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Debug Results ({results.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No tests run yet. Enter your credentials and click "Test Login" above.
              </p>
            ) : (
              results.map((result) => (
                <div key={result.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        result.type === "success" ? "default" :
                        result.type === "error" ? "destructive" : "secondary"
                      }>
                        {result.type === "success" && <CheckCircle className="h-3 w-3 mr-1" />}
                        {result.type === "error" && <AlertTriangle className="h-3 w-3 mr-1" />}
                        {result.type}
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