-- DEFINITIVE RLS FIX - Remove All Conflicting Policies
-- This script completely cleans up and recreates the profiles RLS policies

-- Step 1: Disable RLS temporarily to clean up
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies on profiles table (remove conflicts)
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "University admins can view profiles from their university" ON profiles;

-- Step 3: Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Create NEW policies with unique names (avoid conflicts)
CREATE POLICY "profile_select_own" ON profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profile_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

-- CRITICAL: Simple INSERT policy that allows profile creation
CREATE POLICY "profile_insert_new" ON profiles FOR INSERT WITH CHECK (
    -- Allow any authenticated user to create profiles
    -- This fixes the signup issue
    auth.uid() IS NOT NULL
);

-- University admin access policy
CREATE POLICY "profile_select_university_admin" ON profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.role = 'university_admin' 
        AND p.university_id = profiles.university_id
    )
);

-- Super admin access policy  
CREATE POLICY "profile_select_super_admin" ON profiles FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.role = 'super_admin'
    )
);

-- Step 5: Recreate the trigger function (ensure it works)
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- Bypasses RLS using function owner's permissions
AS $$
BEGIN
    INSERT INTO public.profiles (
        id,
        email,
        full_name,
        role,
        university_id,
        verified
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'role', 'alumni'),
        CASE 
            WHEN NEW.raw_user_meta_data->>'university_id' IS NOT NULL 
            AND NEW.raw_user_meta_data->>'university_id' != '' 
            THEN (NEW.raw_user_meta_data->>'university_id')::uuid
            ELSE NULL
        END,
        COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
    );
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log error and continue (don't block user creation)
        RAISE LOG 'Profile creation failed for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Step 6: Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 7: Function to sync existing auth users (create missing profiles)
-- First drop the existing function to avoid return type conflicts
DROP FUNCTION IF EXISTS public.sync_existing_auth_users();

CREATE OR REPLACE FUNCTION public.sync_existing_auth_users()
RETURNS TABLE(result TEXT, user_id UUID, email TEXT, error TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT au.id, au.email, au.raw_user_meta_data, au.email_confirmed_at, au.created_at
        FROM auth.users au
        LEFT JOIN profiles p ON p.id = au.id
        WHERE p.id IS NULL  -- Only users without profiles
    LOOP
        BEGIN
            INSERT INTO public.profiles (
                id,
                email,
                full_name,
                role,
                university_id,
                verified,
                created_at
            ) VALUES (
                user_record.id,
                user_record.email,
                COALESCE(user_record.raw_user_meta_data->>'full_name', split_part(user_record.email, '@', 1)),
                COALESCE(user_record.raw_user_meta_data->>'role', 'alumni'),
                CASE 
                    WHEN user_record.raw_user_meta_data->>'university_id' IS NOT NULL 
                    AND user_record.raw_user_meta_data->>'university_id' != '' 
                    THEN (user_record.raw_user_meta_data->>'university_id')::uuid
                    ELSE NULL
                END,
                COALESCE(user_record.email_confirmed_at IS NOT NULL, false),
                user_record.created_at
            );
            
            RETURN QUERY SELECT 'SUCCESS'::TEXT, user_record.id, user_record.email, NULL::TEXT;
            
        EXCEPTION
            WHEN others THEN
                RETURN QUERY SELECT 'FAILED'::TEXT, user_record.id, user_record.email, SQLERRM::TEXT;
        END;
    END LOOP;
    
    RETURN;
END;
$$;

-- Step 8: Execute the sync function to create missing profiles
SELECT * FROM sync_existing_auth_users();

-- Step 9: Verify the fix worked
SELECT 
    COUNT(*) as total_auth_users,
    (SELECT COUNT(*) FROM profiles) as total_profiles,
    (SELECT COUNT(*) FROM profiles WHERE full_name ILIKE '%harsh%') as harsh_profiles
FROM auth.users;