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

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testAdminQuery() {
  console.log('Testing admin page query...\n')
  
  // Simulate the exact query from admin page
  let pendingQuery = supabase
    .from("profiles")
    .select("*, university:universities(*), alumni_profile:alumni_profiles(*)")
    .eq("verified", false)
    .in("role", ["alumni", "student"])

  const { data: pendingProfiles, error } = await pendingQuery.order("created_at", { ascending: false })
  
  if (error) {
    console.error('Error:', error)
    return
  }
  
  console.log(`Admin page query returns ${pendingProfiles.length} profiles:`)
  pendingProfiles.forEach((profile, index) => {
    console.log(`${index + 1}. ${profile.full_name} (${profile.email}) - Role: ${profile.role}`)
  })
  
  // Now test without role filter
  console.log('\n--- Testing without role filter ---')
  const { data: allUnverified, error: allError } = await supabase
    .from("profiles")
    .select("*")
    .eq("verified", false)
    .order("created_at", { ascending: false })
  
  if (allError) {
    console.error('Error:', allError)
    return
  }
  
  console.log(`All unverified users (${allUnverified.length}):`)
  allUnverified.forEach((profile, index) => {
    console.log(`${index + 1}. ${profile.full_name} (${profile.email}) - Role: ${profile.role}`)
  })
}

testAdminQuery().catch(console.error)