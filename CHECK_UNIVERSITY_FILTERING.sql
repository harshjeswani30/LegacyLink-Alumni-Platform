-- Check university assignments and admin filtering issues

-- 1. Check the admin user's university
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.university_id,
    u.name as university_name
FROM profiles p
LEFT JOIN universities u ON p.university_id = u.id
WHERE p.role IN ('university_admin', 'super_admin', 'admin')
ORDER BY p.created_at DESC;

-- 2. Check unverified users and their university assignments
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

-- 3. Check if university_id mismatch is the issue
-- Compare admin university vs unverified users' universities
WITH admin_uni AS (
    SELECT university_id 
    FROM profiles 
    WHERE role IN ('university_admin', 'super_admin', 'admin') 
    LIMIT 1
)
SELECT 
    'Admin University' as type,
    u.id,
    u.name,
    u.domain
FROM universities u, admin_uni a
WHERE u.id = a.university_id

UNION ALL

SELECT 
    'Unverified User Universities' as type,
    u.id,
    u.name,
    u.domain
FROM universities u
WHERE u.id IN (
    SELECT DISTINCT university_id 
    FROM profiles 
    WHERE verified = false 
      AND role IN ('alumni', 'student')
      AND university_id IS NOT NULL
);

-- 4. If admin is super_admin, they should see ALL unverified users
-- If admin is university_admin, they should only see users from their university