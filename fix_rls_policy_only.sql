-- Fix RLS Policy for Profile Creation
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (
    -- Allow users to insert their own profile
    auth.uid() = id 
    OR 
    -- Allow the system (via service role) to insert profiles during signup
    auth.jwt()->>'role' = 'service_role'
    OR
    -- Allow the handle_new_user function to insert profiles (using definer's rights)
    current_setting('role') = 'postgres'
);