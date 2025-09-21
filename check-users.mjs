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

async function checkUsers() {
  console.log('Checking all users in database...\n')
  
  // Get all users
  const { data: allUsers, error: allError } = await supabase
    .from('profiles')
    .select('id, full_name, email, verified, role')
    .order('created_at', { ascending: false })
  
  if (allError) {
    console.error('Error fetching all users:', allError)
    return
  }
  
  console.log(`Total users: ${allUsers.length}`)
  console.log('All users:')
  allUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.full_name} (${user.email})`)
    console.log(`   - Verified: ${user.verified}`)
    console.log(`   - Role: ${user.role}`)
    console.log('')
  })
  
  // Get unverified users specifically
  const { data: unverifiedUsers, error: unverifiedError } = await supabase
    .from('profiles')
    .select('id, full_name, email, verified')
    .eq('verified', false)
    .order('created_at', { ascending: false })
  
  if (unverifiedError) {
    console.error('Error fetching unverified users:', unverifiedError)
    return
  }
  
  console.log(`\nUnverified users: ${unverifiedUsers.length}`)
  unverifiedUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.full_name} (${user.email})`)
  })
}

checkUsers().catch(console.error)