-- Create a test unverified user for button testing
-- Run this in Supabase SQL Editor

DO $$
DECLARE
    test_user_id UUID;
    chandigarh_uni_id UUID;
    test_email TEXT;
BEGIN
    -- Generate unique test email based on timestamp
    test_email := 'test.button.' || extract(epoch from now())::bigint || '@example.com';
    
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
        test_email,
        crypt('password123', gen_salt('bf')),
        NOW(),
        NOW(), 
        NOW(),
        '{"provider": "email", "providers": ["email"]}',
        jsonb_build_object(
            'full_name', 'Test Button User',
            'role', 'student',
            'university_id', chandigarh_uni_id::text
        ),
        'authenticated',
        'authenticated'
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Create unverified profile manually (bypassing trigger for testing)
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
        test_email,
        'Test Button User',
        'student',
        chandigarh_uni_id,
        false, -- UNVERIFIED - should appear in admin queue
        NOW(),
        NOW()
    ) ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'Created test user: % with ID: %', test_email, test_user_id;
    RAISE NOTICE 'This user should appear in admin verification queue with buttons';
    RAISE NOTICE 'User ID for testing: %', test_user_id;
    
END $$;

-- Show the created test user
SELECT 
    'CREATED_TEST_USER' as status,
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.verified,
    u.name as university,
    'Should have verification buttons in admin panel' as note
FROM profiles p
JOIN universities u ON u.id = p.university_id
WHERE p.email LIKE 'test.button.%@example.com'
ORDER BY p.created_at DESC
LIMIT 1;