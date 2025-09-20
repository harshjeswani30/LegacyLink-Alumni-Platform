-- Drop restrictive RLS policy
-- Step 1 of 4

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;