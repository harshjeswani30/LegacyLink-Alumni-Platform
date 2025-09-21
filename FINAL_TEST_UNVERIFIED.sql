-- Quick check for unverified users now that you're super admin
SELECT 
    COUNT(*) as unverified_count
FROM profiles 
WHERE verified = false 
  AND role IN ('alumni', 'student');

-- If count is 0, unverify some existing users instead of creating new ones
-- This is safer than creating users without proper auth.users entries

-- Option 1: Unverify some recent users temporarily for testing
UPDATE profiles 
SET verified = false,
    updated_at = NOW()
WHERE verified = true 
  AND role IN ('alumni', 'student')
  AND created_at > NOW() - INTERVAL '24 hours'
LIMIT 3;

-- Option 2: Check which users we just unverified
SELECT 
    email,
    full_name,
    role,
    verified,
    created_at
FROM profiles 
WHERE verified = false 
  AND role IN ('alumni', 'student')
ORDER BY updated_at DESC;