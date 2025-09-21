// Find your current logged-in account and promote it
// Run this in browser console while logged into any account

async function findAndPromoteCurrentUser() {
  try {
    // Get currently logged in user
    const response = await fetch('/api/auth/user')
    if (response.ok) {
      const data = await response.json()
      console.log('Current user:', data)
      
      if (data.user) {
        console.log(`Your email: ${data.user.email}`)
        console.log(`Current role: ${data.user.profile?.role || 'Not set'}`)
        console.log('')
        console.log('To promote this account to super admin:')
        console.log('1. Go to http://localhost:3000/debug/admin-promotion')
        console.log(`2. Enter email: ${data.user.email}`)
        console.log('3. Click "Make Super Admin"')
      }
    } else {
      console.log('Not logged in or API error')
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

findAndPromoteCurrentUser()