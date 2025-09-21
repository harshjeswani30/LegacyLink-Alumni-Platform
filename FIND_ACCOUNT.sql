-- Check if the account exists and what the exact email format is
-- Run this in Supabase SQL Editor to find your account

-- 1. Check for exact email match
SELECT 
    id,
    email,
    full_name,
    role,
    university_id,
    verified,
    created_at
FROM profiles 
WHERE email = '22BCS15891@cuchd.in';

-- 2. Check for similar emails (case-insensitive, partial match)
SELECT 
    id,
    email,
    full_name,
    role,
    university_id,
    verified,
    created_at
FROM profiles 
WHERE email ILIKE '%22BCS15891%' 
   OR email ILIKE '%cuchd%';

-- 3. Check all recently created accounts
SELECT 
    id,
    email,
    full_name,
    role,
    university_id,
    verified,
    created_at
FROM profiles 
WHERE created_at > NOW() - INTERVAL '2 hours'
ORDER BY created_at DESC;

-- 4. Check if account exists in auth.users but not profiles
SELECT 
    au.id,
    au.email,
    au.created_at as auth_created,
    au.email_confirmed_at,
    p.email as profile_email,
    p.created_at as profile_created
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE au.email ILIKE '%22BCS15891%' 
   OR au.email ILIKE '%cuchd%';