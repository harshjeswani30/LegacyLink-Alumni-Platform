import { createServiceRoleClient } from "@/lib/supabase/service"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CheckCircle, X, Users, Clock } from "lucide-react"

async function verifyUser(userId: string) {
  'use server'
  
  const adminSupabase = createServiceRoleClient()
  
  const { error } = await adminSupabase
    .from('profiles')
    .update({ 
      verified: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
  
  if (error) {
    throw new Error(`Failed to verify user: ${error.message}`)
  }
  
  // Revalidate the page
  const { revalidatePath } = await import('next/cache')
  revalidatePath('/admin-fresh')
}

async function rejectUser(userId: string) {
  'use server'
  
  const adminSupabase = createServiceRoleClient()
  
  // For now, we'll just delete the user - you can modify this behavior
  const { error } = await adminSupabase
    .from('profiles')
    .delete()
    .eq('id', userId)
  
  if (error) {
    throw new Error(`Failed to reject user: ${error.message}`)
  }
  
  // Revalidate the page
  const { revalidatePath } = await import('next/cache')
  revalidatePath('/admin-fresh')
}

export default async function FreshAdminPage() {
  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile || !["super_admin", "university_admin", "admin"].includes(profile.role)) {
    redirect("/dashboard")
  }

  // Use service role client for all queries
  const adminSupabase = createServiceRoleClient()

  // Get ALL unverified users with no filtering - completely fresh query
  const { data: allUnverifiedUsers, error } = await adminSupabase
    .from('profiles')
    .select(`
      id,
      email,
      full_name,
      role,
      verified,
      created_at,
      university_id
    `)
    .eq('verified', false)
    .in('role', ['alumni', 'student'])
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Fresh admin query error:', error)
  }

  // Filter by university for university admins only
  let displayUsers = allUnverifiedUsers || []
  if (profile.role === 'university_admin' && profile.university_id) {
    displayUsers = displayUsers.filter(user => user.university_id === profile.university_id)
  }

  // Get stats
  const totalUnverified = allUnverifiedUsers?.length || 0
  const displayCount = displayUsers.length

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Fresh Admin Verification System</h1>
          <p className="text-muted-foreground">
            Clean integration - {profile.role} access level
          </p>
        </div>
        <Badge variant="secondary" className="text-lg px-4 py-2">
          <Users className="w-4 h-4 mr-2" />
          {displayCount} pending verifications
        </Badge>
      </div>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Debug Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
            <div>
              <strong>Your Role:</strong> {profile.role}
            </div>
            <div>
              <strong>Total Unverified:</strong> {totalUnverified}
            </div>
            <div>
              <strong>You Can See:</strong> {displayCount}
            </div>
            <div>
              <strong>University Filter:</strong> {profile.role === 'university_admin' ? 'Yes' : 'No'}
            </div>
          </div>
          {error && (
            <div className="mt-4 p-2 bg-red-100 text-red-700 rounded">
              Query Error: {error.message}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Verifications ({displayCount})
          </CardTitle>
          <CardDescription>
            All unverified users requiring admin approval
          </CardDescription>
        </CardHeader>
        <CardContent>
          {displayUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending verifications found.
            </div>
          ) : (
            <div className="space-y-4">
              {displayUsers.map((user, index) => (
                <div 
                  key={user.id} 
                  className="flex items-center justify-between p-4 border rounded-lg bg-card"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold">{user.full_name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {user.role}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          University ID: {user.university_id || 'None'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <form action={verifyUser.bind(null, user.id)}>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Verify
                      </Button>
                    </form>
                    <form action={rejectUser.bind(null, user.id)}>
                      <Button size="sm" variant="destructive">
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Raw Data Debug */}
      <Card>
        <CardHeader>
          <CardTitle>Raw Query Results (Debug)</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-64">
            {JSON.stringify(displayUsers, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  )
}