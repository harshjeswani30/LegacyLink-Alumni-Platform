import { createServiceRoleClient } from "@/lib/supabase/service"

export default async function TestVerifyPage() {
  const adminSupabase = createServiceRoleClient()
  
  // Get first unverified user for testing
  const { data: unverifiedUsers } = await adminSupabase
    .from('profiles')
    .select('id, full_name, email, verified')
    .eq('verified', false)
    .in('role', ['alumni', 'student'])
    .limit(1)
  
  const testUser = unverifiedUsers?.[0]
  
  async function testVerifyAPI(formData: FormData) {
    'use server'
    
    const userId = formData.get('userId') as string
    
    // Test the API endpoint directly from server side
    const apiUrl = `http://localhost:3000/api/admin/verify/${userId}`
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })
      
      const result = await response.json()
      console.log('API Test Result:', { status: response.status, result })
    } catch (error) {
      console.error('API Test Error:', error)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Verify API Test</h1>
      
      {testUser ? (
        <div className="space-y-4">
          <div className="p-4 border rounded">
            <h3 className="font-semibold">Test User:</h3>
            <p>Name: {testUser.full_name}</p>
            <p>Email: {testUser.email}</p>
            <p>ID: {testUser.id}</p>
            <p>Verified: {testUser.verified ? 'Yes' : 'No'}</p>
          </div>
          
          <form action={testVerifyAPI}>
            <input type="hidden" name="userId" value={testUser.id} />
            <button 
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Test Verify API
            </button>
          </form>
          
          <div className="p-4 bg-blue-50 rounded">
            <h3 className="font-semibold">Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1">
              <li>Click "Test Verify API" button</li>
              <li>Check the server console for API test results</li>
              <li>If successful, go back to /dashboard/alumni?verified=false</li>
              <li>Try clicking verify on any user profile</li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="p-4 text-center">
          <p>No unverified users found for testing.</p>
        </div>
      )}
    </div>
  )
}