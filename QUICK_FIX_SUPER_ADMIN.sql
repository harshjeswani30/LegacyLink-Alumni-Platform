-- Quick fix: Make your admin user a super_admin to see ALL unverified users
-- (Replace 'your-admin-email@example.com' with your actual admin email)

UPDATE profiles 
SET role = 'super_admin',
    updated_at = NOW()
WHERE email = 'your-admin-email@example.com';  -- Replace with your admin email

-- Super admins can see all unverified users regardless of university