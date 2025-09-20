-- FINAL CLEANUP - Fix Policy Recursion Issue
-- The admin policies are causing infinite recursion because they reference the same table

-- Step 1: Disable RLS temporarily
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies to remove recursion
DROP POLICY IF EXISTS "profile_select_own" ON profiles;
DROP POLICY IF EXISTS "profile_update_own" ON profiles;
DROP POLICY IF EXISTS "profile_insert_new" ON profiles;
DROP POLICY IF EXISTS "profile_select_university_admin" ON profiles;
DROP POLICY IF EXISTS "profile_select_super_admin" ON profiles;

-- Step 3: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create SIMPLE policies without recursion
-- Basic user access
CREATE POLICY "profile_own_access" ON profiles FOR ALL USING (auth.uid() = id);

-- Simple INSERT policy for new signups
CREATE POLICY "profile_create_new" ON profiles FOR INSERT WITH CHECK (
    auth.uid() = id OR auth.uid() IS NOT NULL
);

-- Admin access without recursion - use direct role check from JWT
CREATE POLICY "profile_admin_access" ON profiles FOR SELECT USING (
    (auth.jwt()->>'role')::text = 'service_role' 
    OR 
    (auth.jwt()->'user_metadata'->>'role')::text IN ('super_admin', 'university_admin')
);

-- Test the fix - this should work now
SELECT COUNT(*) as total_profiles FROM profiles;