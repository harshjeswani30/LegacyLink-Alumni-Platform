"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Users, UserPlus, CheckCircle } from "lucide-react"

export default function CreateTestUsersPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [createdUsers, setCreatedUsers] = useState<string[]>([])

  const createTestUser = async (name: string, email: string, role: string) => {
    try {
      const supabase = createClient()
      
      // Create auth user
      const { data, error } = await supabase.auth.signUp({
        email: email,
        password: "TestPassword123!",
        options: {
          data: {
            full_name: name,
            role: role
          }
        }
      })

      if (error) throw error

      if (data.user) {
        // Create profile manually to ensure it exists
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: data.user.id,
            email: email,
            full_name: name,
            role: role,
            verified: false, // This is key - unverified so shows in admin queue
            created_at: new Date().toISOString()
          })

        if (profileError) {
          console.warn("Profile creation error (may already exist):", profileError)
        }

        return { success: true, email }
      }
      
      throw new Error("User creation failed")
    } catch (error) {
      console.error("Error creating test user:", error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
  }

  const createBatchTestUsers = async () => {
    setLoading(true)
    setMessage("")
    setCreatedUsers([])

    const testUsers = [
      { name: "John Alumni", email: "john.alumni@test.com", role: "alumni" },
      { name: "Jane Student", email: "jane.student@test.com", role: "student" },
      { name: "Mike Mentor", email: "mike.mentor@test.com", role: "mentor" },
      { name: "Sarah Graduate", email: "sarah.graduate@test.com", role: "alumni" },
      { name: "Tom Current", email: "tom.current@test.com", role: "student" }
    ]

    const results = []
    for (const user of testUsers) {
      const result = await createTestUser(user.name, user.email, user.role)
      results.push({ ...user, ...result })
      
      if (result.success) {
        setCreatedUsers(prev => [...prev, user.email])
      }
      
      // Small delay between creations
      await new Promise(resolve => setTimeout(resolve, 1000))
    }

    const successful = results.filter(r => r.success).length
    const failed = results.filter(r => !r.success).length

    setMessage(`✅ Created ${successful} test users successfully. ${failed > 0 ? `${failed} failed.` : ''}`)
    setLoading(false)
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5" />
            <span>Create Test Users for Verification Queue</span>
          </CardTitle>
          <p className="text-muted-foreground">
            Create unverified test accounts to populate the admin verification queue
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {message && (
            <Alert className={message.includes("✅") ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold mb-2">What This Tool Does:</h3>
            <ul className="text-sm space-y-1">
              <li>✅ Creates 5 test user accounts</li>
              <li>✅ Sets them as <strong>unverified</strong> (verified = false)</li>
              <li>✅ Includes alumni, students, and mentors</li>
              <li>✅ These will appear in admin verification queue</li>
              <li>✅ Default password: <code>TestPassword123!</code></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Test Users to Create:</h3>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between p-2 border rounded">
                <span>John Alumni (john.alumni@test.com)</span>
                <span className="text-muted-foreground">Alumni</span>
              </div>
              <div className="flex justify-between p-2 border rounded">
                <span>Jane Student (jane.student@test.com)</span>
                <span className="text-muted-foreground">Student</span>
              </div>
              <div className="flex justify-between p-2 border rounded">
                <span>Mike Mentor (mike.mentor@test.com)</span>
                <span className="text-muted-foreground">Mentor</span>
              </div>
              <div className="flex justify-between p-2 border rounded">
                <span>Sarah Graduate (sarah.graduate@test.com)</span>
                <span className="text-muted-foreground">Alumni</span>
              </div>
              <div className="flex justify-between p-2 border rounded">
                <span>Tom Current (tom.current@test.com)</span>
                <span className="text-muted-foreground">Student</span>
              </div>
            </div>
          </div>

          {createdUsers.length > 0 && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Successfully Created ({createdUsers.length})
              </h3>
              <div className="text-sm space-y-1">
                {createdUsers.map(email => (
                  <div key={email}>✅ {email}</div>
                ))}
              </div>
            </div>
          )}

          <Button 
            onClick={createBatchTestUsers}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            <UserPlus className="h-5 w-5 mr-2" />
            {loading ? "Creating Test Users..." : "Create 5 Test Users"}
          </Button>

          <Alert>
            <Users className="h-4 w-4" />
            <AlertDescription>
              <strong>Next Steps:</strong><br />
              1. Click "Create 5 Test Users" above<br />
              2. Go to <a href="/debug/admin-promotion" className="text-blue-600 underline">/debug/admin-promotion</a> and make yourself admin<br />
              3. Visit <a href="/admin" className="text-blue-600 underline">/admin</a> to see the verification queue<br />
              4. You'll see the test users in "Multi-level Verification Queue" section<br />
              5. Click verification buttons to approve them
            </AlertDescription>
          </Alert>

          <div className="grid gap-2 md:grid-cols-2">
            <Button variant="outline" asChild>
              <a href="/debug/admin-promotion">
                <UserPlus className="h-4 w-4 mr-2" />
                Make Yourself Admin
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/admin">
                <Users className="h-4 w-4 mr-2" />
                View Admin Dashboard
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}