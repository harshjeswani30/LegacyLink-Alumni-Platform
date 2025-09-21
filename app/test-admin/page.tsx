import { createServiceRoleClient } from "@/lib/supabase/service"

export default async function TestAdminPage() {
  const adminSupabase = createServiceRoleClient()
  
  // Test the exact query from admin page
  const { data: pendingProfiles, error } = await adminSupabase
    .from("profiles")
    .select("full_name, email, role, verified")
    .eq("verified", false)
    .in("role", ["alumni", "student"])
    .order("created_at", { ascending: false })

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Test Page - Service Role Query</h1>
      
      {error && (
        <div className="bg-red-100 p-4 rounded mb-4">
          <p className="text-red-700">Error: {error.message}</p>
        </div>
      )}
      
      {pendingProfiles && (
        <div className="bg-green-100 p-4 rounded mb-4">
          <p className="text-green-700">Found {pendingProfiles.length} unverified users</p>
        </div>
      )}
      
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">All Unverified Users:</h2>
        {pendingProfiles?.map((profile, index) => (
          <div key={profile.email} className="border p-2 rounded">
            <span className="font-medium">{index + 1}. {profile.full_name}</span>
            <span className="text-gray-600"> ({profile.email})</span>
            <span className="text-blue-600"> - {profile.role}</span>
          </div>
        ))}
      </div>
      
      <div className="mt-6 p-4 bg-blue-100 rounded">
        <h3 className="font-semibold">Slice Test (first 9):</h3>
        {pendingProfiles?.slice(0, 9).map((profile, index) => (
          <div key={profile.email}>
            {index + 1}. {profile.full_name}
          </div>
        ))}
        <p className="mt-2 text-sm text-gray-600">
          Should show "View All" button: {(pendingProfiles?.length || 0) > 9 ? 'YES' : 'NO'}
        </p>
      </div>
    </div>
  )
}