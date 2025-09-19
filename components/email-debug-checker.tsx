"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"

export function EmailDebugChecker({ email }: { email: string }) {
  const [results, setResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const debugEmail = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      // Check profiles table
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email.toLowerCase())

      // Try to get current user (if this email is logged in)
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      // Try a signup attempt to see the exact error
      const { data: signupData, error: signupError } = await supabase.auth.signUp({
        email: email,
        password: "test123456"
      })

      setResults({
        email: email,
        profileData: profileData,
        profileError: profileError?.message,
        currentUser: user,
        userError: userError?.message,
        signupError: signupError?.message,
        signupData: signupData
      })

    } catch (error) {
      console.error("Debug error:", error)
      setResults({ error: "Debug failed" })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Email Debug Checker</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <span className="font-medium">Email:</span>
          <code className="bg-muted px-2 py-1 rounded">{email}</code>
          <Button onClick={debugEmail} disabled={isLoading} size="sm">
            {isLoading ? "Checking..." : "Debug"}
          </Button>
        </div>

        {results && (
          <div className="space-y-4">
            <div className="grid gap-4">
              <div>
                <h4 className="font-semibold">Profile Table Check:</h4>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                  {JSON.stringify({
                    found: !!results.profileData?.length,
                    data: results.profileData,
                    error: results.profileError
                  }, null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold">Current Auth User:</h4>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                  {JSON.stringify({
                    user: results.currentUser ? {
                      id: results.currentUser.id,
                      email: results.currentUser.email,
                      email_confirmed_at: results.currentUser.email_confirmed_at,
                      created_at: results.currentUser.created_at
                    } : null,
                    error: results.userError
                  }, null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold">Signup Test:</h4>
                <pre className="bg-muted p-2 rounded text-xs overflow-auto">
                  {JSON.stringify({
                    signupError: results.signupError,
                    userExists: results.signupError?.includes("already") || results.signupError?.includes("registered")
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}