-- TEST DATABASE PERMISSIONS FOR VERIFICATION
-- Run this to check if the verification update is actually working

-- 1. Test manual verification update (as if the API did it)
DO $$
DECLARE
    test_user_id UUID;
    update_result INTEGER;
BEGIN
    -- Find a user to test with (preferably one that's unverified)
    SELECT id INTO test_user_id 
    FROM profiles 
    WHERE verified = false 
      AND role IN ('alumni', 'student')
    LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE 'No unverified users found to test with';
        RETURN;
    END IF;
    
    RAISE NOTICE 'Testing verification update for user: %', test_user_id;
    
    -- Try the same update that the API does
    UPDATE profiles 
    SET verified = true, updated_at = NOW()
    WHERE id = test_user_id;
    
    GET DIAGNOSTICS update_result = ROW_COUNT;
    
    IF update_result > 0 THEN
        RAISE NOTICE 'SUCCESS: Updated % rows - verification update works', update_result;
        
        -- Check the result
        DECLARE
            is_verified BOOLEAN;
        BEGIN
            SELECT verified INTO is_verified FROM profiles WHERE id = test_user_id;
            RAISE NOTICE 'User verification status after update: %', is_verified;
        END;
        
        -- Revert the test change
        UPDATE profiles SET verified = false WHERE id = test_user_id;
        RAISE NOTICE 'Test change reverted';
    ELSE
        RAISE NOTICE 'FAILED: No rows updated - there may be an RLS or permission issue';
    END IF;
    
END $$;

-- 2. Check RLS policies on profiles table
SELECT 
    'RLS_POLICIES' as check_type,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 3. Check if service role can update profiles
SELECT 
    'SERVICE_ROLE_TEST' as check_type,
    current_user as current_db_user,
    session_user as session_user,
    current_setting('role') as current_role;

-- 4. Test the exact update query that the API uses
SELECT 
    'UPDATE_TEST_QUERY' as check_type,
    'This is the exact query the API runs:' as note,
    'UPDATE profiles SET verified = true, updated_at = NOW() WHERE id = USER_ID' as query;

-- 5. Show current unverified users for reference
SELECT 
    'UNVERIFIED_USERS_FOR_TESTING' as check_type,
    id,
    full_name,
    email,
    verified,
    role,
    'These users should be updatable by the API' as note
FROM profiles 
WHERE verified = false 
  AND role IN ('alumni', 'student')
ORDER BY created_at DESC
LIMIT 5;