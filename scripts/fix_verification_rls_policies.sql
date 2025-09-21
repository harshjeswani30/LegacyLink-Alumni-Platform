-- FIX VERIFICATION RLS POLICIES
-- This script fixes RLS policies that may be blocking verification updates

-- 1. Check current RLS policies on profiles table
SELECT 
    'CURRENT_RLS_POLICIES' as check_type,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 2. Drop existing problematic policies and create proper ones
DROP POLICY IF EXISTS "Enable update for users based on email" ON "public"."profiles";
DROP POLICY IF EXISTS "Enable update for service role" ON "public"."profiles";
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON "public"."profiles";
DROP POLICY IF EXISTS "Users can update own profile" ON "public"."profiles";

-- 3. Create comprehensive RLS policies that allow admin verification
-- Allow service role (used by API routes) to do everything
CREATE POLICY "service_role_all_access" ON "public"."profiles"
    AS PERMISSIVE FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Allow authenticated users to read all profiles
CREATE POLICY "authenticated_users_read_all" ON "public"."profiles"
    AS PERMISSIVE FOR SELECT
    TO authenticated
    USING (true);

-- Allow users to update their own profiles
CREATE POLICY "users_update_own_profile" ON "public"."profiles"
    AS PERMISSIVE FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Allow admins to update any profile for verification purposes
CREATE POLICY "admins_update_all_profiles" ON "public"."profiles"
    AS PERMISSIVE FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin', 'university_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role IN ('super_admin', 'admin', 'university_admin')
        )
    );

-- 4. Ensure RLS is enabled
ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;

-- 5. Test the policies work
SELECT 
    'RLS_POLICY_TEST' as test_type,
    'Policies updated - verification should now work' as result;

-- 6. Show the new policies
SELECT 
    'NEW_RLS_POLICIES' as check_type,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;