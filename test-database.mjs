const { createClient } = require('./lib/supabase/server')

async function testDatabase() {
  console.log('🔍 Testing database connection and user data...')
  
  try {
    const supabase = await createClient()
    
    // Test 1: Basic connection
    console.log('\n1. Testing database connection...')
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (connectionError) {
      console.error('❌ Connection failed:', connectionError)
      return
    }
    console.log('✅ Database connection successful')
    
    // Test 2: Check all users
    console.log('\n2. Checking all users in profiles table...')
    const { data: allUsers, error: usersError } = await supabase
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
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }
    
    console.log(`📊 Total users found: ${allUsers?.length || 0}`)
    if (allUsers && allUsers.length > 0) {
      console.log('\n📋 User details:')
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.role}) - Verified: ${user.verified} - University: ${user.university?.name || 'None'}`)
      })
    }
    
    // Test 3: Check pending verifications (what admin sees)
    console.log('\n3. Checking pending verifications (admin dashboard query)...')
    const { data: pendingUsers, error: pendingError } = await supabase
      .from('profiles')
      .select('*, university:universities(*)')
      .eq('verified', false)
      .in('role', ['alumni', 'student'])
      .order('created_at', { ascending: false })
    
    if (pendingError) {
      console.error('❌ Error fetching pending users:', pendingError)
      return
    }
    
    console.log(`📊 Pending verifications: ${pendingUsers?.length || 0}`)
    if (pendingUsers && pendingUsers.length > 0) {
      console.log('\n📋 Pending users:')
      pendingUsers.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email} (${user.role}) - University: ${user.university?.name || 'None'} - Created: ${new Date(user.created_at).toLocaleString()}`)
      })
    }
    
    // Test 4: Check universities
    console.log('\n4. Checking universities...')
    const { data: universities, error: universitiesError } = await supabase
      .from('universities')
      .select('*')
      .order('name')
    
    if (universitiesError) {
      console.error('❌ Error fetching universities:', universitiesError)
      return
    }
    
    console.log(`📊 Total universities: ${universities?.length || 0}`)
    if (universities && universities.length > 0) {
      console.log('\n📋 Universities:')
      universities.forEach((uni, index) => {
        console.log(`${index + 1}. ${uni.name} (${uni.domain}) - Approved: ${uni.approved}`)
      })
    }
    
    // Test 5: Check auth users vs profiles sync
    console.log('\n5. Checking auth users vs profiles sync...')
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Error fetching auth users:', authError)
    } else {
      console.log(`📊 Auth users: ${authUsers.users?.length || 0}`)
      console.log(`📊 Profile users: ${allUsers?.length || 0}`)
      
      if (authUsers.users && allUsers) {
        const authEmails = authUsers.users.map(u => u.email)
        const profileEmails = allUsers.map(u => u.email)
        
        const missingProfiles = authEmails.filter(email => email && !profileEmails.includes(email))
        const orphanedProfiles = profileEmails.filter(email => !authEmails.includes(email))
        
        if (missingProfiles.length > 0) {
          console.log('⚠️  Auth users without profiles:', missingProfiles)
        }
        if (orphanedProfiles.length > 0) {
          console.log('⚠️  Profiles without auth users:', orphanedProfiles)
        }
        if (missingProfiles.length === 0 && orphanedProfiles.length === 0) {
          console.log('✅ Auth users and profiles are in sync')
        }
      }
    }
    
    console.log('\n✅ Database test completed!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testDatabase()