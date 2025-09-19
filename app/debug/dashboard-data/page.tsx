"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"

export default function CheckDashboardDataPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setData({ error: "Not authenticated" })
        setLoading(false)
        return
      }

      // Get user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("*, university:universities(*)")
        .eq("id", user.id)
        .single()

      // Get the same stats as dashboard
      const [
        { count: totalAlumni },
        { count: totalEvents },
        { count: totalMentorships },
        { count: totalDonations },
        { count: pendingVerifications },
        { count: verifiedAlumni },
        { count: allProfiles }
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "alumni"),
        supabase.from("events").select("*", { count: "exact", head: true }),
        supabase.from("mentorships").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("donations").select("*", { count: "exact", head: true }).eq("payment_status", "completed"),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("verified", false).in("role", ["alumni", "student"]),
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("verified", true).in("role", ["alumni", "student"]),
        supabase.from("profiles").select("*", { count: "exact", head: true })
      ])

      // Get actual pending profiles to show
      const { data: pendingProfiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, role, created_at, verified")
        .eq("verified", false)
        .in("role", ["alumni", "student"])
        .order("created_at", { ascending: false })
        .limit(10)

      setData({
        user: {
          id: user.id,
          email: user.email,
          role: profile?.role
        },
        profile,
        stats: {
          totalAlumni: totalAlumni || 0,
          totalEvents: totalEvents || 0,
          totalMentorships: totalMentorships || 0,
          totalDonations: totalDonations || 0,
          pendingVerifications: pendingVerifications || 0,
          verifiedAlumni: verifiedAlumni || 0,
          allProfiles: allProfiles || 0
        },
        pendingProfiles: pendingProfiles || []
      })
    } catch (error) {
      setData({ error: error instanceof Error ? error.message : "Unknown error" })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading dashboard data...
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🔍 Dashboard Data Debug</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {data.error ? (
            <div className="text-red-600">Error: {data.error}</div>
          ) : (
            <>
              <div>
                <h3 className="font-semibold mb-2">Current User</h3>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  <div><strong>Email:</strong> {data.user.email}</div>
                  <div><strong>Role:</strong> {data.user.role}</div>
                  <div><strong>University:</strong> {data.profile?.university?.name || "None"}</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Platform Statistics (Real Data)</h3>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="text-lg font-bold">{data.stats.totalAlumni}</div>
                    <div className="text-xs text-muted-foreground">Total Alumni</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="text-lg font-bold">{data.stats.verifiedAlumni}</div>
                    <div className="text-xs text-muted-foreground">Verified Alumni</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded">
                    <div className="text-lg font-bold">{data.stats.pendingVerifications}</div>
                    <div className="text-xs text-muted-foreground">Pending Verification</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <div className="text-lg font-bold">{data.stats.allProfiles}</div>
                    <div className="text-xs text-muted-foreground">All Profiles</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Actual Pending Verifications</h3>
                {data.pendingProfiles.length > 0 ? (
                  <div className="space-y-2">
                    {data.pendingProfiles.map((profile: any) => (
                      <div key={profile.id} className="flex items-center justify-between p-3 border rounded">
                        <div>
                          <div className="font-medium">{profile.full_name}</div>
                          <div className="text-xs text-muted-foreground">{profile.email}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{profile.role}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(profile.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    ✅ No pending verifications found
                  </div>
                )}
              </div>

              <div>
                <h3 className="font-semibold mb-2">Expected Dashboard Display</h3>
                <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                  <div className="text-sm">
                    <div>• <strong>Pending Approvals:</strong> {data.stats.pendingVerifications} alumni pending verification</div>
                    <div>• <strong>Completed:</strong> {data.stats.verifiedAlumni} alumni verified total</div>
                  </div>
                </div>
              </div>
            </>
          )}

          <Button onClick={loadData} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Data
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}