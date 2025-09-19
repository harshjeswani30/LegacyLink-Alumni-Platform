"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  User, 
  MessageCircle,
  Briefcase,
  Calendar,
  AlertTriangle
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminMentorManagementPage() {
  const [mentors, setMentors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isAdmin, setIsAdmin] = useState(false)

  const loadMentors = async () => {
    setLoading(true)
    setError("")
    
    try {
      const supabase = createClient()
      
      // Check if current user is admin
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error("Not authenticated")
      }

      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (!currentProfile || !["admin", "super_admin", "university_admin"].includes(currentProfile.role)) {
        setIsAdmin(false)
        throw new Error("Admin access required")
      }

      setIsAdmin(true)

      // Get all mentors
      const { data: mentorData, error: mentorError } = await supabase
        .from("profiles")
        .select(`
          *,
          university:universities(name, domain),
          mentor_profile:mentor_profiles(*)
        `)
        .eq("role", "mentor")
        .order("created_at", { ascending: false })

      if (mentorError) throw mentorError

      setMentors(mentorData || [])

    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const verifyMentor = async (mentorId: string, verified: boolean) => {
    try {
      const supabase = createClient()
      
      const { error } = await supabase
        .from("profiles")
        .update({ 
          verified: verified,
          updated_at: new Date().toISOString()
        })
        .eq("id", mentorId)

      if (error) throw error
      
      alert(`Mentor ${verified ? 'verified' : 'unverified'} successfully!`)
      loadMentors()
    } catch (err) {
      alert("Error: " + (err instanceof Error ? err.message : "Unknown error"))
    }
  }

  useEffect(() => {
    loadMentors()
  }, [])

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading mentor management...
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Admin access required. Current user does not have admin privileges.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Error: {error}
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
            <User className="h-5 w-5" />
            <span>Mentor Management</span>
          </CardTitle>
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              Manage mentor verification and profiles
            </p>
            <Button onClick={loadMentors} size="sm" variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center mb-2">
              <MessageCircle className="h-4 w-4 text-blue-600 mr-2" />
              <span className="font-semibold text-blue-800">Mentor Verification System</span>
            </div>
            <p className="text-sm text-blue-700">
              Unlike alumni/students, mentors require manual admin verification for platform access.
              Verified mentors can create mentorship offerings and connect with students/alumni.
            </p>
          </div>

          {mentors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No mentor accounts found</p>
              <p className="text-sm">Mentors will appear here after registration</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mentors.map((mentor) => (
                <Card key={mentor.id} className={
                  mentor.verified 
                    ? "border-green-200 bg-green-50" 
                    : "border-yellow-200 bg-yellow-50"
                }>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src="/placeholder-user.jpg" />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {mentor.full_name?.charAt(0) || "M"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-base">{mentor.full_name}</CardTitle>
                          <p className="text-xs text-muted-foreground">{mentor.email}</p>
                        </div>
                      </div>
                      <Badge variant={mentor.verified ? "default" : "secondary"}>
                        {mentor.verified ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Pending
                          </>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span>University:</span>
                        <span className="text-muted-foreground">
                          {mentor.university?.name || "Not specified"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>LinkedIn:</span>
                        <Badge variant="outline" className="text-xs">
                          {mentor.linkedin_url ? "✓" : "✗"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Created:</span>
                        <span className="text-muted-foreground">
                          {new Date(mentor.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex space-x-2">
                      {!mentor.verified ? (
                        <Button 
                          onClick={() => verifyMentor(mentor.id, true)}
                          size="sm" 
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verify
                        </Button>
                      ) : (
                        <Button 
                          onClick={() => verifyMentor(mentor.id, false)}
                          size="sm" 
                          variant="outline"
                          className="flex-1"
                        >
                          <XCircle className="h-3 w-3 mr-1" />
                          Revoke
                        </Button>
                      )}
                      
                      <Button size="sm" variant="outline">
                        <User className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Total Mentors</p>
                <p className="text-2xl font-bold">{mentors.length}</p>
              </div>
              <User className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Verified</p>
                <p className="text-2xl font-bold text-green-600">
                  {mentors.filter(m => m.verified).length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {mentors.filter(m => !m.verified).length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}