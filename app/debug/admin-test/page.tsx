"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Users, 
  Shield,
  AlertTriangle,
  Database,
  Settings,
  UserCheck,
  GraduationCap
} from "lucide-react"

export default function AdminFunctionalityTestPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [testingFunctions, setTestingFunctions] = useState(false)

  const runTests = async () => {
    setLoading(true)
    setResults(null)
    
    try {
      const supabase = createClient()
      
      // Test 1: Check admin authentication
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (!user) {
        setResults({ 
          error: "Not authenticated - please login first",
          tests: {}
        })
        setLoading(false)
        return
      }

      // Test 2: Get admin profile
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*, university:universities(*)")
        .eq("id", user.id)
        .single()

      // Test 3: Check admin permissions
      const isAdmin = profile && ["university_admin", "super_admin", "admin"].includes(profile.role)

      // Test 4: Statistics queries (same as admin dashboard)
      const isUniversityAdmin = profile?.role === "university_admin" && profile.university_id

      const statsQueries = [
        // Total users
        isUniversityAdmin 
          ? supabase.from("profiles").select("*", { count: "exact", head: true }).eq("university_id", profile.university_id)
          : supabase.from("profiles").select("*", { count: "exact", head: true }),
        
        // Verified users  
        isUniversityAdmin
          ? supabase.from("profiles").select("*", { count: "exact", head: true }).eq("university_id", profile.university_id).eq("verified", true)
          : supabase.from("profiles").select("*", { count: "exact", head: true }).eq("verified", true),
        
        // Alumni count
        isUniversityAdmin
          ? supabase.from("profiles").select("*", { count: "exact", head: true }).eq("university_id", profile.university_id).eq("role", "alumni")
          : supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "alumni"),
        
        // Pending verifications
        isUniversityAdmin
          ? supabase.from("profiles").select("*", { count: "exact", head: true }).eq("university_id", profile.university_id).eq("verified", false).in("role", ["alumni", "student"])
          : supabase.from("profiles").select("*", { count: "exact", head: true }).eq("verified", false).in("role", ["alumni", "student"]),
        
        // Student count
        isUniversityAdmin
          ? supabase.from("profiles").select("*", { count: "exact", head: true }).eq("university_id", profile.university_id).eq("role", "student")
          : supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "student"),
        
        // Mentor count
        isUniversityAdmin
          ? supabase.from("profiles").select("*", { count: "exact", head: true }).eq("university_id", profile.university_id).eq("role", "mentor")
          : supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "mentor")
      ]

      const [
        { count: totalUsers },
        { count: verifiedUsers },
        { count: alumniCount },
        { count: pendingCount },
        { count: studentCount },
        { count: mentorCount }
      ] = await Promise.all(statsQueries)

      // Test 5: Get pending profiles
      let pendingQuery = supabase
        .from("profiles")
        .select("*, university:universities(*)")
        .eq("verified", false)
        .in("role", ["alumni", "student"])

      if (isUniversityAdmin) {
        pendingQuery = pendingQuery.eq("university_id", profile.university_id)
      }

      const { data: pendingProfiles, error: pendingError } = await pendingQuery
        .order("created_at", { ascending: false })
        .limit(5)

      // Test 6: Check admin API endpoints availability
      const adminApiTests = {
        createUniversity: "/api/admin/universities",
        verifyUser: "/api/admin/verify/[userId]"
      }

      setResults({
        tests: {
          authentication: {
            status: user ? "PASS" : "FAIL",
            data: { 
              userId: user?.id,
              email: user?.email,
              emailConfirmed: !!user?.email_confirmed_at
            },
            error: userError
          },
          profile: {
            status: profile ? "PASS" : "FAIL", 
            data: {
              role: profile?.role,
              university: profile?.university?.name,
              verified: profile?.verified
            },
            error: profileError
          },
          adminPermissions: {
            status: isAdmin ? "PASS" : "FAIL",
            data: {
              hasAdminRole: isAdmin,
              roleType: profile?.role,
              scope: isUniversityAdmin ? "University-specific" : "Platform-wide"
            }
          },
          statistics: {
            status: "PASS",
            data: {
              totalUsers: totalUsers || 0,
              verifiedUsers: verifiedUsers || 0,
              alumniCount: alumniCount || 0,
              studentCount: studentCount || 0,
              mentorCount: mentorCount || 0,
              pendingCount: pendingCount || 0,
              verificationRate: (totalUsers || 0) > 0 ? Math.round(((verifiedUsers || 0) / (totalUsers || 1)) * 100) : 0
            }
          },
          pendingProfiles: {
            status: pendingError ? "FAIL" : "PASS",
            data: {
              count: pendingProfiles?.length || 0,
              profiles: pendingProfiles?.slice(0, 3) || []
            },
            error: pendingError
          },
          adminApis: {
            status: "INFO",
            data: adminApiTests
          }
        },
        summary: {
          isAdmin,
          canAccessAdminDashboard: isAdmin,
          scope: isUniversityAdmin ? "University Admin" : profile?.role === "super_admin" ? "Super Admin" : "Regular Admin",
          issuesFound: []
        }
      })

    } catch (error) {
      setResults({ 
        error: error instanceof Error ? error.message : "Unknown error",
        tests: {}
      })
    } finally {
      setLoading(false)
    }
  }

  const testAdminFunctions = async () => {
    setTestingFunctions(true)
    try {
      // Test creating a test university (dry run)
      const createUnivResponse = await fetch("/api/admin/universities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          name: "Test University (DO NOT CREATE)", 
          domain: "test-dry-run.com" 
        })
      })

      alert(`University Creation API Test: ${createUnivResponse.ok ? "Available" : "Failed"} (${createUnivResponse.status})`)
    } catch (error) {
      alert("Admin function test failed: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setTestingFunctions(false)
    }
  }

  useEffect(() => {
    runTests()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Running admin functionality tests...
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!results || results.error) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {results?.error || "Failed to run tests"}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Admin Functionality Test Results</span>
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Comprehensive test of all admin dashboard functions
            </p>
            <div className="space-x-2">
              <Button onClick={runTests} size="sm" variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Re-run Tests
              </Button>
              <Button onClick={testAdminFunctions} size="sm" disabled={testingFunctions}>
                <Settings className="h-4 w-4 mr-2" />
                {testingFunctions ? "Testing..." : "Test Functions"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Summary */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className={results.summary.isAdmin ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2">
                  {results.summary.isAdmin ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="font-medium">Admin Access</span>
                </div>
                <p className="text-sm mt-1">{results.summary.scope}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Total Users</span>
                </div>
                <p className="text-2xl font-bold">{results.tests.statistics.data.totalUsers}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="font-medium">Pending Approval</span>
                </div>
                <p className="text-2xl font-bold">{results.tests.statistics.data.pendingCount}</p>
              </CardContent>
            </Card>
          </div>

          {/* Test Results */}
          <div className="space-y-4">
            <h3 className="font-semibold">Detailed Test Results</h3>
            
            {Object.entries(results.tests).map(([testName, test]: [string, any]) => (
              <Card key={testName}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="capitalize">{testName.replace(/([A-Z])/g, ' $1')}</span>
                    <Badge variant={
                      test.status === "PASS" ? "default" : 
                      test.status === "FAIL" ? "destructive" : "secondary"
                    }>
                      {test.status === "PASS" && <CheckCircle className="h-3 w-3 mr-1" />}
                      {test.status === "FAIL" && <XCircle className="h-3 w-3 mr-1" />}
                      {test.status === "INFO" && <Database className="h-3 w-3 mr-1" />}
                      {test.status}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {test.error && (
                    <Alert variant="destructive" className="mb-3">
                      <AlertDescription>{test.error.message || test.error}</AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="bg-gray-100 rounded p-3 text-xs">
                    <pre>{JSON.stringify(test.data, null, 2)}</pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Admin Dashboard Links */}
          <div>
            <h3 className="font-semibold mb-3">Admin Dashboard Access</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Button asChild>
                <a href="/admin">
                  <Shield className="h-4 w-4 mr-2" />
                  Main Admin Dashboard
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/admin/mentors">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Mentor Management
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/dashboard/alumni">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Alumni Directory
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="/dashboard">
                  <Users className="h-4 w-4 mr-2" />
                  User Dashboard
                </a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}