import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

// Manually read .env.local file
let supabaseUrl, supabaseServiceKey
try {
  const envContent = readFileSync('.env.local', 'utf8')
  const lines = envContent.split('\n')
  
  for (const line of lines) {
    if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1]
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseServiceKey = line.split('=')[1]
    }
  }
} catch (error) {
  console.error('Error reading .env.local:', error.message)
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function diagnoseSuperAdminProfile() {
  console.log('=== SUPER ADMIN DIAGNOSIS ===\n')
  
  // Check your specific profile
  const yourEmail = '22bcs15891@cuchd.in'
  
  const { data: yourProfile, error: profileError } = await adminSupabase
    .from('profiles')
    .select('*')
    .eq('email', yourEmail)
    .single()
  
  if (profileError) {
    console.error('Error fetching your profile:', profileError)
    return
  }
  
  console.log('Your profile:')
  console.log(`- Email: ${yourProfile.email}`)
  console.log(`- Full Name: ${yourProfile.full_name}`)
  console.log(`- Role: ${yourProfile.role}`)
  console.log(`- University ID: ${yourProfile.university_id}`)
  console.log(`- Verified: ${yourProfile.verified}`)
  console.log()
  
  // Test the exact admin page query for super admin
  console.log('Testing admin page query for super admin...')
  
  let pendingQuery = adminSupabase
    .from("profiles")
    .select("*, university:universities(*), alumni_profile:alumni_profiles(*)")
    .eq("verified", false)
    .in("role", ["alumni", "student"])

  // Check if university filtering is applied
  console.log(`Profile role: ${yourProfile.role}`)
  console.log(`Should filter by university: ${yourProfile.role === "university_admin" && yourProfile.university_id}`)
  
  if (yourProfile.role === "university_admin" && yourProfile.university_id) {
    console.log(`Filtering by university_id: ${yourProfile.university_id}`)
    pendingQuery = pendingQuery.eq("university_id", yourProfile.university_id)
  } else {
    console.log('No university filtering applied (super admin)')
  }

  const { data: pendingProfiles, error } = await pendingQuery.order("created_at", { ascending: false })
  
  if (error) {
    console.error('Error in admin query:', error)
    return
  }
  
  console.log(`\nFound ${pendingProfiles.length} pending profiles:`)
  pendingProfiles.forEach((profile, index) => {
    console.log(`${index + 1}. ${profile.full_name} (${profile.email}) - Role: ${profile.role} - University: ${profile.university?.name || 'None'}`)
  })
  
  // Check if there are university-specific issues
  console.log('\n=== UNIVERSITY BREAKDOWN ===')
  const universityGroups = pendingProfiles.reduce((acc, profile) => {
    const universityName = profile.university?.name || 'No University'
    if (!acc[universityName]) acc[universityName] = 0
    acc[universityName]++
    return acc
  }, {})
  
  Object.entries(universityGroups).forEach(([university, count]) => {
    console.log(`${university}: ${count} users`)
  })
}

diagnoseSuperAdminProfile().catch(console.error)