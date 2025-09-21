-- Check for auto-verified profiles that should require admin approval
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.verified,
    p.created_at,
    u.name as university_name
FROM profiles p
LEFT JOIN universities u ON p.university_id = u.id
WHERE p.verified = true 
  AND p.role IN ('alumni', 'student')
  AND p.created_at > NOW() - INTERVAL '7 days'  -- Recently created
ORDER BY p.created_at DESC;