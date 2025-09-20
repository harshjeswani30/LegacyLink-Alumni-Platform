"use client"

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DatabaseTestPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testDatabaseConnection = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Test 1: Check database connection
      const { data: connectionTest, error: connectionError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1)
      
      // Test 2: Get recent user registrations (last 24 hours)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const { data: recentUsers, error: usersError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          university_id,
          verified,
          linkedin_url,
          created_at,
          university:universities(name)
        `)
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
      
      // Test 3: Get all users for comparison
      const { data: allUsers, error: allUsersError } = await supabase
        .from('profiles')
        .select(`
          id,
          email,
          full_name,
          role,
          university_id,
          verified,
          linkedin_url,
          created_at,
          university:universities(name)
        `)
        .order('created_at', { ascending: false })
        .limit(20)
      
      // Test 4: Check auth users vs profiles sync
      const { data: authUser } = await supabase.auth.getUser()
      
      // Test 5: Check universities
      const { data: universities, error: universitiesError } = await supabase
        .from('universities')
        .select('*')
        .limit(10)
      
      setResults({
        connectionTest: { data: connectionTest, error: connectionError },
        recentUsers: { data: recentUsers, error: usersError, count: recentUsers?.length || 0 },
        allUsers: { data: allUsers, error: allUsersError, count: allUsers?.length || 0 },
        currentUser: authUser.user,
        universities: { data: universities, error: universitiesError },
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      setResults({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
    setLoading(false)
  }

  const testAdminQueries = async () => {
    setLoading(true)
    try {
      const supabase = createClient()
      
      // Test admin dashboard queries
      const [
        pendingVerifications,
        totalAlumni,
        totalStudents,
        verifiedUsers,
        unverifiedUsers
      ] = await Promise.all([
        // Pending verifications query (what admin dashboard uses)
        supabase
          .from("profiles")
          .select("*, university:universities(*)")
          .in("role", ["alumni", "student"])
          .eq("verified", false),
        
        // Total alumni
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "alumni"),
        
        // Total students  
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("role", "student"),
        
        // Verified users
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("verified", true),
        
        // Unverified users
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("verified", false)
      ])

      setResults({
        adminQueries: {
          pendingVerifications: { 
            data: pendingVerifications.data, 
            error: pendingVerifications.error,
            count: pendingVerifications.data?.length || 0
          },
          totalAlumni: { count: totalAlumni.count, error: totalAlumni.error },
          totalStudents: { count: totalStudents.count, error: totalStudents.error },
          verifiedUsers: { count: verifiedUsers.count, error: verifiedUsers.error },
          unverifiedUsers: { count: unverifiedUsers.count, error: unverifiedUsers.error }
        },
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      setResults({ error: error instanceof Error ? error.message : 'Unknown error' })
    }
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Database Connection & User Data Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button onClick={testDatabaseConnection} disabled={loading}>
              Test Database & Recent Users
            </Button>
            <Button onClick={testAdminQueries} disabled={loading} variant="outline">
              Test Admin Dashboard Queries
            </Button>
          </div>
          
          {loading && <p>Testing...</p>}
          
          {results && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4">Test Results:</h3>
              <pre className="bg-gray-100 p-4 rounded-lg overflow-auto text-sm max-h-96">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}