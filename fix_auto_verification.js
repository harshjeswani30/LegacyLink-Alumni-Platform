// Fix Auto-Verification Issue
// Run this in the browser console while logged in as an admin

async function fixAutoVerification() {
  console.log('🔧 Starting auto-verification fix...')
  
  try {
    // First, let's check the current function
    console.log('📝 Step 1: Checking current handle_new_user function...')
    
    const response = await fetch('/api/admin/debug-env', { method: 'POST' })
    if (response.ok) {
      const data = await response.json()
      console.log('Current environment status:', data)
    }
    
    // Since we can't directly execute SQL from the browser, let's create a fix endpoint
    console.log('📝 Step 2: The auto-verification issue is in the handle_new_user function')
    console.log('The function currently sets verified based on email confirmation:')
    console.log('COALESCE(NEW.email_confirmed_at IS NOT NULL, false)')
    console.log('')
    console.log('This should be changed to always false:')
    console.log('false  -- NEVER auto-verify - require admin approval')
    console.log('')
    console.log('You need to run this SQL in your Supabase dashboard:')
    console.log(`
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        university_id,
        verified
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'alumni'),
        (NEW.raw_user_meta_data->>'university_id')::uuid,
        false  -- NEVER auto-verify - require admin approval
    );
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$;
    `)
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

fixAutoVerification()