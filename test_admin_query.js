// Test the admin page query directly
// Run this in browser console while logged in as admin

async function testAdminQuery() {
  console.log('🔍 Testing admin page query...')
  
  try {
    // Test the direct query
    const response = await fetch('/api/admin/debug-queue', { method: 'POST' })
    
    if (response.ok) {
      const data = await response.json()
      console.log('Admin queue debug data:', data)
    } else {
      console.error('Failed to fetch admin queue data:', response.status)
    }
    
    // Also test if we can see unverified users at all
    console.log('\n🔍 Manual check - go to your admin page and look for:')
    console.log('- "Alumni Verification Queue" section')
    console.log('- Should show unverified profiles with Verify/Reject buttons')
    console.log('- If empty, there might be a university filtering issue')
    
  } catch (error) {
    console.error('Error testing admin query:', error)
  }
}

testAdminQuery()