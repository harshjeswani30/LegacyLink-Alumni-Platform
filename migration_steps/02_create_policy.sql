-- Create improved RLS policy
-- Step 2 of 4

CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (
    auth.uid() = id 
    OR 
    auth.jwt()->>'role' = 'service_role'
    OR
    current_setting('role') = 'postgres'
);