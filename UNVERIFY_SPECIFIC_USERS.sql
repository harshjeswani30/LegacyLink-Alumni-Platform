-- Ensure the specific users we know about are unverified for testing
-- These were the users from your earlier data

-- First check if these users exist and their current status
SELECT 
    email,
    full_name,
    role,
    verified,
    created_at
FROM profiles 
WHERE email IN (
    'rosej66843@cnguopin.com',
    'harsh@jxpomup.com', 
    'potomal263@cerisun.com',
    'vnr5czfjcc@zudpck.com',
    '24bcs10498@cuchd.in',
    '24bcs11609@cuchd.in'
)
ORDER BY created_at DESC;

-- Unverify these specific users for testing
UPDATE profiles 
SET verified = false,
    updated_at = NOW()
WHERE email IN (
    'rosej66843@cnguopin.com',
    'harsh@jxpomup.com', 
    'potomal263@cerisun.com',
    'vnr5czfjcc@zudpck.com',
    '24bcs10498@cuchd.in',
    '24bcs11609@cuchd.in'
)
AND role IN ('alumni', 'student');

-- Verify they are now unverified
SELECT 
    email,
    full_name,
    role,
    verified,
    updated_at
FROM profiles 
WHERE verified = false 
  AND role IN ('alumni', 'student')
ORDER BY updated_at DESC;