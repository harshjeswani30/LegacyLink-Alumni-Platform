-- Create test unverified users to verify the admin queue works
-- Run this if there are no unverified users to test with

-- Get a university ID first (preferably CUCHD)
SELECT id, name, domain FROM universities WHERE name ILIKE '%cuchd%' OR domain LIKE '%cuchd%' LIMIT 1;

-- Create test unverified users (replace university_id with actual ID from above)
INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    university_id,
    verified,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    'test.alumni1@cuchd.in',
    'Test Alumni One',
    'alumni',
    (SELECT id FROM universities WHERE domain LIKE '%cuchd%' LIMIT 1),
    false,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'test.student1@cuchd.in', 
    'Test Student One',
    'student',
    (SELECT id FROM universities WHERE domain LIKE '%cuchd%' LIMIT 1),
    false,
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'test.alumni2@example.com',
    'Test Alumni Two', 
    'alumni',
    (SELECT id FROM universities WHERE domain LIKE '%cuchd%' LIMIT 1),
    false,
    NOW(),
    NOW()
);

-- Verify the test users were created
SELECT 
    email,
    full_name,
    role,
    verified,
    created_at
FROM profiles 
WHERE email LIKE 'test.%'
ORDER BY created_at DESC;