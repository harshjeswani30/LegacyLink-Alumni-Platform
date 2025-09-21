-- Create admin account directly in database (if email doesn't exist)
-- Replace with your desired admin email and details

-- First check if user already exists
SELECT email, role FROM profiles WHERE email = '22BCS15891@cuchd.in';

-- If no results, create the account manually:
-- Note: This creates a profile without auth.users entry (incomplete)
-- Better to use normal signup process

-- Get CUCHD university ID first
SELECT id, name FROM universities WHERE name ILIKE '%cuchd%' OR domain LIKE '%cuchd%';

-- Insert profile (replace university_id with actual CUCHD ID from above query)
INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    university_id,
    verified,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(), -- Temporary ID, better to use actual auth.users ID
    '22BCS15891@cuchd.in',
    'Admin User',
    'super_admin',
    (SELECT id FROM universities WHERE domain LIKE '%cuchd%' LIMIT 1),
    true,
    NOW(),
    NOW()
);

-- WARNING: This creates an incomplete user profile without auth.users entry
-- The user won't be able to login properly
-- RECOMMENDED: Use normal signup process instead