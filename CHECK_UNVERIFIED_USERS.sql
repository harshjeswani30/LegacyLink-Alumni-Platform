-- Check if unverified users actually exist
-- Run this in Supabase SQL Editor

-- 1. Count all unverified users
SELECT 
    COUNT(*) as unverified_count,
    role
FROM profiles 
WHERE verified = false 
  AND role IN ('alumni', 'student')
GROUP BY role;

-- 2. List all unverified users with details
SELECT 
    id,
    email,
    full_name,
    role,
    verified,
    university_id,
    created_at
FROM profiles 
WHERE verified = false 
  AND role IN ('alumni', 'student')
ORDER BY created_at DESC;

-- 3. Check if our auto-verification fix worked too well
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN verified = true THEN 1 END) as verified_users,
    COUNT(CASE WHEN verified = false THEN 1 END) as unverified_users
FROM profiles 
WHERE role IN ('alumni', 'student');

-- 4. Check super admin account
SELECT 
    email,
    role,
    university_id,
    created_at
FROM profiles 
WHERE email ILIKE '%22bcs15891%';