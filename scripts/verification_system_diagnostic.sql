-- VERIFICATION SYSTEM COMPREHENSIVE DIAGNOSTIC
-- This script checks all aspects of the verification system
-- Usage: Run this in Supabase SQL Editor or psql

-- ==================================================
-- SECTION 1: PENDING VERIFICATION QUEUE ANALYSIS
-- ==================================================

-- Check all pending profiles that should appear in admin verification queue
SELECT 
    'PENDING_VERIFICATION_QUEUE' as check_type,
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.verified,
    u.name as university_name,
    p.created_at,
    CASE 
        WHEN p.verified = false AND p.role IN ('alumni', 'student') THEN 'SHOULD_APPEAR_IN_QUEUE'
        ELSE 'NOT_IN_QUEUE'
    END as queue_status
FROM profiles p
LEFT JOIN universities u ON u.id = p.university_id
WHERE p.role IN ('alumni', 'student', 'university_admin', 'super_admin')
ORDER BY p.created_at DESC;

-- ==================================================
-- SECTION 2: ADMIN PERMISSIONS CHECK
-- ==================================================

-- Check all admins and their permissions
SELECT 
    'ADMIN_PERMISSIONS_CHECK' as check_type,
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.verified,
    u.name as university_name,
    CASE 
        WHEN p.role IN ('university_admin', 'super_admin', 'admin') THEN 'CAN_VERIFY_USERS'
        ELSE 'CANNOT_VERIFY_USERS'
    END as verification_permission
FROM profiles p
LEFT JOIN universities u ON u.id = p.university_id
WHERE p.role IN ('university_admin', 'super_admin', 'admin')
ORDER BY p.role, p.created_at DESC;

-- ==================================================
-- SECTION 3: VERIFICATION WORKFLOW TEST DATA
-- ==================================================

-- Check recent verification activities (if any badges were created)
SELECT 
    'RECENT_VERIFICATION_BADGES' as check_type,
    b.id,
    b.user_id,
    p.full_name,
    b.title,
    b.description,
    b.points,
    b.created_at
FROM badges b
JOIN profiles p ON p.id = b.user_id
WHERE b.title LIKE '%Verified%' OR b.description LIKE '%verified%'
ORDER BY b.created_at DESC;

-- ==================================================
-- SECTION 4: UNIVERSITY ASSOCIATION CHECK
-- ==================================================

-- Check if users are properly associated with universities (needed for university_admin filtering)
SELECT 
    'UNIVERSITY_ASSOCIATION_CHECK' as check_type,
    p.role,
    COUNT(*) as count,
    COUNT(CASE WHEN p.university_id IS NOT NULL THEN 1 END) as with_university,
    COUNT(CASE WHEN p.university_id IS NULL THEN 1 END) as without_university
FROM profiles p
WHERE p.role IN ('alumni', 'student', 'university_admin')
GROUP BY p.role
ORDER BY p.role;

-- ==================================================
-- SECTION 5: RLS POLICY VERIFICATION TEST
-- ==================================================

-- Test if RLS policies allow proper access to profiles table
-- This should return data for all users
SELECT 
    'RLS_POLICY_TEST' as check_type,
    'profiles_table_access' as test_name,
    COUNT(*) as total_profiles_accessible,
    COUNT(CASE WHEN role = 'alumni' THEN 1 END) as alumni_count,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as student_count,
    COUNT(CASE WHEN role = 'university_admin' THEN 1 END) as admin_count
FROM profiles;

-- ==================================================
-- SECTION 6: TEST VERIFICATION SCENARIO SETUP
-- ==================================================

-- Create a test scenario - insert a test user that should appear in verification queue
-- Only run this if you want to create test data
/*
DO $$
DECLARE
    test_user_id UUID;
    test_university_id UUID;
BEGIN
    -- Get Chandigarh University ID
    SELECT id INTO test_university_id FROM universities WHERE name ILIKE '%chandigarh%' LIMIT 1;
    
    -- Generate a test user UUID
    test_user_id := gen_random_uuid();
    
    -- Insert test auth user (this would normally be done by Supabase Auth)
    INSERT INTO auth.users (
        id, 
        email, 
        encrypted_password, 
        email_confirmed_at, 
        created_at, 
        updated_at,
        raw_app_meta_data,
        raw_user_meta_data,
        aud,
        role
    ) VALUES (
        test_user_id,
        'test.verification@example.com',
        crypt('testpassword123', gen_salt('bf')),
        NOW(),
        NOW(),
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Test Verification User"}',
        'authenticated',
        'authenticated'
    )
    ON CONFLICT (id) DO NOTHING;
    
    -- Insert test profile that should appear in verification queue
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
        test_user_id,
        'test.verification@example.com',
        'Test Verification User',
        'student',
        test_university_id,
        false,  -- This should make it appear in verification queue
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Test verification user created with ID: %', test_user_id;
END $$;
*/

-- ==================================================
-- SECTION 7: VERIFICATION SYSTEM HEALTH CHECK
-- ==================================================

-- Final health check summary
SELECT 
    'VERIFICATION_SYSTEM_HEALTH' as check_type,
    'summary' as check_name,
    (SELECT COUNT(*) FROM profiles WHERE verified = false AND role IN ('alumni', 'student')) as pending_verifications,
    (SELECT COUNT(*) FROM profiles WHERE role IN ('university_admin', 'super_admin', 'admin')) as total_admins,
    (SELECT COUNT(*) FROM profiles WHERE verified = true AND role IN ('alumni', 'student')) as verified_users,
    (SELECT COUNT(*) FROM universities) as total_universities;

-- Show example of what admin should see in verification queue
SELECT 
    'ADMIN_VERIFICATION_QUEUE_PREVIEW' as check_type,
    p.id,
    p.full_name,
    p.email,
    p.role,
    u.name as university,
    p.created_at,
    'This user should appear in admin verification queue' as note
FROM profiles p
LEFT JOIN universities u ON u.id = p.university_id
WHERE p.verified = false 
  AND p.role IN ('alumni', 'student')
ORDER BY p.created_at DESC
LIMIT 10;