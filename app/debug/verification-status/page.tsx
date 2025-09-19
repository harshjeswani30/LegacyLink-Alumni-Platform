"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, AlertTriangle, RefreshCw } from "lucide-react"

export default function VerificationStatusPage() {
  const [userStatus, setUserStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const checkStatus = async () => {
    const supabase = createClient()
    setLoading(true)

    try {
      // Get current authenticated user
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (!user) {
        setUserStatus({ error: "No authenticated user found" })
        setLoading(false)
        return
      }

      // Get user's profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select(`
          *,
          university:universities(name, domain)
        `)
        .eq("id", user.id)
        .maybeSingle()

      // Check verification requirements
      const status = {
        user: {
          id: user.id,
          email: user.email,
          email_confirmed_at: user.email_confirmed_at,
          created_at: user.created_at,
          user_metadata: user.user_metadata
        },
        profile: profile,
        verification: {
          email_verified: !!user.email_confirmed_at,
          profile_exists: !!profile,
          admin_verified: profile?.verified || false,
          linkedin_connected: !!profile?.linkedin_url,
          should_need_admin_approval: !profile?.verified && profile?.role === 'alumni'
        },
        explanation: {}
      }

      // Explain verification status
      if (profile?.verified === true) {
        status.explanation = {
          status: "FULLY_VERIFIED",
          message: "Your account is fully verified and approved",
          reason: "The 'verified' field in your profile is set to true"
        }
      } else if (profile?.verified === false) {
        status.explanation = {
          status: "PENDING_ADMIN_APPROVAL", 
          message: "Your account needs admin approval",
          reason: "SIH system requires: Email verification + LinkedIn (optional) + Admin approval"
        }
      } else {
        status.explanation = {
          status: "UNKNOWN",
          message: "Profile verification status is unclear",
          reason: "Profile may not exist or have verification data"
        }
      }

      setUserStatus(status)
    } catch (error) {
      setUserStatus({ error: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setLoading(false)
    }
  }

  const toggleVerification = async () => {
    const supabase = createClient()
    
    try {
      const newVerified = !userStatus.profile.verified
      
      const { error } = await supabase
        .from("profiles")
        .update({ verified: newVerified })
        .eq("id", userStatus.user.id)

      if (error) {
        alert("Failed to update verification: " + error.message)
      } else {
        alert(`Verification ${newVerified ? 'enabled' : 'disabled'} successfully`)
        checkStatus() // Refresh
      }
    } catch (error) {
      alert("Error: " + (error instanceof Error ? error.message : "Unknown error"))
    }
  }

  useEffect(() => {
    checkStatus()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Checking verification status...
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!userStatus || userStatus.error) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {userStatus?.error || "Failed to check verification status"}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Your Verification Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Alert className={
            userStatus.explanation.status === "FULLY_VERIFIED" 
              ? "border-green-200 bg-green-50" 
              : "border-yellow-200 bg-yellow-50"
          }>
            <div className="flex items-center">
              {userStatus.explanation.status === "FULLY_VERIFIED" ? (
                <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
              )}
              <AlertDescription className={
                userStatus.explanation.status === "FULLY_VERIFIED" 
                  ? "text-green-800" 
                  : "text-yellow-800"
              }>
                <strong>{userStatus.explanation.message}</strong>
                <br />
                <small>{userStatus.explanation.reason}</small>
              </AlertDescription>
            </div>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Email Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <Badge variant={userStatus.verification.email_verified ? "default" : "destructive"}>
                    {userStatus.verification.email_verified ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Not Verified
                      </>
                    )}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Email: {userStatus.user.email}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Admin Approval</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <Badge variant={userStatus.verification.admin_verified ? "default" : "secondary"}>
                    {userStatus.verification.admin_verified ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Approved
                      </>
                    ) : (
                      <>
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Pending
                      </>
                    )}
                  </Badge>
                </div>
                <div className="mt-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={toggleVerification}
                  >
                    {userStatus.verification.admin_verified ? "Remove Approval" : "Approve (Test)"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">LinkedIn Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span>Status:</span>
                  <Badge variant={userStatus.verification.linkedin_connected ? "default" : "secondary"}>
                    {userStatus.verification.linkedin_connected ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Not Connected
                      </>
                    )}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {userStatus.profile?.linkedin_url || "No LinkedIn URL"}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profile Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <div><strong>Name:</strong> {userStatus.profile?.full_name}</div>
                  <div><strong>Role:</strong> {userStatus.profile?.role}</div>
                  <div><strong>University:</strong> {userStatus.profile?.university?.name || "Not set"}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="border rounded-lg p-4 bg-gray-50">
            <h3 className="font-semibold mb-2">SIH 2025 Multi-Level Verification System</h3>
            <div className="text-sm space-y-1">
              <div>✅ <strong>Step 1:</strong> Email verification (automatic via Supabase)</div>
              <div>⚪ <strong>Step 2:</strong> LinkedIn integration (optional but recommended)</div>
              <div>⚪ <strong>Step 3:</strong> Admin approval (required for alumni/students)</div>
            </div>
          </div>

          <Button onClick={checkStatus} variant="outline" className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Status
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw Data (Debug)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="bg-gray-100 p-4 rounded text-xs overflow-x-auto">
            {JSON.stringify(userStatus, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}