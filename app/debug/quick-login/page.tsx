"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Mail, Loader2 } from "lucide-react"

export default function QuickLoginFixPage() {
  const [email, setEmail] = useState("22BCS15891@cuchd.in")
  const [password, setPassword] = useState("")
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (title: string, data: any, status: "success" | "error" | "info" = "info") => {
    setResults(prev => [...prev, { title, data, status, time: new Date().toLocaleTimeString() }])
  }

  const quickDiagnosis = async () => {
    const supabase = createClient()
    setLoading(true)
    setResults([])

    try {
      addResult("🔍 Starting Quick Login Diagnosis", { email }, "info")

      // 1. Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email.toLowerCase())
        .maybeSingle()

      if (profile) {
        addResult("✅ Profile Found", {
          id: profile.id,
          verified: profile.verified,
          email: profile.email,
          full_name: profile.full_name
        }, "success")
      } else {
        addResult("❌ No Profile Found", { profileError }, "error")
      }

      // 2. Try login to see the specific error
      if (password) {
        addResult("🔐 Testing Login", { email }, "info")
        
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase(),
          password: password
        })

        if (loginError) {
          addResult("❌ Login Failed", {
            error: loginError.message,
            status: loginError.status,
            name: loginError.name
          }, "error")

          // Specific diagnosis
          const errorMsg = loginError.message.toLowerCase()
          if (errorMsg.includes("invalid login credentials")) {
            addResult("🔍 Diagnosis", "This usually means: 1) Wrong password, OR 2) Email not verified", "info")
          } else if (errorMsg.includes("email not confirmed")) {
            addResult("🔍 Diagnosis", "Email verification required", "info")
          }
        } else {
          addResult("✅ Login Successful", {
            user_id: loginData.user?.id,
            email_confirmed: !!loginData.user?.email_confirmed_at
          }, "success")
          
          // Logout for testing
          await supabase.auth.signOut()
        }
      }

      // 3. Check if we can resend verification
      addResult("📧 Testing Email Verification Status", {}, "info")
      
      const { data: resendData, error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: email.toLowerCase()
      })

      if (resendError) {
        const resendMsg = resendError.message.toLowerCase()
        if (resendMsg.includes("already confirmed")) {
          addResult("✅ Email Already Verified", "Your email is confirmed - password might be wrong", "success")
        } else if (resendMsg.includes("user not found")) {
          addResult("❌ No Account Found", "You need to sign up first", "error")
        } else {
          addResult("❓ Resend Error", resendError.message, "error")
        }
      } else {
        addResult("📧 Verification Email Sent", "Check your inbox", "success")
      }

    } catch (error) {
      addResult("💥 Unexpected Error", error, "error")
    } finally {
      setLoading(false)
    }
  }

  const quickSignup = async () => {
    if (!password) {
      addResult("❌ Password Required", "Enter a password to create account", "error")
      return
    }

    const supabase = createClient()
    setLoading(true)

    try {
      addResult("📝 Attempting Quick Signup", { email }, "info")
      
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase(),
        password: password,
        options: {
          data: {
            full_name: "Test User",
            role: "alumni"
          }
        }
      })

      if (error) {
        addResult("❌ Signup Failed", error.message, "error")
      } else {
        addResult("✅ Signup Successful", "Check email for verification", "success")
      }
    } catch (error) {
      addResult("💥 Signup Error", error, "error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🚀 Quick Login Fix Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={quickDiagnosis} disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              🔍 Diagnose Login Issue
            </Button>
            <Button onClick={quickSignup} disabled={loading} variant="outline">
              📝 Try Signup (if needed)
            </Button>
          </div>

          <Alert>
            <Mail className="h-4 w-4" />
            <AlertDescription>
              This tool will quickly identify why your login isn't working and suggest solutions.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>🔍 Diagnosis Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                Enter your credentials above and click "Diagnose Login Issue"
              </p>
            ) : (
              results.map((result, index) => (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={
                      result.status === "success" ? "default" :
                      result.status === "error" ? "destructive" : "secondary"
                    }>
                      {result.status === "success" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {result.status === "error" && <XCircle className="h-3 w-3 mr-1" />}
                      {result.status}
                    </Badge>
                    <span className="font-medium text-sm">{result.title}</span>
                    <span className="text-xs text-muted-foreground ml-auto">{result.time}</span>
                  </div>
                  <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                    {typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2)}
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