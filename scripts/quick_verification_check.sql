-- Simple verification system check
-- Run this in your Supabase SQL Editor

-- 1. Check pending verifications (should appear in admin queue)
SELECT 
    'PENDING_USERS' as check_name,
    p.full_name,
    p.email,
    p.role,
    p.verified,
    u.name as university,
    p.created_at
FROM profiles p
LEFT JOIN universities u ON u.id = p.university_id
WHERE p.verified = false 
  AND p.role IN ('alumni', 'student')
ORDER BY p.created_at DESC;

-- 2. Check admin users (who can verify)
SELECT 
    'ADMIN_USERS' as check_name,
    p.full_name,
    p.email,
    p.role,
    u.name as university,
    p.verified
FROM profiles p
LEFT JOIN universities u ON u.id = p.university_id
WHERE p.role IN ('university_admin', 'super_admin', 'admin')
ORDER BY p.role;

-- 3. Quick count summary
SELECT 
    'SUMMARY' as check_name,
    COUNT(CASE WHEN verified = false AND role IN ('alumni', 'student') THEN 1 END) as pending_count,
    COUNT(CASE WHEN role IN ('university_admin', 'super_admin', 'admin') THEN 1 END) as admin_count,
    COUNT(CASE WHEN verified = true AND role IN ('alumni', 'student') THEN 1 END) as verified_count
FROM profiles;