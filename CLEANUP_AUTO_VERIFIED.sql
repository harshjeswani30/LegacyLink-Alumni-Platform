-- Optional: Unverify the users who were auto-verified today
-- Run this in Supabase SQL Editor if you want them to go through admin approval

-- First, check which users will be affected:
SELECT 
    id,
    email,
    full_name,
    verified,
    created_at
FROM profiles 
WHERE verified = true 
  AND role IN ('alumni', 'student')
  AND created_at > '2025-09-21 06:00:00+00'  -- Today's auto-verified users
  AND created_at < '2025-09-21 08:10:00+00'  -- Before the fix
ORDER BY created_at DESC;

-- If you want to unverify them (uncomment the lines below):
-- UPDATE profiles 
-- SET verified = false 
-- WHERE verified = true 
--   AND role IN ('alumni', 'student')
--   AND created_at > '2025-09-21 06:00:00+00'
--   AND created_at < '2025-09-21 08:10:00+00';