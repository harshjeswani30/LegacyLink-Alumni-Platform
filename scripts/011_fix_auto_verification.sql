-- Fix automatic verification issue
-- New profiles should NOT be automatically verified, they should require admin approval

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
        verified  -- This should ALWAYS be false for new users
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        COALESCE(NEW.raw_user_meta_data->>'role', 'alumni'),
        (NEW.raw_user_meta_data->>'university_id')::uuid,
        false  -- NEVER auto-verify - require admin approval
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

-- Also remove the email confirmation trigger that might auto-verify
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;