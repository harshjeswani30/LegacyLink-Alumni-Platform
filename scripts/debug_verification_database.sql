-- VERIFICATION DEBUGGING SCRIPT
-- Run this in Supabase SQL Editor to check verification status

-- 1. Check current verification status of all users
SELECT 
    'ALL_USERS_STATUS' as check_type,
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.verified,
    p.updated_at,
    u.name as university
FROM profiles p
LEFT JOIN universities u ON u.id = p.university_id
WHERE p.role IN ('alumni', 'student')
ORDER BY p.updated_at DESC;

-- 2. Check specifically for Prateek (or any recently verified user)
SELECT 
    'PRATEEK_VERIFICATION_STATUS' as check_type,
    p.id,
    p.full_name,
    p.email,
    p.verified,
    p.updated_at,
    'Should be TRUE if verification worked' as note
FROM profiles p
WHERE p.full_name ILIKE '%prateek%'
   OR p.email ILIKE '%prateek%';

-- 3. Check verification badges (should exist if verification completed)
SELECT 
    'VERIFICATION_BADGES' as check_type,
    b.id,
    b.user_id,
    p.full_name,
    b.title,
    b.description,
    b.created_at
FROM badges b
JOIN profiles p ON p.id = b.user_id
WHERE b.title LIKE '%Verified%'
ORDER BY b.created_at DESC;

-- 4. Check pending users (should NOT include verified users)
SELECT 
    'CURRENT_PENDING_QUEUE' as check_type,
    p.id,
    p.full_name,
    p.email,
    p.verified,
    'These should appear in admin verification queue' as note
FROM profiles p
WHERE p.verified = false 
  AND p.role IN ('alumni', 'student')
ORDER BY p.created_at DESC;

-- 5. Check recent database activity
SELECT 
    'RECENT_UPDATES' as check_type,
    p.id,
    p.full_name,
    p.verified,
    p.updated_at,
    CASE 
        WHEN p.updated_at > NOW() - INTERVAL '1 hour' THEN 'RECENT UPDATE'
        ELSE 'OLD UPDATE'
    END as recency
FROM profiles p
WHERE p.role IN ('alumni', 'student')
  AND p.updated_at > NOW() - INTERVAL '24 hours'
ORDER BY p.updated_at DESC;