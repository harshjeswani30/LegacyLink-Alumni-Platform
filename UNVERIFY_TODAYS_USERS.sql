-- Step 1: First check which users will be unverified
SELECT 
    id,
    email,
    full_name,
    verified,
    role,
    created_at
FROM profiles 
WHERE verified = true 
  AND role IN ('alumni', 'student')
  AND created_at >= '2025-09-21 00:00:00+00'  -- Today's users
  AND created_at < '2025-09-21 08:10:00+00'   -- Before the fix was applied
ORDER BY created_at DESC;

-- Step 2: If the above looks correct, run this to unverify them:
UPDATE profiles 
SET verified = false,
    updated_at = NOW()
WHERE verified = true 
  AND role IN ('alumni', 'student')
  AND created_at >= '2025-09-21 00:00:00+00'
  AND created_at < '2025-09-21 08:10:00+00';

-- Step 3: Verify the update worked
SELECT 
    id,
    email,
    full_name,
    verified,
    updated_at
FROM profiles 
WHERE created_at >= '2025-09-21 00:00:00+00'
ORDER BY created_at DESC;