-- Find existing accounts that can be promoted to admin
SELECT 
    email,
    full_name,
    role,
    verified,
    created_at
FROM profiles 
WHERE role NOT IN ('super_admin', 'university_admin')
ORDER BY created_at DESC;

-- If you see any accounts above, you can promote them using the admin promotion tool