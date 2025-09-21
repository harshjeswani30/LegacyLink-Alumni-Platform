-- DIRECT DATABASE VERIFICATION TEST
-- Run this to see if the verification update is actually working

-- Find the user that was just tested (ID: 5a3110c5-7afe-4cfa-b5f0-46851ebe0805)
SELECT 
    'BEFORE_MANUAL_UPDATE' as test_step,
    id,
    full_name,
    email,
    verified,
    updated_at,
    'Current status before manual verification' as note
FROM profiles 
WHERE id = '5a3110c5-7afe-4cfa-b5f0-46851ebe0805';

-- Manually perform the same update that the API should do
UPDATE profiles 
SET verified = true, updated_at = NOW()
WHERE id = '5a3110c5-7afe-4cfa-b5f0-46851ebe0805';

-- Check if the update worked
SELECT 
    'AFTER_MANUAL_UPDATE' as test_step,
    id,
    full_name,
    email,
    verified,
    updated_at,
    'Status after manual update - should be verified=true' as note
FROM profiles 
WHERE id = '5a3110c5-7afe-4cfa-b5f0-46851ebe0805';

-- Check all currently unverified users
SELECT 
    'ALL_UNVERIFIED_USERS' as test_step,
    id,
    full_name,
    email,
    verified,
    'These users should appear in admin verification queue' as note
FROM profiles 
WHERE verified = false 
  AND role IN ('alumni', 'student')
ORDER BY created_at DESC;

-- Reset the test user back to unverified for further testing
UPDATE profiles 
SET verified = false, updated_at = NOW()
WHERE id = '5a3110c5-7afe-4cfa-b5f0-46851ebe0805';

SELECT 
    'TEST_USER_RESET' as test_step,
    'User reset to unverified for further API testing' as note;