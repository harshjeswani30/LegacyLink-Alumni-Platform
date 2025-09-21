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

async function debugAdminPage() {
  console.log('=== DEBUGGING ADMIN PAGE QUERY ===\n')
  
  // Simulate the exact query used in admin page
  console.log('1. Testing admin page pending profiles query...')
  
  let pendingQuery = adminSupabase
    .from("profiles")
    .select("*, university:universities(*), alumni_profile:alumni_profiles(*)")
    .eq("verified", false)
    .in("role", ["alumni", "student"])

  const { data: pendingProfiles, error } = await pendingQuery.order("created_at", { ascending: false })
  
  if (error) {
    console.error('Error in admin query:', error)
    return
  }
  
  console.log(`Found ${pendingProfiles.length} pending profiles:`)
  pendingProfiles.forEach((profile, index) => {
    console.log(`${index + 1}. ${profile.full_name} (${profile.email}) - Role: ${profile.role}`)
  })
  
  // Test the exact slice used in admin page
  console.log(`\n2. Testing .slice(0, 9) behavior:`)
  const slicedProfiles = pendingProfiles.slice(0, 9)
  console.log(`Sliced array length: ${slicedProfiles.length}`)
  slicedProfiles.forEach((profile, index) => {
    console.log(`${index + 1}. ${profile.full_name} (${profile.email})`)
  })
  
  // Test if there should be a "View All" button
  console.log(`\n3. Should show "View All" button: ${pendingProfiles.length > 9}`)
  
  // Test statistics queries
  console.log(`\n4. Testing statistics queries...`)
  
  const { count: pendingCount, error: countError } = await adminSupabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("verified", false)
    .in("role", ["alumni", "student"])
  
  if (countError) {
    console.error('Error in count query:', countError)
  } else {
    console.log(`Pending count from stats query: ${pendingCount}`)
  }
}

debugAdminPage().catch(console.error)