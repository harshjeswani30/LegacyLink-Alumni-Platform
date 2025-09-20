-- ADMIN DASHBOARD FIX - Allow Proper Admin Access
-- The current RLS policies are too restrictive for admin dashboards

-- Step 1: Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop current restrictive policies
DROP POLICY IF EXISTS "profile_own_access" ON profiles;
DROP POLICY IF EXISTS "profile_create_new" ON profiles;
DROP POLICY IF EXISTS "profile_admin_access" ON profiles;

-- Step 3: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create proper policies for admin dashboard access

-- 1. Users can access their own profiles
CREATE POLICY "profiles_own_access" ON profiles 
FOR ALL USING (auth.uid() = id);

-- 2. Allow profile creation during signup
CREATE POLICY "profiles_insert_signup" ON profiles 
FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Service role can access everything (for admin operations)
CREATE POLICY "profiles_service_role_access" ON profiles 
FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- 4. University admins can see profiles from their university
-- This fixes the admin dashboard showing 0 alumni
CREATE POLICY "profiles_university_admin_access" ON profiles 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM auth.users au
        WHERE au.id = auth.uid() 
        AND (au.raw_user_meta_data->>'role' = 'university_admin' OR au.raw_user_meta_data->>'role' = 'super_admin')
        AND (
            au.raw_user_meta_data->>'role' = 'super_admin' 
            OR au.raw_user_meta_data->>'university_id' = profiles.university_id::text
        )
    )
);

-- 5. Allow public read access to approved universities (needed for signup)
-- This ensures the relationship queries work
CREATE POLICY "profiles_public_university_members" ON profiles 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM universities u 
        WHERE u.id = profiles.university_id 
        AND u.approved = true
    )
);

-- Step 5: Test the fix
-- Check if we can now access profiles
SELECT 
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'alumni' THEN 1 END) as alumni_count,
    COUNT(CASE WHEN role = 'student' THEN 1 END) as student_count,
    COUNT(CASE WHEN role = 'university_admin' THEN 1 END) as admin_count
FROM profiles;

-- Check specific harsh profiles
SELECT full_name, email, role, university_id 
FROM profiles 
WHERE full_name ILIKE '%harsh%';

-- Test alumni query that admin dashboard would use
SELECT 
    p.full_name, p.email, p.role, p.university_id, u.name as university_name
FROM profiles p
LEFT JOIN universities u ON u.id = p.university_id
WHERE p.role = 'alumni'
LIMIT 5;