-- COMPREHENSIVE VERIFICATION WORKFLOW TEST
-- This script tests the entire verification system end-to-end

-- ==================================================
-- STEP 1: Check current system state
-- ==================================================

-- Check pending verifications that should appear in admin queue
SELECT 
    'CURRENT_PENDING_QUEUE' as test_section,
    COUNT(*) as pending_count,
    string_agg(p.full_name || ' (' || p.role || ')', ', ') as pending_users
FROM profiles p
WHERE p.verified = false 
  AND p.role IN ('alumni', 'student');

-- Check available admins who can perform verifications
SELECT 
    'AVAILABLE_ADMINS' as test_section,
    p.full_name,
    p.email,
    p.role,
    u.name as university,
    CASE 
        WHEN p.role = 'university_admin' THEN 'Can verify users from ' || u.name
        WHEN p.role IN ('super_admin', 'admin') THEN 'Can verify users from any university'
        ELSE 'Cannot verify users'
    END as verification_scope
FROM profiles p
LEFT JOIN universities u ON u.id = p.university_id
WHERE p.role IN ('university_admin', 'super_admin', 'admin')
ORDER BY p.role, p.full_name;

-- ==================================================
-- STEP 2: Create test unverified user (SAFE - uses unique email)
-- ==================================================

DO $$
DECLARE
    test_user_id UUID;
    chandigarh_uni_id UUID;
    test_email TEXT;
BEGIN
    -- Generate unique test email based on timestamp
    test_email := 'test.verification.' || extract(epoch from now())::bigint || '@example.com';
    
    -- Get Chandigarh University ID
    SELECT id INTO chandigarh_uni_id 
    FROM universities 
    WHERE name ILIKE '%chandigarh%' 
    LIMIT 1;
    
    IF chandigarh_uni_id IS NULL THEN
        RAISE EXCEPTION 'Chandigarh University not found - cannot create test user';
    END IF;
    
    -- Generate test user ID
    test_user_id := gen_random_uuid();
    
    -- Create test auth user (simulating Supabase Auth signup)
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
        test_email,
        crypt('password123', gen_salt('bf')),
        NOW(), -- Email confirmed
        NOW(), 
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object(
            'full_name', 'Test Verification Student',
            'role', 'student',
            'university_id', chandigarh_uni_id::text
        ),
        'authenticated',
        'authenticated'
    );
    
    -- The handle_new_user trigger should automatically create the profile
    -- Let's verify it was created
    PERFORM pg_sleep(0.1); -- Small delay for trigger execution
    
    -- Check if profile was created
    IF EXISTS (SELECT 1 FROM profiles WHERE id = test_user_id) THEN
        RAISE NOTICE 'SUCCESS: Test user created with email % and ID %', test_email, test_user_id;
        RAISE NOTICE 'This user should now appear in admin verification queue at /admin';
    ELSE
        RAISE EXCEPTION 'FAILED: Profile was not created by trigger for user %', test_user_id;
    END IF;
    
END $$;

-- ==================================================
-- STEP 3: Verify the test user appears in pending queue
-- ==================================================

SELECT 
    'TEST_USER_IN_QUEUE' as test_section,
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.verified,
    u.name as university,
    p.created_at,
    'This user should appear in admin verification queue' as note
FROM profiles p
LEFT JOIN universities u ON u.id = p.university_id
WHERE p.email LIKE 'test.verification.%@example.com'
  AND p.verified = false
ORDER BY p.created_at DESC
LIMIT 1;

-- ==================================================
-- STEP 4: Test API endpoint accessibility (without actually verifying)
-- ==================================================

-- This creates a test function that simulates the API route's permission checks
CREATE OR REPLACE FUNCTION test_verification_permissions(
    admin_user_id UUID,
    target_user_id UUID
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    admin_profile RECORD;
    target_profile RECORD;
    result TEXT;
BEGIN
    -- Get admin profile
    SELECT id, role, university_id INTO admin_profile
    FROM profiles 
    WHERE id = admin_user_id;
    
    IF NOT FOUND THEN
        RETURN 'FAIL: Admin user not found';
    END IF;
    
    IF admin_profile.role NOT IN ('university_admin', 'super_admin', 'admin') THEN
        RETURN 'FAIL: User is not an admin (role: ' || admin_profile.role || ')';
    END IF;
    
    -- Get target profile
    SELECT id, university_id, verified INTO target_profile
    FROM profiles 
    WHERE id = target_user_id;
    
    IF NOT FOUND THEN
        RETURN 'FAIL: Target user not found';
    END IF;
    
    -- Check university permission for university_admin
    IF admin_profile.role = 'university_admin' AND 
       target_profile.university_id != admin_profile.university_id THEN
        RETURN 'FAIL: University admin cannot verify users from other universities';
    END IF;
    
    RETURN 'SUCCESS: Admin can verify this user';
END;
$$;

-- ==================================================
-- STEP 5: Final system health check
-- ==================================================

SELECT 
    'VERIFICATION_SYSTEM_HEALTH' as test_section,
    jsonb_build_object(
        'pending_users', (SELECT COUNT(*) FROM profiles WHERE verified = false AND role IN ('alumni', 'student')),
        'total_admins', (SELECT COUNT(*) FROM profiles WHERE role IN ('university_admin', 'super_admin', 'admin')),
        'verified_users', (SELECT COUNT(*) FROM profiles WHERE verified = true AND role IN ('alumni', 'student')),
        'universities', (SELECT COUNT(*) FROM universities),
        'test_users_created', (SELECT COUNT(*) FROM profiles WHERE email LIKE 'test.verification.%@example.com')
    ) as system_status;

-- Clean up test function
DROP FUNCTION IF EXISTS test_verification_permissions(UUID, UUID);

RAISE NOTICE '';
RAISE NOTICE '=== VERIFICATION SYSTEM TEST COMPLETE ===';
RAISE NOTICE 'Check the results above to verify the system is working correctly.';
RAISE NOTICE 'If you see a test user created, it should now appear at localhost:3000/admin';
RAISE NOTICE 'You can test the verification buttons by clicking them in the admin interface.';
RAISE NOTICE '';