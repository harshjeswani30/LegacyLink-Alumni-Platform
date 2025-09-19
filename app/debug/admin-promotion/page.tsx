"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Shield, 
  Crown, 
  Building2, 
  User, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw
} from "lucide-react"

export default function AdminPromotionPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [universities, setUniversities] = useState<any[]>([])
  const [selectedUniversity, setSelectedUniversity] = useState("")

  const loadCurrentUser = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*, university:universities(*)")
        .eq("id", user.id)
        .single()
      
      setCurrentUser({ user, profile })
      setEmail(user.email || "")
    }
  }

  const loadUniversities = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from("universities")
      .select("*")
      .order("name")
    
    setUniversities(data || [])
  }

  const promoteToSuperAdmin = async () => {
    if (!email) {
      setMessage("Please enter an email address")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      
      // Find user by email
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email)
        .single()

      if (error || !profile) {
        setMessage("User not found with email: " + email)
        setLoading(false)
        return
      }

      // Update to super_admin
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ 
          role: "super_admin",
          updated_at: new Date().toISOString()
        })
        .eq("email", email)

      if (updateError) {
        setMessage("Failed to promote user: " + updateError.message)
      } else {
        setMessage(`✅ Successfully promoted ${email} to Super Admin!`)
        loadCurrentUser() // Refresh current user data
      }
    } catch (error) {
      setMessage("Error: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  const promoteToUniversityAdmin = async () => {
    if (!email || !selectedUniversity) {
      setMessage("Please enter email and select university")
      return
    }

    setLoading(true)
    try {
      const supabase = createClient()
      
      // Find user by email
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", email)
        .single()

      if (error || !profile) {
        setMessage("User not found with email: " + email)
        setLoading(false)
        return
      }

      // Update to university_admin
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ 
          role: "university_admin",
          university_id: selectedUniversity,
          updated_at: new Date().toISOString()
        })
        .eq("email", email)

      if (updateError) {
        setMessage("Failed to promote user: " + updateError.message)
      } else {
        const uni = universities.find(u => u.id === selectedUniversity)
        setMessage(`✅ Successfully promoted ${email} to University Admin for ${uni?.name}!`)
        loadCurrentUser()
      }
    } catch (error) {
      setMessage("Error: " + (error instanceof Error ? error.message : "Unknown error"))
    } finally {
      setLoading(false)
    }
  }

  const testAdminAccess = () => {
    window.open("/admin", "_blank")
  }

  useEffect(() => {
    loadCurrentUser()
    loadUniversities()
  }, [])

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Crown className="h-5 w-5" />
            <span>Admin Account Promotion Tool</span>
          </CardTitle>
          <p className="text-muted-foreground">
            Promote accounts to admin roles for testing and management
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Current User Status */}
          {currentUser && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold mb-2 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Current User Status
              </h3>
              <div className="grid gap-2 text-sm">
                <div><strong>Email:</strong> {currentUser.user.email}</div>
                <div><strong>Role:</strong> 
                  <Badge className="ml-2" variant={
                    currentUser.profile?.role === "super_admin" ? "default" :
                    currentUser.profile?.role === "university_admin" ? "secondary" : "outline"
                  }>
                    {currentUser.profile?.role || "user"}
                  </Badge>
                </div>
                <div><strong>University:</strong> {currentUser.profile?.university?.name || "None"}</div>
                <div><strong>Can Access Admin:</strong> 
                  <Badge className="ml-2" variant={
                    ["super_admin", "university_admin", "admin"].includes(currentUser.profile?.role) ? "default" : "destructive"
                  }>
                    {["super_admin", "university_admin", "admin"].includes(currentUser.profile?.role) ? "Yes" : "No"}
                  </Badge>
                </div>
              </div>
            </div>
          )}

          {/* Message Display */}
          {message && (
            <Alert className={message.includes("✅") ? "border-green-200 bg-green-50" : "border-yellow-200 bg-yellow-50"}>
              <AlertDescription>
                {message}
              </AlertDescription>
            </Alert>
          )}

          {/* Email Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email Address to Promote</label>
            <Input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Enter the email of the account you want to promote to admin
            </p>
          </div>

          {/* Promotion Buttons */}
          <div className="grid gap-4 md:grid-cols-2">
            
            {/* Super Admin Promotion */}
            <Card className="border-purple-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center space-x-2">
                  <Crown className="h-4 w-4 text-purple-600" />
                  <span>Super Admin</span>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Platform-wide access, can manage all universities
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-xs space-y-1">
                  <div>✅ Access all universities</div>
                  <div>✅ Verify any user</div>
                  <div>✅ Global analytics</div>
                  <div>✅ System management</div>
                </div>
                <Button 
                  onClick={promoteToSuperAdmin}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Crown className="h-4 w-4 mr-2" />}
                  Make Super Admin
                </Button>
              </CardContent>
            </Card>

            {/* University Admin Promotion */}
            <Card className="border-blue-200">
              <CardHeader>
                <CardTitle className="text-base flex items-center space-x-2">
                  <Building2 className="h-4 w-4 text-blue-600" />
                  <span>University Admin</span>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  University-specific access and management
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <select
                  value={selectedUniversity}
                  onChange={(e) => setSelectedUniversity(e.target.value)}
                  className="w-full p-2 border rounded text-sm"
                >
                  <option value="">Select University</option>
                  {universities.map((uni) => (
                    <option key={uni.id} value={uni.id}>
                      {uni.name}
                    </option>
                  ))}
                </select>
                
                <div className="text-xs space-y-1">
                  <div>✅ University-specific access</div>
                  <div>✅ Verify university users</div>
                  <div>✅ University analytics</div>
                  <div>✅ Event management</div>
                </div>

                <Button 
                  onClick={promoteToUniversityAdmin}
                  disabled={loading || !selectedUniversity}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Building2 className="h-4 w-4 mr-2" />}
                  Make University Admin
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Test Admin Access */}
          <div className="p-4 bg-gray-50 border rounded-lg">
            <h3 className="font-semibold mb-2 flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              Test Admin Dashboard Access
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              After promoting an account, test if the admin dashboard is accessible
            </p>
            <Button onClick={testAdminAccess} variant="outline" className="w-full">
              <Shield className="h-4 w-4 mr-2" />
              Open Admin Dashboard (New Tab)
            </Button>
          </div>

          {/* Quick Access Links */}
          <div className="grid gap-2 md:grid-cols-2">
            <Button variant="outline" asChild>
              <a href="/admin/mentors">
                <User className="h-4 w-4 mr-2" />
                Mentor Management
              </a>
            </Button>
            <Button variant="outline" asChild>
              <a href="/debug/admin-test">
                <CheckCircle className="h-4 w-4 mr-2" />
                Admin Function Test
              </a>
            </Button>
          </div>

          {/* Instructions */}
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>How to use:</strong><br />
              1. Enter email address of account to promote<br />
              2. Choose Super Admin (platform-wide) or University Admin (specific university)<br />
              3. Click promotion button<br />
              4. Test access using "Open Admin Dashboard" button<br />
              5. Visit /admin to see verification queue with unverified users
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}