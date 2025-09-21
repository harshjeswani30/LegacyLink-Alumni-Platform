-- Diagnostic script to find why unverified profiles aren't showing in admin queue

-- 1. Check all unverified profiles (regardless of university)
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.verified,
    p.university_id,
    u.name as university_name,
    p.created_at
FROM profiles p
LEFT JOIN universities u ON p.university_id = u.id
WHERE p.verified = false 
  AND p.role IN ('alumni', 'student')
ORDER BY p.created_at DESC;

-- 2. Check the specific users mentioned
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.verified,
    p.university_id,
    u.name as university_name,
    p.created_at
FROM profiles p
LEFT JOIN universities u ON p.university_id = u.id
WHERE p.email IN ('rosej66843@cnguopin.com', 'harsh@jxpomup.com', 'potomal263@cerisun.com')
ORDER BY p.created_at DESC;

-- 3. Check admin user's university and role
SELECT 
    id,
    email,
    full_name,
    role,
    university_id,
    verified
FROM profiles 
WHERE role IN ('university_admin', 'super_admin', 'admin')
ORDER BY created_at DESC;

-- 4. Check if there are RLS policy issues (this might fail if policies are too restrictive)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles';