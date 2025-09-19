"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/client"
import { RefreshCw, Database, CheckCircle, AlertCircle } from "lucide-react"
import { useState } from "react"

export function DataSyncTool() {
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [message, setMessage] = useState("")

  const syncData = async () => {
    setIsLoading(true)
    setResults(null)
    setMessage("")

    try {
      const supabase = createClient()

      // Get current user to check auth status
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      console.log("Current user:", user)
      console.log("User error:", userError)

      // Check profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10)

      console.log("Profiles:", profiles)
      console.log("Profiles error:", profilesError)

      // If user is logged in, ensure they have a profile
      if (user && !profilesError) {
        const userProfile = profiles?.find(p => p.id === user.id || p.email === user.email)
        
        if (!userProfile) {
          console.log("Creating missing profile for user:", user.email)
          
          // Create missing profile
          const { data: newProfile, error: createError } = await supabase
            .from("profiles")
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || "Unknown User",
              role: user.user_metadata?.role || "alumni",
              university_id: user.user_metadata?.university_id || null,
              verified: false
            })
            .select()
            .single()

          console.log("New profile created:", newProfile)
          console.log("Create error:", createError)
        }
      }

      setResults({
        currentUser: user ? {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.email_confirmed_at,
          user_metadata: user.user_metadata
        } : null,
        userError: userError?.message,
        profiles: profiles?.map(p => ({
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          role: p.role,
          verified: p.verified,
          created_at: p.created_at
        })) || [],
        profilesError: profilesError?.message,
        syncMessage: "Data sync completed"
      })

      setMessage("✅ Data sync completed successfully!")

    } catch (error) {
      console.error("Sync error:", error)
      setMessage("❌ Sync failed: " + (error as any).message)
    } finally {
      setIsLoading(false)
    }
  }

  const testEmailCheck = async (email: string) => {
    const supabase = createClient()
    
    try {
      // Test the exact same logic as signup
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id, email, verified")
        .eq("email", email.toLowerCase())
        .maybeSingle()

      console.log("Email check for", email, ":", { existingProfile, checkError })
      
      return { existingProfile, checkError }
    } catch (error) {
      console.error("Email check error:", error)
      return { error }
    }
  }

  return (
    <div className="space-y-6">
      <Card className="glass-card border-border/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Data Sync Tool</span>
          </CardTitle>
          <CardDescription>
            Sync authentication data between Supabase Auth and profiles table
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={syncData}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Syncing Data...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Sync Data
              </>
            )}
          </Button>

          {message && (
            <Alert variant={message.includes("✅") ? "default" : "destructive"}>
              {message.includes("✅") ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => testEmailCheck("22BCS15891@cuchd.in")}
            >
              Test Email: 22BCS15891@cuchd.in
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => testEmailCheck("alumni1@cuchd.in")}
            >
              Test Email: alumni1@cuchd.in
            </Button>
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card className="glass-card border-border/50">
          <CardHeader>
            <CardTitle>Sync Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Current Auth User:</h4>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-40">
                  {JSON.stringify(results.currentUser, null, 2)}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold mb-2">Profiles Table (Recent 10):</h4>
                <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-60">
                  {JSON.stringify(results.profiles, null, 2)}
                </pre>
              </div>

              {(results.userError || results.profilesError) && (
                <div>
                  <h4 className="font-semibold mb-2 text-red-600">Errors:</h4>
                  <pre className="bg-red-50 p-3 rounded text-xs overflow-auto">
                    {JSON.stringify({
                      userError: results.userError,
                      profilesError: results.profilesError
                    }, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}