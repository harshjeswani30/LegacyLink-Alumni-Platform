-- Check for existing triggers and functions that might auto-verify
-- Run this FIRST to see what's currently causing auto-verification

-- 1. Check current handle_new_user function
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user' 
  AND routine_schema = 'public';

-- 2. Check for triggers on auth.users
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
  AND event_object_schema = 'auth';

-- 3. Check for triggers on profiles
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'profiles' 
  AND event_object_schema = 'public';

-- 4. Check recently created profiles to see verification pattern
SELECT 
    id,
    email,
    full_name,
    verified,
    created_at,
    updated_at
FROM profiles 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;