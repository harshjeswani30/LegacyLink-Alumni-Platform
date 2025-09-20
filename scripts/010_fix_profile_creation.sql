-- Fix Profile Creation Issue
-- This script creates an automatic profile creation system for new user signups

-- Drop existing restrictive RLS policy for profile insertion
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;

-- Create improved RLS policy that allows both user inserts and system inserts
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

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- This allows the function to bypass RLS
AS $$
BEGIN
    -- Extract metadata from the new user
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
        (NEW.raw_user_meta_data->>'university_id')::uuid,
        COALESCE(NEW.email_confirmed_at IS NOT NULL, false)
    );
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log the error (you can view this in Supabase logs)
        RAISE LOG 'Error in handle_new_user: %', SQLERRM;
        -- Don't prevent user creation if profile creation fails
        RETURN NEW;
END;
$$;

-- Create trigger to automatically create profile when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_new_user();

-- Also create trigger to update profile verification when email is confirmed
CREATE OR REPLACE FUNCTION public.handle_user_email_confirmed() 
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Update profile verification status when email is confirmed
    IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
        UPDATE public.profiles 
        SET verified = true 
        WHERE id = NEW.id;
    END IF;
    
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        RAISE LOG 'Error in handle_user_email_confirmed: %', SQLERRM;
        RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
CREATE TRIGGER on_auth_user_email_confirmed
    AFTER UPDATE ON auth.users
    FOR EACH ROW 
    EXECUTE FUNCTION public.handle_user_email_confirmed();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, service_role;
GRANT EXECUTE ON FUNCTION public.handle_user_email_confirmed() TO postgres, service_role;

-- Create a manual sync function for existing users without profiles
CREATE OR REPLACE FUNCTION public.sync_existing_auth_users()
RETURNS TABLE(
    users_processed integer,
    profiles_created integer,
    errors_encountered integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
    processed_count integer := 0;
    created_count integer := 0;
    error_count integer := 0;
BEGIN
    -- Process users in auth.users that don't have profiles
    FOR user_record IN 
        SELECT au.id, au.email, au.raw_user_meta_data, au.email_confirmed_at
        FROM auth.users au
        LEFT JOIN public.profiles p ON au.id = p.id
        WHERE p.id IS NULL
    LOOP
        BEGIN
            INSERT INTO public.profiles (
                id,
                email,
                full_name,
                role,
                university_id,
                verified
            ) VALUES (
                user_record.id,
                user_record.email,
                COALESCE(user_record.raw_user_meta_data->>'full_name', user_record.email),
                COALESCE(user_record.raw_user_meta_data->>'role', 'alumni'),
                (user_record.raw_user_meta_data->>'university_id')::uuid,
                COALESCE(user_record.email_confirmed_at IS NOT NULL, false)
            );
            
            created_count := created_count + 1;
        EXCEPTION
            WHEN others THEN
                error_count := error_count + 1;
                RAISE LOG 'Error syncing user %: %', user_record.id, SQLERRM;
        END;
        
        processed_count := processed_count + 1;
    END LOOP;
    
    RETURN QUERY SELECT processed_count, created_count, error_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_existing_auth_users() TO postgres, service_role;

-- Add comments for documentation
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates a profile when a new user signs up';
COMMENT ON FUNCTION public.handle_user_email_confirmed() IS 'Updates profile verification when user confirms email';
COMMENT ON FUNCTION public.sync_existing_auth_users() IS 'Creates profiles for existing auth.users without profiles';