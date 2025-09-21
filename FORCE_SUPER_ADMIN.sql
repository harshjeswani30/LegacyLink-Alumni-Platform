-- Force change your role to super_admin directly via SQL
-- This bypasses the admin promotion tool entirely

-- First, find your exact account
SELECT 
    id,
    email,
    full_name,
    role,
    university_id,
    updated_at
FROM profiles 
WHERE email ILIKE '%22bcs15891%' 
   OR email ILIKE '%cuchd%'
ORDER BY created_at DESC;

-- Update your role to super_admin (replace with your exact email from above)
UPDATE profiles 
SET role = 'super_admin',
    updated_at = NOW()
WHERE email = '22bcs15891@cuchd.in';

-- Alternative: Update by partial email match if exact doesn't work
UPDATE profiles 
SET role = 'super_admin',
    updated_at = NOW()
WHERE email ILIKE '%22bcs15891%cuchd%';

-- Verify the change worked
SELECT 
    email,
    full_name,
    role,
    university_id,
    updated_at
FROM profiles 
WHERE email ILIKE '%22bcs15891%';