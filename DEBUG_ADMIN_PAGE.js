// Check admin page data in browser console
// Go to http://localhost:3000/admin and run this in console

async function debugAdminPage() {
  console.log('🔍 Debugging admin page data...')
  
  // Check current user status
  try {
    const userResponse = await fetch('/api/auth/user')
    if (userResponse.ok) {
      const userData = await userResponse.json()
      console.log('✅ Current user:', userData.user?.email)
      console.log('✅ Current role:', userData.user?.profile?.role)
      console.log('✅ University ID:', userData.user?.profile?.university_id)
    }
  } catch (error) {
    console.error('❌ User check failed:', error)
  }
  
  // Check debug queue endpoint
  try {
    const debugResponse = await fetch('/api/admin/debug-queue', { method: 'POST' })
    if (debugResponse.ok) {
      const debugData = await debugResponse.json()
      console.log('🔍 Debug queue data:', debugData)
      console.log('📊 All unverified count:', debugData.allUnverifiedCount)
      console.log('📊 Visible to admin count:', debugData.visibleToAdminCount)
      console.log('👥 All unverified users:', debugData.allUnverified)
    } else {
      console.error('❌ Debug endpoint failed:', debugResponse.status)
    }
  } catch (error) {
    console.error('❌ Debug check failed:', error)
  }
  
  // Check page elements
  const queueSection = document.querySelector('[data-testid="verification-queue"]') || 
                       document.querySelector('*:contains("Multi-level Verification Queue")')
  if (queueSection) {
    console.log('✅ Found verification queue section')
  } else {
    console.log('❌ Verification queue section not found')
  }
  
  // Look for pending profile cards
  const profileCards = document.querySelectorAll('[data-profile-id]')
  console.log(`📱 Found ${profileCards.length} profile cards on page`)
  
  console.log('\n📋 Summary:')
  console.log('- Check if "All unverified count" > 0')
  console.log('- Check if "Visible to admin count" > 0') 
  console.log('- If counts are 0, there are no unverified users')
  console.log('- If all unverified > 0 but visible = 0, there\'s a filtering issue')
}

debugAdminPage()