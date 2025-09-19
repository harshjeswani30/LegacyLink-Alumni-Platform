"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, User, Shield, CheckCircle, XCircle } from "lucide-react"

export default function CheckMentorAccountPage() {
  const [accountData, setAccountData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const checkAccount = async () => {
    setLoading(true)
    setError("")
    
    try {
      const supabase = createClient()
      
      // Search for harshjeswani30@gmail.com specifically
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(`
          *,
          university:universities(name, domain, created_at)
        `)
        .eq("email", "harshjeswani30@gmail.com")
        .maybeSingle()

      if (profileError) {
        throw new Error(`Profile query error: ${profileError.message}`)
      }

      // Also check auth.users table (skip admin check for now)
      let authUser = null
      let authError = null
      
      // Get all profiles for comparison (to see what admin dashboard should show)
      const { data: allProfiles, error: allError } = await supabase
        .from("profiles")
        .select(`
          id, email, full_name, role, verified, created_at,
          university:universities(name)
        `)
        .order("created_at", { ascending: false })
        .limit(10)

      setAccountData({
        targetProfile: profile,
        authUser: authUser || null,
        authError: authError || null,
        allRecentProfiles: allProfiles || [],
        explanation: {
          found: !!profile,
          role: profile?.role || "unknown",
          verified: profile?.verified || false,
          inAuth: !!authUser,
          shouldShowInAdmin: profile?.role === "alumni" || profile?.role === "student" || profile?.role === "mentor"
        }
      })

    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const makeAdmin = async () => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("email", "harshjeswani30@gmail.com")

      if (error) throw error
      
      alert("Account updated to admin role!")
      checkAccount()
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"))
    }
  }

  const verifyAccount = async () => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from("profiles")
        .update({ verified: true })
        .eq("email", "harshjeswani30@gmail.com")

      if (error) throw error
      
      alert("Account verified!")
      checkAccount()
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"))
    }
  }

  useEffect(() => {
    checkAccount()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Checking harshjeswani30@gmail.com account...
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardContent className="py-8">
            <div className="text-red-600">Error: {error}</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Mentor Account Investigation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Target Account Status */}
          <div>
            <h3 className="font-semibold mb-3">harshjeswani30@gmail.com Account Status</h3>
            {accountData.targetProfile ? (
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="border-green-200 bg-green-50">
                  <CardContent className="pt-4">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
                      <span className="font-medium">Profile Found</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div><strong>Name:</strong> {accountData.targetProfile.full_name}</div>
                      <div><strong>Role:</strong> 
                        <Badge className="ml-2" variant={
                          accountData.targetProfile.role === "mentor" ? "default" : 
                          accountData.targetProfile.role === "admin" ? "destructive" : "secondary"
                        }>
                          {accountData.targetProfile.role}
                        </Badge>
                      </div>
                      <div><strong>Verified:</strong> 
                        <Badge className="ml-2" variant={accountData.targetProfile.verified ? "default" : "secondary"}>
                          {accountData.targetProfile.verified ? "Yes" : "No"}
                        </Badge>
                      </div>
                      <div><strong>University:</strong> {accountData.targetProfile.university?.name || "None"}</div>
                      <div><strong>Created:</strong> {new Date(accountData.targetProfile.created_at).toLocaleDateString()}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-4">
                    <div className="space-y-2">
                      <Button onClick={makeAdmin} size="sm" variant="outline" className="w-full">
                        <Shield className="h-4 w-4 mr-2" />
                        Make Admin (for testing)
                      </Button>
                      <Button onClick={verifyAccount} size="sm" variant="outline" className="w-full">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verify Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-4">
                  <div className="flex items-center">
                    <XCircle className="h-4 w-4 text-red-600 mr-2" />
                    <span className="font-medium text-red-800">Profile Not Found</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Why Not Showing in Admin */}
          <div>
            <h3 className="font-semibold mb-3">Why Not Showing in Admin Dashboard?</h3>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="space-y-2 text-sm">
                <div>✅ <strong>Profile exists:</strong> {accountData.explanation.found ? "Yes" : "No"}</div>
                <div>✅ <strong>Role is mentor:</strong> {accountData.explanation.role === "mentor" ? "Yes" : `No (${accountData.explanation.role})`}</div>
                <div>✅ <strong>Should show in admin:</strong> {accountData.explanation.shouldShowInAdmin ? "Yes" : "No"}</div>
                <div>✅ <strong>In auth table:</strong> {accountData.explanation.inAuth ? "Yes" : "No"}</div>
              </div>
              
              {accountData.authError && (
                <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-red-800 text-xs">
                  <strong>Auth Error:</strong> {accountData.authError}
                </div>
              )}
            </div>
          </div>

          {/* Recent Profiles (what admin dashboard sees) */}
          <div>
            <h3 className="font-semibold mb-3">Recent Profiles (Admin Dashboard View)</h3>
            <div className="space-y-2">
              {accountData.allRecentProfiles.map((profile: any) => (
                <div key={profile.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <User className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{profile.full_name}</div>
                      <div className="text-xs text-muted-foreground">{profile.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={
                      profile.role === "mentor" ? "default" : 
                      profile.role === "admin" ? "destructive" : 
                      profile.role === "alumni" ? "secondary" : "outline"
                    }>
                      {profile.role}
                    </Badge>
                    <Badge variant={profile.verified ? "default" : "secondary"}>
                      {profile.verified ? "Verified" : "Unverified"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={checkAccount} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </CardContent>
      </Card>

      {/* Raw Data */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Data (Debug)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
            {JSON.stringify(accountData, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}