-- Complete Fix for Profile Creation Issue
-- This addresses the trigger not working issue

-- First, ensure the RLS policy allows trigger functions to insert
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
    OR
    -- Allow anonymous context during trigger execution
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
);

-- Create or recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
BEGIN
    -- Log the trigger execution
    RAISE LOG 'handle_new_user triggered for user: %', NEW.id;
    
    -- Insert profile with error handling
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
            COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
            COALESCE(NEW.raw_user_meta_data->>'role', 'alumni'),
            CASE 
                WHEN NEW.raw_user_meta_data->>'university_id' IS NOT NULL 
                AND NEW.raw_user_meta_data->>'university_id' != '' 
                THEN (NEW.raw_user_meta_data->>'university_id')::uuid
                ELSE NULL
            END,
            COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
        );
        
        RAISE LOG 'Profile created successfully for user: %', NEW.id;
        
    EXCEPTION
        WHEN others THEN
            RAISE LOG 'Error creating profile for user %: % - %', NEW.id, SQLERRM, SQLSTATE;
            -- Don't prevent user creation if profile creation fails
    END;
    
    RETURN NEW;
END;
$$;

-- Drop and recreate the trigger to ensure it's properly installed
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Create a function to manually create a profile for the existing "harsh" user
CREATE OR REPLACE FUNCTION public.create_profile_for_harsh()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    harsh_user RECORD;
BEGIN
    -- Find the auth user for "harsh"
    SELECT au.id, au.email, au.raw_user_meta_data, au.email_confirmed_at
    INTO harsh_user
    FROM auth.users au
    WHERE au.raw_user_meta_data->>'full_name' ILIKE '%harsh%'
       OR au.email ILIKE '%harsh%'
    LIMIT 1;
    
    IF harsh_user.id IS NOT NULL THEN
        -- Create the profile manually
        INSERT INTO public.profiles (
            id,
            email,
            full_name,
            role,
            university_id,
            verified
        ) VALUES (
            harsh_user.id,
            harsh_user.email,
            COALESCE(harsh_user.raw_user_meta_data->>'full_name', 'Harsh'),
            COALESCE(harsh_user.raw_user_meta_data->>'role', 'alumni'),
            CASE 
                WHEN harsh_user.raw_user_meta_data->>'university_id' IS NOT NULL 
                AND harsh_user.raw_user_meta_data->>'university_id' != '' 
                THEN (harsh_user.raw_user_meta_data->>'university_id')::uuid
                ELSE NULL
            END,
            COALESCE(harsh_user.email_confirmed_at IS NOT NULL, false)
        );
        
        RAISE LOG 'Profile created for harsh: %', harsh_user.id;
    ELSE
        RAISE LOG 'No auth user found for harsh';
    END IF;
    
EXCEPTION
    WHEN others THEN
        RAISE LOG 'Error creating profile for harsh: % - %', SQLERRM, SQLSTATE;
END;
$$;