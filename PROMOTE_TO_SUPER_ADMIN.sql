-- Convert university admin to super admin directly
UPDATE profiles 
SET role = 'super_admin',
    updated_at = NOW()
WHERE email = '22BCS15891@cuchd.in';

-- Verify the change worked
SELECT 
    email,
    full_name,
    role,
    university_id,
    updated_at
FROM profiles 
WHERE email = '22BCS15891@cuchd.in';