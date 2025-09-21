-- Create a test unverified user to test the verification system
-- Run this in Supabase SQL Editor to create test data

DO $$
DECLARE
    test_user_id UUID;
    chandigarh_uni_id UUID;
BEGIN
    -- Get Chandigarh University ID
    SELECT id INTO chandigarh_uni_id 
    FROM universities 
    WHERE name ILIKE '%chandigarh%' 
    LIMIT 1;
    
    IF chandigarh_uni_id IS NULL THEN
        RAISE EXCEPTION 'Chandigarh University not found';
    END IF;
    
    -- Generate test user ID
    test_user_id := gen_random_uuid();
    
    -- Create test auth user
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
        'test.unverified@student.com',
        crypt('password123', gen_salt('bf')),
        NOW(),
        NOW(), 
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"full_name": "Test Unverified Student"}',
        'authenticated',
        'authenticated'
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Create test profile (UNVERIFIED - should appear in admin queue)
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
        'test.unverified@student.com',
        'Test Unverified Student',
        'student',
        chandigarh_uni_id,
        false, -- UNVERIFIED - this should make it appear in admin verification queue
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Created test unverified student with ID: %', test_user_id;
    RAISE NOTICE 'This user should now appear in the admin verification queue at /admin';
    
END $$;

-- Verify the test user was created
SELECT 
    'TEST_USER_CREATED' as status,
    p.full_name,
    p.email,
    p.role,
    p.verified,
    u.name as university,
    'Should appear in admin queue' as note
FROM profiles p
JOIN universities u ON u.id = p.university_id
WHERE p.email = 'test.unverified@student.com';