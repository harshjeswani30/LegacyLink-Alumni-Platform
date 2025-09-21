-- Emergency: Create super admin account directly
-- ONLY use this if normal signup doesn't work

-- First create auth.users entry (this is complex, better to use signup)
-- Instead, let's promote an existing account to super_admin

-- Option A: Find any existing account and promote it
SELECT email, role FROM profiles ORDER BY created_at DESC LIMIT 5;

-- Option B: Promote the most recent account to super_admin
UPDATE profiles 
SET role = 'super_admin',
    updated_at = NOW()
WHERE id = (
    SELECT id FROM profiles 
    WHERE role != 'super_admin' 
    ORDER BY created_at DESC 
    LIMIT 1
);

-- Check the result
SELECT email, full_name, role, created_at 
FROM profiles 
WHERE role = 'super_admin';